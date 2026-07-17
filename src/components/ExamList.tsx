import React, { useState } from 'react';
import { Exam } from '../types';
import { Calendar, Plus, Trash2, BookOpen, Clock, AlertCircle } from 'lucide-react';

interface ExamListProps {
  exams: Exam[];
  onSelectExam: (exam: Exam) => void;
  onAddExam: (title: string, description: string, date: string) => Promise<void>;
  onDeleteExam: (id: string) => Promise<void>;
}

export default function ExamList({ exams, onSelectExam, onAddExam, onDeleteExam }: ExamListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAddExam(title, description, date);
      setTitle('');
      setDescription('');
      setDate('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysRemaining = (examDateStr: string) => {
    if (!examDateStr) return null;
    const examDate = new Date(examDateStr);
    const today = new Date();
    // Zero out times
    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6" id="exam-list-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            Revision Dashboard
          </h1>
          <p className="text-neutral-500 mt-2 text-sm">Select an upcoming exam or register a new one to begin your last-minute revisions.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors shadow-sm self-start sm:self-center text-sm"
          id="btn-add-exam-toggle"
        >
          <Plus size={16} />
          {showAddForm ? 'Cancel' : 'New Exam'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4 duration-200" id="add-exam-form">
          <h2 className="text-lg font-bold text-neutral-900">Add Exam Details</h2>
          
          {error && (
            <div className="bg-neutral-100 text-neutral-900 border border-neutral-200 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Exam Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MCAT Biology, Advanced Calculus, Bar Exam"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Exam Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm text-neutral-700"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Description / Notes</label>
            <textarea
              placeholder="What score are you targeting? Any key focus areas?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              disabled={isSubmitting}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Exam'}
            </button>
          </div>
        </form>
      )}

      {exams.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-200 rounded-2xl p-12 text-center" id="empty-exams-state">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-neutral-400 h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">No registered exams</h3>
          <p className="text-neutral-500 max-w-sm mx-auto mb-6 text-xs leading-relaxed">
            Add your upcoming examinations or topics you are preparing for, and we will help you build your fast study revision strategy.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors shadow-sm text-xs"
          >
            <Plus size={14} />
            Register Your First Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="exams-grid">
          {exams.map((exam) => {
            const daysRemaining = getDaysRemaining(exam.date);
            
            return (
              <div
                key={exam.id}
                id={`exam-card-${exam.id}`}
                className="bg-white border border-neutral-200 rounded-xl hover:border-black hover:shadow-sm transition-all cursor-pointer p-6 flex flex-col justify-between group"
                onClick={() => onSelectExam(exam)}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <span className="p-2.5 bg-neutral-100 text-neutral-800 rounded-lg border border-neutral-200">
                      <Calendar size={18} />
                    </span>
                    
                    {daysRemaining !== null && (
                      <span className={`text-[10px] tracking-wide uppercase px-2.5 py-1 rounded font-bold ${
                        daysRemaining === 0
                          ? 'bg-red-50 border border-red-100 text-red-700 animate-pulse'
                          : daysRemaining === 1
                          ? 'bg-amber-50 border border-amber-100 text-amber-800'
                          : daysRemaining > 1
                          ? 'bg-neutral-100 border border-neutral-200 text-neutral-800'
                          : 'bg-neutral-50 text-neutral-400 border border-neutral-100'
                      }`}>
                        {daysRemaining === 0 
                          ? 'Today ⚠️' 
                          : daysRemaining === 1 
                          ? 'Tomorrow ⏰' 
                          : daysRemaining > 1 
                          ? `${daysRemaining} days left` 
                          : 'Passed'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-neutral-900 text-lg group-hover:text-neutral-700 transition-colors">
                    {exam.title}
                  </h3>
                  
                  {exam.description && (
                    <p className="text-neutral-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(exam.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid triggering card selection
                      if (confirm('Are you sure you want to delete this exam? This will delete all topics, study notes and generated cards permanently.')) {
                        onDeleteExam(exam.id);
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-black rounded hover:bg-neutral-50 transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
