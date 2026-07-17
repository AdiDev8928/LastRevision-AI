export interface Exam {
  id: string;
  title: string;
  description: string;
  date: string;
  createdAt: string;
}

export type TopicPriority = 'high' | 'medium' | 'low';
export type TopicStatus = 'missed' | 'reviewing' | 'completed';

export interface Topic {
  id: string;
  examId: string;
  title: string;
  priority: TopicPriority;
  status: TopicStatus;
  createdAt: string;
}

export type MaterialType = 'image' | 'document' | 'text';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Material {
  id: string;
  topicId: string;
  name: string;
  fileType: MaterialType;
  originalText: string;
  summary: string;
  keyPoints: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  createdAt: string;
}

export interface RevisionStats {
  totalTopics: number;
  missedTopics: number;
  reviewingTopics: number;
  completedTopics: number;
  highPriorityCount: number;
}
