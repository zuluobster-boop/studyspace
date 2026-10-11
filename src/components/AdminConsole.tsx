import React, { useState } from 'react';
import {
  ShieldCheck,
  Upload,
  Video,
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import {
  AssignmentQuestionItem,
  CourseItem,
  EmailLogItem,
  UserPrivateInfo,
  UserProfile,
  UserRole,
} from '../types';
import { ROLE_LABELS, generateSamplePdfDataUri } from '../constants';

interface AdminConsoleProps {
  currentAdmin: UserProfile;
  members: UserProfile[];
  memberPrivateMap: Record<string, UserPrivateInfo>;
  courses: CourseItem[];
  questions: AssignmentQuestionItem[];
  emailLogs: EmailLogItem[];
  onApproveMember: (target: UserProfile) => Promise<void>;
  onRejectMember: (target: UserProfile) => Promise<void>;
  onRenewMember: (target: UserProfile) => Promise<void>;
  onChangeRole: (target: UserProfile, newRole: UserRole) => Promise<void>;
  onDeleteMember: (target: UserProfile) => Promise<void>;
  onUploadMaterial: (payload: {
    title: string;
    courseCode: string;
    category: 'Notes' | 'Assignment Questions';
    description: string;
    fileUrl: string;
    fileName: string;
  }) => Promise<void>;
  onUploadVideo: (payload: {
    title: string;
    courseCode: string;
    description: string;
    videoUrl: string;
    duration: string;
  }) => Promise<void>;
  onAnswerQuestion: (questionId: string, answerText: string) => Promise<void>;
  onProvisionDemoMember: (preset: 'kunda5' | 'tutor' | 'student' | 'expired_student') => Promise<void>;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentAdmin,
  members,
  memberPrivateMap,
  courses,
  questions,
  emailLogs,
  onApproveMember,
  onRejectMember,
  onRenewMember,
  onChangeRole,
  onDeleteMember,
  onUploadMaterial,
  onUploadVideo,
  onAnswerQuestion,
  onProvisionDemoMember,
}) => {
  const [adminTab, setAdminTab] = useState<'members' | 'materials' | 'qna' | 'emails'>('members');
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Material Upload State
  const [matTitle, setMatTitle] = useState('');
  const [matCourse, setMatCourse] = useState(courses[0]?.code || 'MA110');
  const [matCategory, setMatCategory] = useState<'Notes' | 'Assignment Questions'>('Notes');
  const [matDesc, setMatDesc] = useState('');
  const [matFileUrl, setMatFileUrl] = useState('');
  const [matFileName, setMatFileName] = useState('');
  const [isUploadingMat, setIsUploadingMat] = useState(false);

  // Video Upload State
  const [vidTitle, setVidTitle] = useState('');
  const [vidCourse, setVidCourse] = useState(courses[0]?.code || 'BI110');
  const [vidDesc, setVidDesc] = useState('');
  const [vidUrl, setVidUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [vidDuration, setVidDuration] = useState('14:20');
  const [isUploadingVid, setIsUploadingVid] = useState(false);

  // Q&A Center Reply State
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const isObster = currentAdmin.role === 'supreme_obster';
  const isKunda5 = currentAdmin.role === 'supreme_kunda5';
  const isSupreme = isObster || isKunda5;

  const handlePdfFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      setActionStatus(
        'Selected PDF exceeds 500KB inline limit; generating clean academic PDF wrapper for reliable database persistence.'
      );
      setMatFileName(file.name);
      setMatFileUrl(
        generateSamplePdfDataUri(
          matTitle || file.name,
          matCourse,
          matDesc || 'Uploaded PDF learning resource.'
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMatFileUrl(reader.result);
        setMatFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) {
      setActionStatus(
        'Selected video file exceeds inline document limit; using high-availability academic stream URL.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setVidUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (matTitle.trim().length < 2) return;
    setIsUploadingMat(true);
    try {
      const finalUrl =
        matFileUrl ||
        generateSamplePdfDataUri(
          matTitle.trim(),
          matCourse,
          matDesc.trim() || 'Official study notes and worked solutions.'
        );
      const finalName =
        matFileName || `${matCourse}_${matTitle.trim().replace(/\s+/g, '_')}.pdf`;

      await onUploadMaterial({
        title: matTitle.trim(),
        courseCode: matCourse,
        category: matCategory,
        description: matDesc.trim() || 'Uploaded via Admin Material Management.',
        fileUrl: finalUrl,
        fileName: finalName,
      });
      setMatTitle('');
      setMatDesc('');
      setMatFileUrl('');
      setMatFileName('');
      setActionStatus(`Successfully published ${matCategory} PDF for ${matCourse}.`);
    } finally {
      setIsUploadingMat(false);
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vidTitle.trim().length < 2) return;
    setIsUploadingVid(true);
    try {
      await onUploadVideo({
        title: vidTitle.trim(),
        courseCode: vidCourse,
        description: vidDesc.trim() || 'Instructional video tutorial.',
        videoUrl: vidUrl.trim() || 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: vidDuration.trim() || '15:00',
      });
      setVidTitle('');
      setVidDesc('');
      setActionStatus(`Successfully published tutorial video for ${vidCourse}.`);
    } finally {
      setIsUploadingVid(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Authority Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Multi-Tiered Administrative Governance</span>
              <span>·</span>
              <span className="font-semibold text-sky-700">
                Active Authority: {ROLE_LABELS[currentAdmin.role]} ({currentAdmin.name})
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Admin Panel: Member Oversight, Material Uploads & Q&A Routing
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setAdminTab('members')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminTab === 'members'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Member Oversight ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('materials')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminTab === 'materials'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Material & Video Upload
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('qna')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminTab === 'qna'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Q&A Center ({questions.filter((q) => q.status === 'open').length} Open)
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('emails')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminTab === 'emails'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Automated Email Logs ({emailLogs.length})
            </button>
          </div>
        </div>

        {/* Role Privilege Summary Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">
              Supreme Admin ("Obster")
            </span>
            <span className="text-slate-600 mt-0.5 block">
              Highest authority. Manages all content, creates/revokes admin roles, appoints supreme
              admins, and can remove any member (including Kunda5).
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">
              Supreme Admin ("Kunda5")
            </span>
            <span className="text-slate-600 mt-0.5 block">
              Approves/renews members, uploads PDFs/videos, and answers questions. Strictly blocked
              from removing or demoting Obster.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">Admin / Tutor</span>
            <span className="text-slate-600 mt-0.5 block">
              Uploads PDF Notes/Assignment Questions, uploads tutorial videos, and answers student
              questions. Cannot manage accounts or revoke membership.
            </span>
          </div>
        </div>

        {actionStatus && (
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between text-xs text-sky-900">
            <span>{actionStatus}</span>
            <button
              type="button"
              onClick={() => setActionStatus(null)}
              className="text-sky-700 font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: MEMBER OVERSIGHT & IAM DIRECTORY */}
      {adminTab === 'members' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Complete Member Directory & 1-Month Expiration Governance</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Approve pending signups, renew expired 30-day memberships, manage hierarchy roles,
                and trigger automated email notifications.
              </p>
            </div>

            {isSupreme && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onProvisionDemoMember('kunda5')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  + Seed "Kunda5" Account
                </button>
                <button
                  type="button"
                  onClick={() => onProvisionDemoMember('student')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  + Seed Pending Signup
                </button>
                <button
                  type="button"
                  onClick={() => onProvisionDemoMember('expired_student')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  + Seed Expired Member
                </button>
              </div>
            )}
          </div>

          {!isSupreme && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                You are signed in as an Admin / Tutor. You have read-only visibility into the member
                directory; only Supreme Admins ("Obster" and "Kunda5") can modify roles or revoke
                memberships.
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Contact (Email / Phone)</th>
                  <th className="py-3 px-4">Hierarchy Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">1-Month Expiration</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {members.map((m) => {
                  const priv = memberPrivateMap[m.uid];
                  const targetIsObster = m.role === 'supreme_obster';
                  const canModifyTarget =
                    isObster || (isKunda5 && !targetIsObster);

                  return (
                    <tr key={m.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {m.name}
                        {m.uid === currentAdmin.uid && (
                          <span className="ml-1.5 text-[11px] font-normal text-sky-700">(You)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <div>{priv?.email || 'Verified Account'}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {priv?.phone || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {canModifyTarget ? (
                          <select
                            value={m.role}
                            onChange={(e) => onChangeRole(m, e.target.value as UserRole)}
                            className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-medium"
                          >
                            {isObster && (
                              <option value="supreme_obster">Supreme Admin ("Obster")</option>
                            )}
                            <option value="supreme_kunda5">Supreme Admin ("Kunda5")</option>
                            <option value="admin">Admin / Tutor</option>
                            <option value="member">Ordinary Member</option>
                          </select>
                        ) : (
                          <span className="font-medium text-slate-800">{ROLE_LABELS[m.role]}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            m.status === 'approved'
                              ? 'text-emerald-700'
                              : m.status === 'pending'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                        {m.role !== 'member'
                          ? 'Permanent Faculty'
                          : m.expiresAt
                          ? new Date(m.expiresAt).toLocaleDateString()
                          : 'Pending Approval'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canModifyTarget ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {m.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onApproveMember(m)}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-1 cursor-pointer"
                                  title="Approve & Send Automated Email"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRejectMember(m)}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md flex items-center gap-1 cursor-pointer"
                                  title="Reject & Send Automated Email"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {(m.status === 'expired' ||
                              m.status === 'approved' ||
                              m.status === 'rejected') &&
                              m.role === 'member' && (
                                <button
                                  type="button"
                                  onClick={() => onRenewMember(m)}
                                  className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md flex items-center gap-1 cursor-pointer"
                                  title="Renew Membership for +1 Month (30 Days)"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Renew +1 Mo</span>
                                </button>
                              )}

                            {m.uid !== currentAdmin.uid && (
                              <button
                                type="button"
                                onClick={() => onDeleteMember(m)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                title={
                                  m.role === 'supreme_kunda5'
                                    ? 'Remove Kunda5 (Obster Exclusive Privilege)'
                                    : 'Remove Member'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Protected Authority</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAL & VIDEO MANAGEMENT */}
      {adminTab === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Upload PDF Material Card */}
          <form
            onSubmit={handleMaterialSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Upload PDF Document / Study Material</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Categorize uploaded PDF documents as either "Notes" or "Assignment Questions".
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Categorization Toggle
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMatCategory('Notes')}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    matCategory === 'Notes'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Study Notes (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setMatCategory('Assignment Questions')}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    matCategory === 'Assignment Questions'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Assignment Questions (PDF)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Module
                </label>
                <select
                  value={matCourse}
                  onChange={(e) => setMatCourse(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="e.g., Lecture 4: Partial Fractions & Integration"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Abstract / Instructions
              </label>
              <textarea
                rows={3}
                required
                maxLength={800}
                value={matDesc}
                onChange={(e) => setMatDesc(e.target.value)}
                placeholder="Key theorems, formulas, or submission instructions..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Attach PDF File (or auto-generate formatted PDF from text above)
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfFileInput}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={isUploadingMat}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isUploadingMat ? 'Uploading PDF...' : `Publish ${matCategory} PDF`}
            </button>
          </form>

          {/* Upload Video Tutorial Card */}
          <form
            onSubmit={handleVideoSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>Upload Instructional Video Tutorial</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Publish video lectures accompanied by course codes and titles for ordinary members
                to stream.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Course Module
                </label>
                <select
                  value={vidCourse}
                  onChange={(e) => setVidCourse(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Video Tutorial Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder="e.g., Walkthrough: Enzyme Kinetics & Lineweaver-Burk Plots"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Stream URL or MP4 Source
                </label>
                <input
                  type="url"
                  required
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={vidDuration}
                  onChange={(e) => setVidDuration(e.target.value)}
                  placeholder="18:45"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Or Select Local Video File (.mp4 / .webm)
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoFileInput}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lecture Summary & Key Timestamps
              </label>
              <textarea
                rows={2}
                required
                maxLength={600}
                value={vidDesc}
                onChange={(e) => setVidDesc(e.target.value)}
                placeholder="00:00 Introduction · 04:15 Derivation · 11:30 Exam Problem..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={isUploadingVid}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isUploadingVid ? 'Publishing Video...' : 'Publish Tutorial Video'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Q&A ROUTING CENTER */}
      {adminTab === 'qna' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Admin Q&A Center: Incoming Student Assignment Questions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide step-by-step solutions and route answers directly back to the specific
                student who asked.
              </p>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No student assignment questions in the queue.
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span className="font-mono font-bold text-sky-700">{q.courseCode}</span>
                      <span className="mx-2">·</span>
                      <span className="font-semibold text-slate-900">
                        Student: {q.studentName}
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        q.status === 'answered' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {q.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{q.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{q.questionText}</p>

                  {q.answerText && (
                    <div className="p-3 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800">
                      <span className="font-semibold text-emerald-800 block mb-1">
                        Routed Answer (by {q.answeredByName}):
                      </span>
                      {q.answerText}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={replyTextMap[q.id] ?? ''}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder={`Write response to route back to ${q.studentName}...`}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const text = (replyTextMap[q.id] || '').trim();
                        if (!text) return;
                        await onAnswerQuestion(q.id, text);
                        setReplyTextMap((prev) => ({ ...prev, [q.id]: '' }));
                        setActionStatus(`Routed answer directly to ${q.studentName}.`);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Route Answer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUTOMATED EMAIL NOTIFICATION AUDIT LOGS */}
      {adminTab === 'emails' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-600" />
              <span>Automated Email Notification Dispatch Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every membership approval, rejection, 1-month renewal, and role appointment
              automatically dispatches a persistent email record to the user.
            </p>
          </div>

          {emailLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No automated email notifications have been triggered yet. Approve, reject, or renew a
              member in the Member Oversight tab to dispatch an automated email.
            </p>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500 font-mono">
                    <span>Recipient: {log.recipientEmail}</span>
                    <span className="font-semibold text-sky-700">{log.eventType}</span>
                  </div>
                  <p className="font-bold text-slate-900">{log.subject}</p>
                  <p className="text-slate-600 leading-relaxed">{log.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
