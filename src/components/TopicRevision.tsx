import React, { useState } from 'react';
import { Topic, Material, Flashcard, QuizQuestion, TopicStatus } from '../types';
import { ChevronLeft, Upload, FileText, Image as ImageIcon, BookOpen, Sparkles, Check, CheckCircle2, RotateCcw, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

interface TopicRevisionProps {
  topic: Topic;
  materials: Material[];
  onBack: () => void;
  onUploadMaterial: (name: string, fileType: 'image' | 'text' | 'document', content: string) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onUpdateTopicStatus: (id: string, status: TopicStatus) => Promise<void>;
}

export default function TopicRevision({
  topic,
  materials,
  onBack,
  onUploadMaterial,
  onDeleteMaterial,
  onUpdateTopicStatus,
}: TopicRevisionProps) {
  // Upload States
  const [uploadMode, setUploadMode] = useState<'text' | 'image' | 'document'>('text');
  const [noteText, setNoteText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Revision Deck States
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz'>('summary');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

  // Quiz States
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // questionId -> selectedIndex
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  // Helper to handle image files and convert to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (PNG/JPEG).');
        return;
      }
      setImageFile(file);
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to handle PDF files and convert to base64
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadError('Please select a valid PDF file.');
        return;
      }
      setPdfFile(file);
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (uploadMode === 'text' && !noteText.trim()) {
      setUploadError('Please enter or paste your study notes.');
      return;
    }
    if (uploadMode === 'image' && !imagePreview) {
      setUploadError('Please upload an image file of your notes.');
      return;
    }
    if (uploadMode === 'document' && !pdfPreview) {
      setUploadError('Please upload a PDF file of your notes.');
      return;
    }

    setIsProcessing(true);
    
    // Simulate multi-stage educational loading states to reassure stressed students!
    const stages = [
      'Scanning study notes content...',
      'Running Gemini Multimodal OCR...',
      'Identifying missed topics and concepts...',
      'Synthesizing 1-Minute Cheat Sheet...',
      'Formulating active-recall flashcards...',
      'Generating mock review quiz questions...'
    ];

    let stageIdx = 0;
    setProcessingStatus(stages[stageIdx]);
    const interval = setInterval(() => {
      if (stageIdx < stages.length - 1) {
        stageIdx++;
        setProcessingStatus(stages[stageIdx]);
      }
    }, 1800);

    try {
      if (uploadMode === 'text') {
        await onUploadMaterial(
          `Notes_${new Date().toISOString().substr(0, 10)}.txt`,
          'text',
          noteText
        );
      } else if (uploadMode === 'image') {
        await onUploadMaterial(
          imageFile?.name || 'PhotoNotes.png',
          'image',
          imagePreview!
        );
      } else {
        await onUploadMaterial(
          pdfFile?.name || 'DocumentNotes.pdf',
          'document',
          pdfPreview!
        );
      }
      // Reset upload fields
      setNoteText('');
      setImageFile(null);
      setImagePreview(null);
      setPdfFile(null);
      setPdfPreview(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to analyze material. Ensure Gemini API key is configured.');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Render Material revision deck
  const activeMaterial = materials[0]; // Take the latest analyzed revision deck

  // Reset interactive game decks
  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted({});
  };

  const handleQuizAnswer = (questionId: string, optionIndex: number) => {
    if (quizSubmitted[questionId]) return; // locked once selected
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setQuizSubmitted(prev => ({ ...prev, [questionId]: true }));
  };

  return (
    <div className="space-y-6" id="topic-revision-container">
      {/* Back and Toggle Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-neutral-500">Back to Dashboard</span>
        </div>

        {/* Status toggles */}
        <div className="flex items-center gap-2 bg-white border border-neutral-200 p-1.5 rounded-lg w-fit text-xs font-semibold shadow-sm">
          <span className="text-neutral-400 px-2 uppercase tracking-widest text-[9px]">Mark Status:</span>
          <button
            onClick={() => onUpdateTopicStatus(topic.id, 'missed')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              topic.status === 'missed' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Missed ⚠️
          </button>
          <button
            onClick={() => onUpdateTopicStatus(topic.id, 'reviewing')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              topic.status === 'reviewing' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Reviewing 🔄
          </button>
          <button
            onClick={() => onUpdateTopicStatus(topic.id, 'completed')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              topic.status === 'completed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Revised ✅
          </button>
        </div>
      </div>

      {/* Main title block */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          <span>Topic Study Deck</span>
          <span>•</span>
          <span className={`px-2 py-0.5 rounded font-bold uppercase ${
            topic.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-neutral-100 text-neutral-600'
          }`}>{topic.priority} priority</span>
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight mt-1">{topic.title}</h1>
      </div>

      {/* Conditional Rendering: Processing State */}
      {isProcessing ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto" id="loading-pack-state">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 border-4 border-neutral-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-md font-bold text-neutral-900 animate-pulse">{processingStatus}</h3>
          <p className="text-neutral-500 text-xs max-w-xs mx-auto leading-relaxed">
            Gemini is currently transcribing, summarizing, and writing quiz challenges from your notes. Please do not close this tab.
          </p>
        </div>
      ) : !activeMaterial ? (
        /* Upload Area */
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden max-w-3xl mx-auto" id="upload-revision-panel">
          {/* Toggle upload mode */}
          <div className="border-b border-neutral-200 flex">
            <button
              onClick={() => { setUploadMode('text'); setUploadError(null); }}
              className={`flex-1 py-3 text-center text-xs uppercase tracking-wider font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                uploadMode === 'text'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <FileText size={15} />
              Paste Study Text
            </button>
            <button
              onClick={() => { setUploadMode('image'); setUploadError(null); }}
              className={`flex-1 py-3 text-center text-xs uppercase tracking-wider font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                uploadMode === 'image'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <ImageIcon size={15} />
              Upload Image Notes
            </button>
            <button
              onClick={() => { setUploadMode('document'); setUploadError(null); }}
              className={`flex-1 py-3 text-center text-xs uppercase tracking-wider font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                uploadMode === 'document'
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <FileText size={15} />
              Upload PDF Notes
            </button>
          </div>

          <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
            {uploadError && (
              <div className="bg-neutral-100 border border-neutral-200 text-neutral-900 p-3 rounded-lg flex items-start gap-2 text-xs">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadMode === 'text' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Your Notes / Text Book Snippets</label>
                <textarea
                  placeholder="Paste lecture logs, textbook notes, website captures, or typed notes here..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm font-sans"
                />
              </div>
            ) : uploadMode === 'image' ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-neutral-200 hover:border-black rounded-xl p-8 text-center transition-colors relative cursor-pointer bg-neutral-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-neutral-400 h-10 w-10 mb-2" />
                  <p className="text-sm font-bold text-neutral-800">Click or drag photo here to upload</p>
                  <p className="text-xs text-neutral-400 mt-1">Supports PNG, JPG, JPEG (Snapshots of textbook/notebooks)</p>
                </div>

                {imagePreview && (
                  <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50 flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Notes preview"
                      className="h-16 w-16 object-cover rounded-lg border border-neutral-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-800 truncate">{imageFile?.name || 'Uploaded Photo'}</p>
                      <p className="text-[10px] text-neutral-400">{(imageFile ? imageFile.size / 1024 : 0).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="p-1.5 text-neutral-400 hover:text-black rounded hover:bg-neutral-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-neutral-200 hover:border-black rounded-xl p-8 text-center transition-colors relative cursor-pointer bg-neutral-50/50">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-neutral-400 h-10 w-10 mb-2" />
                  <p className="text-sm font-bold text-neutral-800">Click or drag PDF here to upload</p>
                  <p className="text-xs text-neutral-400 mt-1">Supports PDF (Syllabus, lectures, slides, notes)</p>
                </div>

                {pdfPreview && (
                  <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50 flex items-center gap-3">
                    <div className="p-2 bg-neutral-900 text-white rounded-lg flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-800 truncate">{pdfFile?.name || 'Uploaded PDF'}</p>
                      <p className="text-[10px] text-neutral-400">{(pdfFile ? pdfFile.size / 1024 : 0).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPdfFile(null); setPdfPreview(null); }}
                      className="p-1.5 text-neutral-400 hover:text-black rounded hover:bg-neutral-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Sparkles size={14} />
              Build Last-Minute Revision Pack
            </button>
          </form>
        </div>
      ) : (
        /* Revision Pack Active View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="active-revision-dashboard">
          
          {/* Left Column: Revision Tabs Navigation & Meta */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-1">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 mb-2">Revision Mode</h3>
              
              <button
                onClick={() => setActiveTab('summary')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <FileText size={14} />
                1-Min Cheat Sheet
              </button>

              <button
                onClick={() => {
                  setActiveTab('flashcards');
                  setCurrentFlashcardIndex(0);
                  setIsFlashcardFlipped(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'flashcards'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <BookOpen size={14} />
                Flashcards ({activeMaterial.flashcards.length})
              </button>

              <button
                onClick={() => {
                  setActiveTab('quiz');
                  handleResetQuiz();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'quiz'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <Sparkles size={14} />
                Micro-Quiz ({activeMaterial.quiz.length})
              </button>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Source Material</span>
                <span className="text-[9px] bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                  {activeMaterial.fileType}
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-700 truncate">{activeMaterial.name}</p>
              
              <button
                onClick={() => {
                  if (confirm('Delete this revision pack and upload new materials? This cannot be undone.')) {
                    onDeleteMaterial(activeMaterial.id);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Trash2 size={13} />
                Delete Revision Pack
              </button>
            </div>
          </div>

          {/* Right Column: Revision Pack Display Stage */}
          <div className="lg:col-span-3">
            {/* Tab 1: Cheat Sheet / Summary */}
            {activeTab === 'summary' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">1-Min Cheat Sheet</h2>
                    <p className="text-neutral-500 text-xs mt-0.5">High-density bullet takeaways and core summary for fast reading.</p>
                  </div>
                  <CheckCircle2 className="text-neutral-950 h-5 w-5" />
                </div>

                {/* Main summary paragraph */}
                <div className="prose prose-neutral max-w-none">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Core Summary</h3>
                  <div className="text-neutral-800 leading-relaxed text-sm bg-neutral-50 p-4 border border-neutral-200 rounded-xl">
                    {activeMaterial.summary}
                  </div>
                </div>

                {/* Key takeaways bullets */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Key Takeaways & Formulas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMaterial.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3.5 bg-white border border-neutral-200 rounded-xl hover:border-black transition-colors">
                        <span className="p-1 bg-neutral-900 text-white rounded-md mt-0.5 flex-shrink-0 text-[10px] font-bold font-mono h-5 w-5 flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-neutral-700 text-xs leading-relaxed">{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completed Action CTA */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Finished scanning the cheat sheet?</h4>
                    <p className="text-neutral-500 text-[11px] mt-0.5">Test your memory using active recall flashcards next!</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('flashcards');
                      setCurrentFlashcardIndex(0);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Start Flashcards
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Interactive Flashcards */}
            {activeTab === 'flashcards' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">Active-Recall Flashcards</h2>
                  <p className="text-neutral-500 text-xs mt-0.5">Click the card to flip it and reveal the answer. Verify your memory.</p>
                </div>

                {activeMaterial.flashcards.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-6">No flashcards generated for this topic.</p>
                ) : (
                  <div className="max-w-xl mx-auto space-y-6">
                    {/* The Flippable Physical Card */}
                    <div
                      onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                      className={`min-h-[220px] rounded-2xl border cursor-pointer p-8 flex flex-col justify-between transition-all duration-300 transform shadow-sm ${
                        isFlashcardFlipped
                          ? 'bg-black border-black text-white scale-100'
                          : 'bg-white border-neutral-200 hover:border-black hover:shadow-md'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          isFlashcardFlipped ? 'text-neutral-400' : 'text-neutral-400'
                        }`}>
                          {isFlashcardFlipped ? 'Answer Key (Revealed)' : 'Active Question'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                          isFlashcardFlipped ? 'bg-neutral-900 text-neutral-300 border border-neutral-800' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          Card {currentFlashcardIndex + 1} of {activeMaterial.flashcards.length}
                        </span>
                      </div>

                      {/* Card Core Content */}
                      <div className="py-6 text-center">
                        <p className={`font-semibold tracking-tight leading-relaxed text-md sm:text-lg ${
                          isFlashcardFlipped ? 'text-white' : 'text-neutral-900'
                        }`}>
                          {isFlashcardFlipped
                            ? activeMaterial.flashcards[currentFlashcardIndex]?.answer
                            : activeMaterial.flashcards[currentFlashcardIndex]?.question}
                        </p>
                      </div>

                      {/* Click to Flip Prompt Footer */}
                      <div className="text-center">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${
                          isFlashcardFlipped ? 'text-neutral-400' : 'text-black animate-pulse'
                        }`}>
                          Click Card to Flip
                        </span>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (currentFlashcardIndex > 0) {
                            setCurrentFlashcardIndex(currentFlashcardIndex - 1);
                            setIsFlashcardFlipped(false);
                          }
                        }}
                        disabled={currentFlashcardIndex === 0}
                        className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-50 transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        Previous Card
                      </button>

                      <div className="flex items-center gap-1">
                        {activeMaterial.flashcards.map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === currentFlashcardIndex ? 'w-4 bg-black' : 'w-1.5 bg-neutral-200'
                            }`}
                          />
                        ))}
                      </div>

                      {currentFlashcardIndex < activeMaterial.flashcards.length - 1 ? (
                        <button
                          onClick={() => {
                            setCurrentFlashcardIndex(currentFlashcardIndex + 1);
                            setIsFlashcardFlipped(false);
                          }}
                          className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Next Card
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveTab('quiz');
                            handleResetQuiz();
                          }}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Start Self-Quiz
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Self-Testing Quiz */}
            {activeTab === 'quiz' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">Self-Assessment Quiz</h2>
                    <p className="text-neutral-500 text-xs mt-0.5">Attempt these mock exam questions and verify your mastery with detailed feedback.</p>
                  </div>
                  <button
                    onClick={handleResetQuiz}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-lg text-xs font-semibold transition-colors self-start sm:self-center cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    Reset Quiz
                  </button>
                </div>

                {activeMaterial.quiz.length === 0 ? (
                  <p className="text-neutral-400 italic text-center py-6">No quiz questions generated for this topic.</p>
                ) : (
                  <div className="space-y-6">
                    {activeMaterial.quiz.map((q, qIndex) => {
                      const selectedIndex = quizAnswers[q.id];
                      const isSubmitted = quizSubmitted[q.id];
                      const isCorrect = selectedIndex === q.correctAnswerIndex;

                      return (
                        <div key={q.id} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs font-bold text-white bg-black px-2.5 py-1 rounded">
                              Q{qIndex + 1}
                            </span>
                            <h3 className="font-bold text-neutral-900 text-sm mt-0.5 leading-relaxed">{q.question}</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-12">
                            {q.options.map((opt, oIndex) => {
                              const isThisOptionSelected = selectedIndex === oIndex;
                              const isThisOptionCorrect = oIndex === q.correctAnswerIndex;

                              let optStyle = 'border-neutral-200 hover:border-black bg-white';
                              if (isSubmitted) {
                                if (isThisOptionCorrect) {
                                  optStyle = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold';
                                } else if (isThisOptionSelected) {
                                  optStyle = 'border-red-500 bg-red-50/50 text-red-950';
                                } else {
                                  optStyle = 'border-neutral-100 bg-neutral-50/50 opacity-50';
                                }
                              }

                              return (
                                <button
                                  key={oIndex}
                                  type="button"
                                  onClick={() => handleQuizAnswer(q.id, oIndex)}
                                  disabled={isSubmitted}
                                  className={`w-full text-left p-3.5 border rounded-xl text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${optStyle}`}
                                >
                                  <span>{opt}</span>
                                  {isSubmitted && isThisOptionCorrect && (
                                    <Check className="text-emerald-600 h-4 w-4 flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isSubmitted && (
                            <div className={`p-4 rounded-xl border pl-4 md:pl-12 animate-in fade-in duration-200 ${
                              isCorrect 
                                ? 'bg-emerald-50/30 border-emerald-100 text-emerald-900' 
                                : 'bg-red-50/30 border-red-100 text-red-900'
                            }`}>
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                <span>{isCorrect ? '✅ Correct Answer!' : '❌ Incorrect Selection'}</span>
                              </div>
                              <p className="text-neutral-600 text-xs leading-relaxed mt-1">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Final Action - Mark topic complete if quiz is completed */}
                    {Object.keys(quizSubmitted).length === activeMaterial.quiz.length && (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-center max-w-xl mx-auto space-y-3 shadow-sm">
                        <CheckCircle2 className="mx-auto text-neutral-900 h-10 w-10" />
                        <h3 className="text-lg font-extrabold text-neutral-950 tracking-tight">Quiz Complete!</h3>
                        <p className="text-neutral-600 text-xs max-w-sm mx-auto leading-relaxed">
                          You have answered all mock exam questions for {topic.title}. Are you feeling confident to mark this topic revised?
                        </p>
                        <button
                          onClick={() => onUpdateTopicStatus(topic.id, 'completed')}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                        >
                          Mark Topic Completed ✅
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
