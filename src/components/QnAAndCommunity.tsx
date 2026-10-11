import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import {
  AssignmentQuestionItem,
  CourseItem,
  DiscussionPostItem,
  UserProfile,
} from '../types';
import { ROLE_LABELS } from '../constants';

interface QnAAndCommunityProps {
  profile: UserProfile;
  courses: CourseItem[];
  questions: AssignmentQuestionItem[];
  discussions: DiscussionPostItem[];
  initialCourseCode?: string;
  onSubmitQuestion: (payload: {
    courseCode: string;
    title: string;
    questionText: string;
  }) => Promise<void>;
  onAnswerQuestion: (questionId: string, answerText: string) => Promise<void>;
  onSubmitDiscussion: (payload: {
    courseCode: string;
    groupTitle: string;
    message: string;
  }) => Promise<void>;
}

export const QnAAndCommunity: React.FC<QnAAndCommunityProps> = ({
  profile,
  courses,
  questions,
  discussions,
  initialCourseCode,
  onSubmitQuestion,
  onAnswerQuestion,
  onSubmitDiscussion,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'qna' | 'community'>('qna');

  // Assignment Question submission state
  const [courseCode, setCourseCode] = useState(initialCourseCode || courses[0]?.code || 'MA110');
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);
  const [qError, setQError] = useState<string | null>(null);

  // Admin inline answer state
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  // Study Group Discussion state
  const [discCourse, setDiscCourse] = useState(courses[0]?.code || 'BI250');
  const [groupTitle, setGroupTitle] = useState('Peer Problem-Solving Circle');
  const [discMessage, setDiscMessage] = useState('');
  const [isSubmittingDisc, setIsSubmittingDisc] = useState(false);

  const isAdmin =
    profile.role === 'supreme_obster' ||
    profile.role === 'supreme_kunda5' ||
    profile.role === 'admin';

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQError(null);
    if (title.trim().length < 3) {
      setQError('Please enter a clear subject line for your assignment question.');
      return;
    }
    if (questionText.trim().length < 10) {
      setQError('Please provide your detailed question or problem steps (min 10 characters).');
      return;
    }

    setIsSubmittingQ(true);
    try {
      await onSubmitQuestion({
        courseCode,
        title: title.trim(),
        questionText: questionText.trim(),
      });
      setTitle('');
      setQuestionText('');
    } catch (err) {
      setQError(err instanceof Error ? err.message : 'Failed to submit question.');
    } finally {
      setIsSubmittingQ(false);
    }
  };

  const handleAdminReply = async (qId: string) => {
    const reply = (draftAnswers[qId] || '').trim();
    if (reply.length < 2) return;
    setAnsweringId(qId);
    try {
      await onAnswerQuestion(qId, reply);
      setDraftAnswers((prev) => ({ ...prev, [qId]: '' }));
    } finally {
      setAnsweringId(null);
    }
  };

  const handleDiscussionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (discMessage.trim().length < 3) return;
    setIsSubmittingDisc(true);
    try {
      await onSubmitDiscussion({
        courseCode: discCourse,
        groupTitle: groupTitle.trim() || 'General Study Group',
        message: discMessage.trim(),
      });
      setDiscMessage('');
    } finally {
      setIsSubmittingDisc(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mode Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Direct Academic Mentorship & Peer Collaboration</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{questions.length} Routed Q&A Threads</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Private Assignment Q&A Workflow & Study Groups
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('qna')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'qna'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Private Assignment Q&A ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('community')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'community'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Collaborative Study Groups ({discussions.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'qna' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Submit New Assignment Question */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Submit Assignment Question to Admins</span>
              </h3>
              <p className="text-xs text-slate-500">
                Your question is private and routed directly to Faculty Admins & Tutors. Responses
                are delivered directly to this thread.
              </p>
            </div>

            {qError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {qError}
              </div>
            )}

            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Module
                </label>
                <select
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assignment Topic / Problem Number
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Problem Set 3: Eigenvalue Diagonalization Proof"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Detailed Question & Attempted Working
                </label>
                <textarea
                  rows={5}
                  required
                  maxLength={2500}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="State the assignment problem clearly and show the steps you have tried so far..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingQ}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmittingQ ? 'Routing Question to Tutors...' : 'Submit Question to Admins'}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Submitted Questions & Routed Admin Responses */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                {isAdmin
                  ? 'All Incoming Student Questions & Tutor Responses'
                  : 'Your Submitted Assignment Questions & Admin Responses'}
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {questions.filter((q) => q.status === 'answered').length} / {questions.length}{' '}
                Answered
              </span>
            </div>

            {questions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">
                  No assignment questions submitted yet
                </p>
                <p className="text-xs text-slate-500">
                  Use the form on the left to submit an assignment question directly to an
                  administrator or tutor.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-700">{q.courseCode}</span>
                        <span>·</span>
                        <span>Asked by {q.studentName}</span>
                      </div>
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          q.status === 'answered' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {q.status === 'answered' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Answered</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting Tutor Response</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-slate-900">{q.title}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {q.questionText}
                      </p>
                    </div>

                    {q.status === 'answered' && q.answerText && (
                      <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
                          <span>Official Tutor / Admin Response</span>
                          <span>Answered by {q.answeredByName}</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                          {q.answerText}
                        </p>
                      </div>
                    )}

                    {/* Admin Direct Reply Box */}
                    {isAdmin && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          {q.status === 'answered'
                            ? 'Update Routed Response to Student'
                            : `Route Answer Directly to ${q.studentName}`}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={4000}
                            value={draftAnswers[q.id] ?? ''}
                            onChange={(e) =>
                              setDraftAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="Write step-by-step solution or guidance..."
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            disabled={answeringId === q.id}
                            onClick={() => handleAdminReply(q.id)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shrink-0 cursor-pointer"
                          >
                            {answeringId === q.id ? 'Sending...' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Collaborative Study Groups & Peer Forum */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Post to Collaborative Study Group</span>
              </h3>
              <p className="text-xs text-slate-500">
                Share study strategies, peer review notes, or coordinate exam preparation sessions
                with fellow approved members.
              </p>
            </div>

            <form onSubmit={handleDiscussionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Module
                </label>
                <select
                  value={discCourse}
                  onChange={(e) => setDiscCourse(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Study Group / Circle Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Discussion Message or Study Tip
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={1500}
                  value={discMessage}
                  onChange={(e) => setDiscMessage(e.target.value)}
                  placeholder="Share a key insight, mnemonic, or study group schedule..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingDisc}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isSubmittingDisc ? 'Posting...' : 'Post to Study Circle'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
              Active Study Group Feed ({discussions.length})
            </h3>
            {discussions.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700">{post.courseCode}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-800">{post.groupTitle}</span>
                  </div>
                  <span>
                    {post.authorName} ({ROLE_LABELS[post.authorRole]})
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {post.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
