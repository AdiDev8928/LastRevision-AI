import React, { useState } from 'react';
import { Exam, Topic, TopicPriority, TopicStatus, RevisionStats } from '../types';
import { ChevronLeft, Plus, Play, CheckCircle2, Circle, AlertCircle, Sparkles, AlertTriangle, BookMarked, Trash2, ArrowRight } from 'lucide-react';

interface DashboardProps {
  exam: Exam;
  topics: Topic[];
  stats: RevisionStats;
  onBack: () => void;
  onSelectTopic: (topic: Topic) => void;
  onAddTopic: (title: string, priority: TopicPriority) => Promise<void>;
  onDeleteTopic: (id: string) => Promise<void>;
  onUpdateTopicStatus: (id: string, status: TopicStatus) => Promise<void>;
}

export default function Dashboard({
  exam,
  topics,
  stats,
  onBack,
  onSelectTopic,
  onAddTopic,
  onDeleteTopic,
  onUpdateTopicStatus,
}: DashboardProps) {
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [priority, setPriority] = useState<TopicPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddTopic(topicTitle, priority);
      setTopicTitle('');
      setPriority('medium');
      setShowAddTopic(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group topics
  const missedTopics = topics.filter((t) => t.status === 'missed');
  const reviewingTopics = topics.filter((t) => t.status === 'reviewing');
  const completedTopics = topics.filter((t) => t.status === 'completed');

  // Compute revision progress percentage
  const total = topics.length;
  const progressPercent = total > 0 ? Math.round((completedTopics.length / total) * 100) : 0;

  return (
    <div className="space-y-6" id="exam-dashboard-container">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
          id="btn-back-to-exams"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-neutral-500">Exams</span>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-bold text-neutral-900">{exam.title}</span>
      </div>

      {/* Main Title & Description */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6" id="exam-header-card">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">{exam.title}</h1>
          {exam.description && <p className="text-neutral-500 text-sm max-w-2xl leading-relaxed">{exam.description}</p>}
          {exam.date && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded w-fit mt-2">
              <span>Exam Date: {new Date(exam.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
          )}
        </div>

        {/* Progress Circle Visualizer */}
        <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200 min-w-[210px]" id="exam-progress-summary">
          <div className="relative h-14 w-14 flex-shrink-0">
            {/* SVG circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                className="stroke-neutral-200 fill-none"
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                className="stroke-black fill-none transition-all duration-500"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - progressPercent / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-neutral-900">
              {progressPercent}%
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Completed</h4>
            <p className="text-sm font-bold text-neutral-800 mt-0.5">
              {completedTopics.length} of {topics.length} Topics
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Missed Topics</span>
          <span className="text-3xl font-mono font-extrabold text-neutral-900 mt-3 flex items-center gap-1.5">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {stats.missedTopics}
          </span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">In Revision</span>
          <span className="text-3xl font-mono font-extrabold text-neutral-900 mt-3 flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-blue-400" />
            {stats.reviewingTopics}
          </span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Completed</span>
          <span className="text-3xl font-mono font-extrabold text-neutral-900 mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            {stats.completedTopics}
          </span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">High Priority</span>
          <span className="text-3xl font-mono font-extrabold text-neutral-900 mt-3 flex items-center gap-1.5">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {stats.highPriorityCount}
          </span>
        </div>
      </div>

      {/* Action Area: Add Topic & Topics List */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Topic Lists */}
        <div className="xl:col-span-2 space-y-6" id="topics-lists-group">
          
          {/* List 1: Missed Topics */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Missed Topics & Delayed Lectures ({missedTopics.length})
              </h2>
              <span className="text-[9px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 uppercase tracking-wider px-2 py-0.5 rounded">
                High Urgency
              </span>
            </div>

            {missedTopics.length === 0 ? (
              <p className="text-neutral-400 text-xs italic py-6 text-center">No missed topics left! Fantastic job keeping up.</p>
            ) : (
              <div className="space-y-3">
                {missedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="group border border-neutral-100 rounded-xl p-4 hover:border-black hover:bg-neutral-50/50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                          topic.priority === 'high' 
                            ? 'bg-red-50 text-red-700 border border-red-100' 
                            : topic.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {topic.priority} priority
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-800 text-sm mt-2">{topic.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        onClick={() => {
                          if (confirm('Delete this topic?')) onDeleteTopic(topic.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-black rounded hover:bg-neutral-100 transition-colors"
                        title="Delete Topic"
                      >
                        <Trash2 size={15} />
                      </button>

                      <button
                        onClick={() => onSelectTopic(topic)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      >
                        <Play size={10} fill="white" />
                        Fast Revise
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List 2: Topics in Revision */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                Currently Reviewing ({reviewingTopics.length})
              </h2>
            </div>

            {reviewingTopics.length === 0 ? (
              <p className="text-neutral-400 text-xs italic py-6 text-center">No active revisions. Upload material to a missed topic to start.</p>
            ) : (
              <div className="space-y-3">
                {reviewingTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="group border border-neutral-100 rounded-xl p-4 hover:border-black hover:bg-neutral-50/50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                          topic.priority === 'high' 
                            ? 'bg-red-50 text-red-700 border border-red-100' 
                            : topic.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {topic.priority} priority
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-800 text-sm mt-2">{topic.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        onClick={() => {
                          if (confirm('Delete this topic?')) onDeleteTopic(topic.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-black rounded hover:bg-neutral-100 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>

                      <button
                        onClick={() => onUpdateTopicStatus(topic.id, 'completed')}
                        className="p-1.5 text-neutral-400 hover:text-emerald-600 rounded hover:bg-neutral-100 transition-colors"
                        title="Mark Completed"
                      >
                        <Circle size={15} />
                      </button>

                      <button
                        onClick={() => onSelectTopic(topic)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-colors border border-neutral-200"
                      >
                        Open Study Deck
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List 3: Completed/Revised Topics */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Revised & Confident ({completedTopics.length})
              </h2>
            </div>

            {completedTopics.length === 0 ? (
              <p className="text-neutral-400 text-xs italic py-6 text-center">Complete your first revision session to see it here!</p>
            ) : (
              <div className="space-y-3">
                {completedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="group border border-neutral-100 rounded-xl p-4 hover:border-black hover:bg-neutral-50/50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-neutral-500 text-sm line-through decoration-neutral-300">{topic.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        onClick={() => {
                          if (confirm('Delete this topic?')) onDeleteTopic(topic.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-black rounded hover:bg-neutral-100 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>

                      <button
                        onClick={() => onUpdateTopicStatus(topic.id, 'reviewing')}
                        className="p-1.5 text-emerald-600 hover:text-neutral-500 rounded hover:bg-neutral-100 transition-colors"
                        title="Re-open study"
                      >
                        <CheckCircle2 size={15} />
                      </button>

                      <button
                        onClick={() => onSelectTopic(topic)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-bold transition-colors border border-neutral-200"
                      >
                        View Summary
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Add Topic Block */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
              <BookMarked className="text-neutral-700 h-5 w-5" />
              Register Topic / Lecture
            </h3>
            <p className="text-neutral-500 text-xs leading-relaxed">
              Did you miss a key topic during lecture or run out of study time? Add it here. We will prioritize it for revision cards and summaries.
            </p>

            <form onSubmit={handleAddTopicSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Topic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krebs Cycle, Fourier Series"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Study Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TopicPriority)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-xs"
                >
                  <option value="high">🚨 High Priority (Critical exam weight)</option>
                  <option value="medium">⚡ Medium Priority (Highly likely)</option>
                  <option value="low">🌱 Low Priority (Bonus points)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                disabled={isSubmitting}
              >
                <Plus size={14} />
                {isSubmitting ? 'Adding...' : 'Register Topic'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
