import fs from 'fs';
import path from 'path';
import { Exam, Topic, Material, RevisionStats } from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  exams: Exam[];
  topics: Topic[];
  materials: Material[];
}

class RelationalDatabase {
  private schema: DatabaseSchema = {
    exams: [],
    topics: [],
    materials: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.schema = JSON.parse(fileContent);
        // Ensure structure is sound
        if (!this.schema.exams) this.schema.exams = [];
        if (!this.schema.topics) this.schema.topics = [];
        if (!this.schema.materials) this.schema.materials = [];
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize relational database:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Exam Operations ---
  public getExams(): Exam[] {
    return this.schema.exams;
  }

  public getExamById(id: string): Exam | undefined {
    return this.schema.exams.find(e => e.id === id);
  }

  public createExam(title: string, description: string, date: string): Exam {
    const newExam: Exam = {
      id: 'exam_' + Math.random().toString(36).substr(2, 9),
      title,
      description,
      date,
      createdAt: new Date().toISOString(),
    };
    this.schema.exams.push(newExam);
    this.save();
    return newExam;
  }

  public deleteExam(id: string): boolean {
    const initialLength = this.schema.exams.length;
    this.schema.exams = this.schema.exams.filter(e => e.id !== id);
    
    if (this.schema.exams.length < initialLength) {
      // Relational Cascade: Delete associated topics and materials
      const topicsToDelete = this.schema.topics.filter(t => t.examId === id);
      const topicIds = topicsToDelete.map(t => t.id);
      
      this.schema.topics = this.schema.topics.filter(t => t.examId !== id);
      this.schema.materials = this.schema.materials.filter(m => !topicIds.includes(m.topicId));
      
      this.save();
      return true;
    }
    return false;
  }

  // --- Topic Operations ---
  public getTopics(examId?: string): Topic[] {
    if (examId) {
      return this.schema.topics.filter(t => t.examId === examId);
    }
    return this.schema.topics;
  }

  public getTopicById(id: string): Topic | undefined {
    return this.schema.topics.find(t => t.id === id);
  }

  public createTopic(examId: string, title: string, priority: 'high' | 'medium' | 'low', status: 'missed' | 'reviewing' | 'completed' = 'missed'): Topic {
    // Relational Foreign Key constraint check
    const examExists = this.schema.exams.some(e => e.id === examId);
    if (!examExists) {
      throw new Error(`Foreign Key Constraint Violated: Exam ID "${examId}" does not exist.`);
    }

    const newTopic: Topic = {
      id: 'topic_' + Math.random().toString(36).substr(2, 9),
      examId,
      title,
      priority,
      status,
      createdAt: new Date().toISOString(),
    };
    this.schema.topics.push(newTopic);
    this.save();
    return newTopic;
  }

  public updateTopic(id: string, updates: Partial<Omit<Topic, 'id' | 'examId' | 'createdAt'>>): Topic {
    const topicIndex = this.schema.topics.findIndex(t => t.id === id);
    if (topicIndex === -1) {
      throw new Error(`Topic with ID "${id}" not found.`);
    }

    this.schema.topics[topicIndex] = {
      ...this.schema.topics[topicIndex],
      ...updates,
    };
    this.save();
    return this.schema.topics[topicIndex];
  }

  public deleteTopic(id: string): boolean {
    const initialLength = this.schema.topics.length;
    this.schema.topics = this.schema.topics.filter(t => t.id !== id);
    
    if (this.schema.topics.length < initialLength) {
      // Relational Cascade: Delete associated materials
      this.schema.materials = this.schema.materials.filter(m => m.topicId !== id);
      this.save();
      return true;
    }
    return false;
  }

  // --- Material Operations ---
  public getMaterials(topicId?: string): Material[] {
    if (topicId) {
      return this.schema.materials.filter(m => m.topicId === topicId);
    }
    return this.schema.materials;
  }

  public getMaterialById(id: string): Material | undefined {
    return this.schema.materials.find(m => m.id === id);
  }

  public createMaterial(
    topicId: string,
    name: string,
    fileType: 'image' | 'document' | 'text',
    originalText: string,
    summary: string,
    keyPoints: string[],
    flashcards: any[],
    quiz: any[]
  ): Material {
    // Relational Foreign Key check
    const topicExists = this.schema.topics.some(t => t.id === topicId);
    if (!topicExists) {
      throw new Error(`Foreign Key Constraint Violated: Topic ID "${topicId}" does not exist.`);
    }

    const newMaterial: Material = {
      id: 'material_' + Math.random().toString(36).substr(2, 9),
      topicId,
      name,
      fileType,
      originalText,
      summary,
      keyPoints,
      flashcards,
      quiz,
      createdAt: new Date().toISOString(),
    };
    this.schema.materials.push(newMaterial);
    
    // Automatically progress status to "reviewing" if it was "missed"
    const topic = this.schema.topics.find(t => t.id === topicId);
    if (topic && topic.status === 'missed') {
      topic.status = 'reviewing';
    }

    this.save();
    return newMaterial;
  }

  public deleteMaterial(id: string): boolean {
    const initialLength = this.schema.materials.length;
    this.schema.materials = this.schema.materials.filter(m => m.id !== id);
    if (this.schema.materials.length < initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Relational Stats Operation ---
  public getStatsForExam(examId: string): RevisionStats {
    const examTopics = this.schema.topics.filter(t => t.examId === examId);
    return {
      totalTopics: examTopics.length,
      missedTopics: examTopics.filter(t => t.status === 'missed').length,
      reviewingTopics: examTopics.filter(t => t.status === 'reviewing').length,
      completedTopics: examTopics.filter(t => t.status === 'completed').length,
      highPriorityCount: examTopics.filter(t => t.priority === 'high').length,
    };
  }
}

export const db = new RelationalDatabase();
