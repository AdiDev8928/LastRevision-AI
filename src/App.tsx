import React, { useState, useEffect } from 'react';
import { Exam, Topic, Material, RevisionStats, TopicPriority, TopicStatus } from './types';
import ExamList from './components/ExamList';
import Dashboard from './components/Dashboard';
import TopicRevision from './components/TopicRevision';
import { BookOpen, Sparkles, CheckCircle2, AlertTriangle, GraduationCap } from 'lucide-react';

export default function App() {
  // Navigation
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState<RevisionStats>({
    totalTopics: 0,
    missedTopics: 0,
    reviewingTopics: 0,
    completedTopics: 0,
    highPriorityCount: 0,
  });

  // UI Status
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- API Calls ---

  // 1. Fetch Exams
  const fetchExams = async () => {
    setIsLoadingExams(true);
    setApiError(null);
    try {
      const res = await fetch('/api/exams');
      if (!res.ok) throw new Error('Failed to retrieve exams list.');
      const data = await res.json();
      setExams(data);
    } catch (err: any) {
      setApiError(err.message || 'API connection failed. Express server might be sleeping.');
    } finally {
      setIsLoadingExams(false);
    }
  };

  // 2. Fetch Topics & Stats for Selected Exam
  const fetchTopicsAndStats = async (examId: string) => {
    setIsLoadingTopics(true);
    try {
      // Fetch topics
      const topicsRes = await fetch(`/api/exams/${examId}/topics`);
      if (!topicsRes.ok) throw new Error('Failed to retrieve topics for selected exam.');
      const topicsData = await topicsRes.json();
      setTopics(topicsData);

      // Fetch stats
      const statsRes = await fetch(`/api/exams/${examId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to update dashboard data.');
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // 3. Fetch Materials for Selected Topic
  const fetchMaterials = async (topicId: string) => {
    setIsLoadingMaterials(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/materials`);
      if (!res.ok) throw new Error('Failed to retrieve materials for topic.');
      const data = await res.json();
      setMaterials(data);
    } catch (err: any) {
      setApiError(err.message || 'Failed to fetch study materials.');
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchExams();
  }, []);

  // Sync dashboard if selectedExam changes
  useEffect(() => {
    if (selectedExam) {
      fetchTopicsAndStats(selectedExam.id);
    } else {
      setTopics([]);
      setStats({
        totalTopics: 0,
        missedTopics: 0,
        reviewingTopics: 0,
        completedTopics: 0,
        highPriorityCount: 0,
      });
    }
  }, [selectedExam]);

  // Sync revision panel if selectedTopic changes
  useEffect(() => {
    if (selectedTopic) {
      fetchMaterials(selectedTopic.id);
    } else {
      setMaterials([]);
    }
  }, [selectedTopic]);

  // --- Mutation Actions ---

  // Add Exam
  const handleAddExam = async (title: string, description: string, date: string) => {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, date }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to save new exam.');
    }
    await fetchExams();
  };

  // Delete Exam
  const handleDeleteExam = async (id: string) => {
    const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Failed to remove exam.');
    }
    if (selectedExam?.id === id) {
      setSelectedExam(null);
      setSelectedTopic(null);
    }
    await fetchExams();
  };

  // Add Topic
  const handleAddTopic = async (title: string, priority: TopicPriority) => {
    if (!selectedExam) return;
    const res = await fetch(`/api/exams/${selectedExam.id}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, priority }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to add topic.');
    }
    await fetchTopicsAndStats(selectedExam.id);
  };

  // Delete Topic
  const handleDeleteTopic = async (id: string) => {
    const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to remove topic.');
    if (selectedTopic?.id === id) {
      setSelectedTopic(null);
    }
    if (selectedExam) {
      await fetchTopicsAndStats(selectedExam.id);
    }
  };

  // Update Topic Status / Priority
  const handleUpdateTopicStatus = async (id: string, status: TopicStatus) => {
    const res = await fetch(`/api/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update topic state.');
    
    // Sync current selected topic state if it was the one modified
    if (selectedTopic?.id === id) {
      const updatedTopic = await res.json();
      setSelectedTopic(updatedTopic);
    }

    if (selectedExam) {
      await fetchTopicsAndStats(selectedExam.id);
    }
  };

  // Upload/Generate Material
  const handleUploadMaterial = async (name: string, fileType: 'image' | 'text' | 'document', content: string) => {
    if (!selectedTopic) return;
    const res = await fetch(`/api/topics/${selectedTopic.id}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, fileType, content }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Gemini AI was unable to structure your notes. Please verify your API key in Secrets panel.');
    }

    // Refresh everything
    await fetchMaterials(selectedTopic.id);
    if (selectedExam) {
      await fetchTopicsAndStats(selectedExam.id);
      // Retrieve the updated topic since status progressed to reviewing
      const refreshedTopics = await fetch(`/api/exams/${selectedExam.id}/topics`).then(r => r.json());
      const updated = refreshedTopics.find((t: Topic) => t.id === selectedTopic.id);
      if (updated) setSelectedTopic(updated);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (id: string) => {
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete material.');
    
    if (selectedTopic) {
      await fetchMaterials(selectedTopic.id);
      // Refresh topic status since it resets
      if (selectedExam) {
        await fetchTopicsAndStats(selectedExam.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans" id="applet-main-root">
      {/* Header Bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-sm" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedExam(null); setSelectedTopic(null); }}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <span className="font-sans font-bold text-md text-neutral-900 tracking-tight block leading-none">
                ReviseAI
              </span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest block mt-1">
                Last-Minute Study Revision
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-full text-xs font-semibold">
              <Sparkles size={12} className="text-neutral-500" />
              Gemini AI Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Connection/API error banners */}
        {apiError && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3 text-sm shadow-sm" id="api-error-banner">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Local Connection Issue</p>
              <p className="text-xs text-amber-700 mt-0.5">{apiError}</p>
            </div>
            <button 
              onClick={fetchExams}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 bg-white border border-amber-200 rounded-lg hover:border-indigo-200 transition-all"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* Global Loading screen */}
        {isLoadingExams && exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3" id="global-spinner">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-semibold text-sm">Synchronizing your academic plans...</p>
          </div>
        ) : (
          /* Central Router State Router */
          <div id="router-container">
            {selectedTopic ? (
              <TopicRevision
                topic={selectedTopic}
                materials={materials}
                onBack={() => setSelectedTopic(null)}
                onUploadMaterial={handleUploadMaterial}
                onDeleteMaterial={handleDeleteMaterial}
                onUpdateTopicStatus={handleUpdateTopicStatus}
              />
            ) : selectedExam ? (
              <Dashboard
                exam={selectedExam}
                topics={topics}
                stats={stats}
                onBack={() => setSelectedExam(null)}
                onSelectTopic={setSelectedTopic}
                onAddTopic={handleAddTopic}
                onDeleteTopic={handleDeleteTopic}
                onUpdateTopicStatus={handleUpdateTopicStatus}
              />
            ) : (
              <ExamList
                exams={exams}
                onSelectExam={setSelectedExam}
                onAddExam={handleAddExam}
                onDeleteExam={handleDeleteExam}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1">
          <p className="text-xs text-neutral-400 font-medium">
            Designed for stress-free final study laps. Take deep breaths, review cheat sheets, and active-recall!
          </p>
          <p className="text-[10px] text-neutral-300 font-mono">
            ReviseAI v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
