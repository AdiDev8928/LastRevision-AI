import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/database';
import { generateRevisionMaterial } from './server/gemini';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use a generous size limit since users upload image photos of notes
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Exams Endpoints
  app.get('/api/exams', (req, res) => {
    try {
      const exams = db.getExams();
      res.json(exams);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch exams' });
    }
  });

  app.get('/api/exams/:id', (req, res) => {
    try {
      const exam = db.getExamById(req.params.id);
      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }
      res.json(exam);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch exam' });
    }
  });

  app.post('/api/exams', (req, res) => {
    try {
      const { title, description, date } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      const exam = db.createExam(title, description || '', date || '');
      res.status(201).json(exam);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create exam' });
    }
  });

  app.delete('/api/exams/:id', (req, res) => {
    try {
      const success = db.deleteExam(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Exam not found' });
      }
      res.json({ message: 'Exam and all cascaded topics and materials deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete exam' });
    }
  });

  // 2. Topics Endpoints
  app.get('/api/exams/:examId/topics', (req, res) => {
    try {
      const topics = db.getTopics(req.params.examId);
      res.json(topics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch topics' });
    }
  });

  app.post('/api/exams/:examId/topics', (req, res) => {
    try {
      const { title, priority, status } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Topic title is required' });
      }
      const topic = db.createTopic(
        req.params.examId,
        title,
        priority || 'medium',
        status || 'missed'
      );
      res.status(201).json(topic);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create topic' });
    }
  });

  app.patch('/api/topics/:id', (req, res) => {
    try {
      const { priority, status, title } = req.body;
      const updated = db.updateTopic(req.params.id, { priority, status, title });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update topic' });
    }
  });

  app.delete('/api/topics/:id', (req, res) => {
    try {
      const success = db.deleteTopic(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json({ message: 'Topic and associated materials deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete topic' });
    }
  });

  // 3. Materials & AI revision generation
  app.get('/api/topics/:topicId/materials', (req, res) => {
    try {
      const materials = db.getMaterials(req.params.topicId);
      res.json(materials);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch materials' });
    }
  });

  app.post('/api/topics/:topicId/materials', async (req, res) => {
    try {
      const { topicId } = req.params;
      const { name, fileType, content } = req.body; // content is base64 for image, or text string for notes

      if (!name || !fileType || !content) {
        return res.status(400).json({ error: 'Missing required fields: name, fileType, and content are required.' });
      }

      // Check if topic exists before running expensive AI operations
      const topic = db.getTopicById(topicId);
      if (!topic) {
        return res.status(404).json({ error: `Topic with ID "${topicId}" not found.` });
      }

      // Invoke Gemini to perform OCR, summarize, create key points, flashcards, and quiz questions
      const aiResponse = await generateRevisionMaterial(name, fileType, content);

      let originalTextPlaceholder = content;
      if (fileType === 'image') {
        originalTextPlaceholder = '[Transcribed Image Notes]';
      } else if (fileType === 'document') {
        originalTextPlaceholder = '[Transcribed PDF Notes]';
      }

      // Save into DB
      const material = db.createMaterial(
        topicId,
        name,
        fileType,
        originalTextPlaceholder,
        aiResponse.summary,
        aiResponse.keyPoints,
        // Assign IDs to flashcards and quiz questions
        aiResponse.flashcards.map((f, i) => ({ id: `fc_${Date.now()}_${i}`, ...f })),
        aiResponse.quiz.map((q, i) => ({ id: `qz_${Date.now()}_${i}`, ...q }))
      );

      res.status(201).json(material);
    } catch (err: any) {
      console.error('API Error in material creation:', err);
      res.status(500).json({ error: err.message || 'Failed to process material with AI' });
    }
  });

  app.delete('/api/materials/:id', (req, res) => {
    try {
      const success = db.deleteMaterial(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Material not found' });
      }
      res.json({ message: 'Material deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete material' });
    }
  });

  // 4. Stats Endpoints
  app.get('/api/exams/:examId/stats', (req, res) => {
    try {
      const stats = db.getStatsForExam(req.params.examId);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch stats' });
    }
  });


  // --- Vite Dev Server / Static Hosting ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve client router fallback for all other requests
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Revision Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical failure during server startup:", err);
});
