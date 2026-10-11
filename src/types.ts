export type UserRole = 'supreme_obster' | 'supreme_kunda5' | 'admin' | 'member';
export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type SubjectCategory =
  | 'Mathematics'
  | 'Biology'
  | 'Physics'
  | 'Chemistry'
  | 'Computer Science'
  | 'Languages';

export interface UserProfile {
  uid: string;
  name: string;
  role: UserRole;
  status: MembershipStatus;
  approvedAt: string;
  expiresAt: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CourseItem {
  id: string;
  code: string;
  title: string;
  year: 1 | 2 | 3 | 4;
  subject: SubjectCategory;
  description: string;
  createdBy: string;
  createdAt?: unknown;
}

export interface MaterialItem {
  id: string;
  title: string;
  courseCode: string;
  category: 'Notes' | 'Assignment Questions';
  description: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt?: unknown;
}

export interface VideoTutorialItem {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  videoUrl: string;
  duration: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt?: unknown;
}

export interface AssignmentQuestionItem {
  id: string;
  studentId: string;
  studentName: string;
  courseCode: string;
  title: string;
  questionText: string;
  status: 'open' | 'answered';
  answerText: string;
  answeredBy: string;
  answeredByName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DiscussionPostItem {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  courseCode: string;
  groupTitle: string;
  message: string;
  createdAt?: unknown;
}

export interface EmailLogItem {
  id: string;
  recipientUid: string;
  recipientEmail: string;
  subject: string;
  body: string;
  eventType: 'APPROVED' | 'REJECTED' | 'RENEWED' | 'ROLE_CHANGED';
  sentByUid: string;
  createdAt?: unknown;
}

export interface FlashcardItem {
  id: string;
  courseCode: string;
  subject: SubjectCategory;
  front: string;
  back: string;
  formula?: string;
}

export interface QuizItem {
  id: string;
  courseCode: string;
  subject: SubjectCategory;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
