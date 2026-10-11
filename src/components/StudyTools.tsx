import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Video,
  HelpCircle,
  Layers,
  CheckCircle2,
  RotateCcw,
  Plus,
  Search,
  Download,
  Play,
  ExternalLink,
} from 'lucide-react';
import {
  CourseItem,
  MaterialItem,
  VideoTutorialItem,
  SubjectCategory,
  UserRole,
} from '../types';
import {
  BUILTIN_FLASHCARDS,
  BUILTIN_QUIZZES,
  SUBJECT_COLORS,
} from '../constants';
import scienceBanner from '../assets/images/banner_science_faculty_1791711582384.jpg';
import csBanner from '../assets/images/banner_computer_science_lab_1791711592924.jpg';

interface StudyToolsProps {
  courses: CourseItem[];
  materials: MaterialItem[];
  videos: VideoTutorialItem[];
  userRole: UserRole;
  completedCourses: string[];
  onToggleCourseComplete: (code: string) => void;
  onAddCourse: (course: {
    code: string;
    title: string;
    year: 1 | 2 | 3 | 4;
    subject: SubjectCategory;
    description: string;
  }) => Promise<void>;
  onAskQuestionForCourse: (courseCode: string) => void;
}

export const StudyTools: React.FC<StudyToolsProps> = ({
  courses,
  materials,
  videos,
  userRole,
  completedCourses,
  onToggleCourseComplete,
  onAddCourse,
  onAskQuestionForCourse,
}) => {
  const [selectedYear, setSelectedYear] = useState<'all' | 1 | 2>('all');
  const [selectedSubject, setSelectedSubject] = useState<'All' | SubjectCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourseCode, setActiveCourseCode] = useState<string | null>(null);

  // Add Course Modal/Drawer state for Admins
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState<1 | 2>(1);
  const [newSubject, setNewSubject] = useState<SubjectCategory>('Mathematics');
  const [newDescription, setNewDescription] = useState('');
  const [courseFormError, setCourseFormError] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // Interactive Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Interactive Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);

  const [scienceImgError, setScienceImgError] = useState(false);
  const [csImgError, setCsImgError] = useState(false);

  const isAdmin =
    userRole === 'supreme_obster' || userRole === 'supreme_kunda5' || userRole === 'admin';

  const subjects: ('All' | SubjectCategory)[] = [
    'All',
    'Mathematics',
    'Biology',
    'Physics',
    'Chemistry',
    'Computer Science',
    'Languages',
  ];

  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => {
        if (selectedYear !== 'all' && c.year !== selectedYear) return false;
        if (selectedSubject !== 'All' && c.subject !== selectedSubject) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            c.code.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.subject.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.year - b.year || a.code.localeCompare(b.code));
  }, [courses, selectedYear, selectedSubject, searchQuery]);

  const firstYearCourses = filteredCourses.filter((c) => c.year === 1);
  const secondYearCourses = filteredCourses.filter((c) => c.year === 2);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.code === activeCourseCode) || null,
    [courses, activeCourseCode]
  );

  const courseMaterials = useMemo(
    () =>
      activeCourseCode
        ? materials.filter((m) => m.courseCode.toUpperCase() === activeCourseCode.toUpperCase())
        : [],
    [materials, activeCourseCode]
  );

  const courseVideos = useMemo(
    () =>
      activeCourseCode
        ? videos.filter((v) => v.courseCode.toUpperCase() === activeCourseCode.toUpperCase())
        : [],
    [videos, activeCourseCode]
  );

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseFormError(null);
    const formattedCode = newCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,20}$/.test(formattedCode)) {
      setCourseFormError('Course code must be 3–20 uppercase letters/numbers (e.g., MA210).');
      return;
    }
    if (newTitle.trim().length < 3) {
      setCourseFormError('Please provide a valid course title.');
      return;
    }
    if (newDescription.trim().length < 10) {
      setCourseFormError('Please provide a syllabus description (at least 10 characters).');
      return;
    }

    setIsCreatingCourse(true);
    try {
      await onAddCourse({
        code: formattedCode,
        title: newTitle.trim(),
        year: newYear,
        subject: newSubject,
        description: newDescription.trim(),
      });
      setNewCode('');
      setNewTitle('');
      setNewDescription('');
      setShowAddCourse(false);
    } catch (err) {
      setCourseFormError(err instanceof Error ? err.message : 'Failed to create course.');
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const currentFlashcard = BUILTIN_FLASHCARDS[cardIndex % BUILTIN_FLASHCARDS.length];
  const currentQuiz = BUILTIN_QUIZZES[quizIndex % BUILTIN_QUIZZES.length];

  const handleQuizCheck = () => {
    if (selectedOption === null || quizSubmitted) return;
    setQuizSubmitted(true);
    setQuizAnsweredCount((c) => c + 1);
    if (selectedOption === currentQuiz.correctIndex) {
      setQuizScore((s) => s + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizIndex((i) => (i + 1) % BUILTIN_QUIZZES.length);
  };

  const progressPercentage =
    courses.length > 0 ? Math.round((completedCourses.length / courses.length) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Top Academic Visual Banner & Study Progress Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Academic Curriculum & Resource Matrix</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{courses.length} Active Modules</span>
              <span>·</span>
              <span className="font-mono tabular-nums">
                {materials.length} PDFs & {videos.length} Video Lectures
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              First-Year & Second-Year Course Directory
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Select any course module below to inspect syllabus notes, download assignment
              worksheets, stream instructional videos, or submit a direct assignment question to a
              tutor.
            </p>
          </div>

          {/* Mastery Progress Tracker */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                Personal Coursework Completion Tracker
              </span>
              <span className="font-mono tabular-nums text-sky-700 font-semibold">
                {completedCourses.length} / {courses.length} Modules Completed ({progressPercentage}
                %)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[120px]">
            {!scienceImgError ? (
              <img
                src={scienceBanner}
                alt="Natural Sciences & Molecular Structures"
                referrerPolicy="no-referrer"
                onError={() => setScienceImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <span className="text-[11px] font-mono text-emerald-300">NATURAL SCIENCES</span>
              <p className="text-xs font-semibold text-white">
                Biology (BI110–265) · Chemistry (CH110–260) · Physics (PH110)
              </p>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[120px]">
            {!csImgError ? (
              <img
                src={csBanner}
                alt="Computer Science & Formal Mathematics"
                referrerPolicy="no-referrer"
                onError={() => setCsImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
              <span className="text-[11px] font-mono text-sky-300">COMPUTING & FORMAL LOGIC</span>
              <p className="text-xs font-semibold text-white">
                Mathematics (MA110) · Computer Science (CS110, CS230, CS250)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedYear === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Years
            </button>
            <button
              type="button"
              onClick={() => setSelectedYear(1)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedYear === 1
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              First Year (100-Level)
            </button>
            <button
              type="button"
              onClick={() => setSelectedYear(2)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedYear === 2
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Second Year (200-Level)
            </button>
          </div>

          {/* Subject Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {subjects.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code (e.g. BI250, CS230)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
            />
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddCourse(!showAddCourse)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Admin Add Course Form */}
      {isAdmin && showAddCourse && (
        <form
          onSubmit={handleCreateCourseSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Add New Academic Course Module
              </h3>
              <p className="text-xs text-slate-500">
                Dynamically publish a new course to the First-Year or Second-Year curriculum.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCourse(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {courseFormError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {courseFormError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g., PH220"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Course Title
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Electromagnetism & Optics"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Year & Subject
              </label>
              <div className="flex gap-2">
                <select
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value) as 1 | 2)}
                  className="px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                </select>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value as SubjectCategory)}
                  className="flex-1 px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Languages">Languages</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Syllabus Description
            </label>
            <textarea
              rows={2}
              required
              maxLength={600}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Core topics, prerequisites, and laboratory requirements..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreatingCourse}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {isCreatingCourse ? 'Publishing Course...' : 'Publish Course to Curriculum'}
            </button>
          </div>
        </form>
      )}

      {/* Selected Course Resource Inspector Drawer */}
      {selectedCourse && (
        <div className="bg-white border border-sky-300 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-sky-700">{selectedCourse.code}</span>
                <span>·</span>
                <span>Year {selectedCourse.year}</span>
                <span>·</span>
                <span>{selectedCourse.subject}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h3>
              <p className="text-xs text-slate-600">{selectedCourse.description}</p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onAskQuestionForCourse(selectedCourse.code)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Submit Assignment Question</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCourseCode(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course PDFs */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>
                  Course PDF Notes & Assignment Questions ({courseMaterials.length})
                </span>
              </h4>
              {courseMaterials.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  No PDF documents uploaded specifically for {selectedCourse.code} yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {courseMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{mat.category}</span>
                          <span>·</span>
                          <span>By {mat.uploaderName}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 truncate">{mat.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{mat.description}</p>
                      </div>
                      <a
                        href={mat.fileUrl}
                        download={mat.fileName || `${mat.courseCode}_${mat.title}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course Videos */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>Instructional Video Tutorials ({courseVideos.length})</span>
              </h4>
              {courseVideos.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  No tutorial videos uploaded specifically for {selectedCourse.code} yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {courseVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono tabular-nums">{vid.duration}</span>
                          <span>·</span>
                          <span>By {vid.uploaderName}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 truncate">{vid.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{vid.description}</p>
                      </div>
                      <a
                        href={vid.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Watch</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categorized Courses by Academic Year */}
      <div className="space-y-8">
        {(selectedYear === 'all' || selectedYear === 1) && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-lg font-bold text-slate-900">
                01. First-Year Academic Modules (100-Level Foundation)
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {firstYearCourses.length} Courses
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {firstYearCourses.map((course) => {
                const style = SUBJECT_COLORS[course.subject] || SUBJECT_COLORS.Languages;
                const isDone = completedCourses.includes(course.code);
                const matCount = materials.filter((m) => m.courseCode === course.code).length;
                const vidCount = videos.filter((v) => v.courseCode === course.code).length;

                return (
                  <div
                    key={course.id}
                    className={`bg-white border ${style.border} rounded-xl p-5 flex flex-col justify-between transition-colors hover:border-slate-400`}
                  >
                    <div className="space-y-2.5">
                      {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${style.accentText}`}>
                            {course.code}
                          </span>
                          <span>·</span>
                          <span>{course.subject}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleCourseComplete(course.code)}
                          className={`text-xs flex items-center gap-1 cursor-pointer ${
                            isDone ? 'text-emerald-700 font-semibold' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Toggle module completion"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {course.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono tabular-nums">
                        {matCount} PDFs · {vidCount} Videos
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onAskQuestionForCourse(course.code)}
                          className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Ask Tutor
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCourseCode(course.code)}
                          className={`font-semibold ${style.accentText} hover:underline flex items-center gap-1 cursor-pointer`}
                        >
                          <span>Open Module</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {(selectedYear === 'all' || selectedYear === 2) && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-lg font-bold text-slate-900">
                02. Second-Year Academic Modules (200-Level Specialization)
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {secondYearCourses.length} Courses
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {secondYearCourses.map((course) => {
                const style = SUBJECT_COLORS[course.subject] || SUBJECT_COLORS.Languages;
                const isDone = completedCourses.includes(course.code);
                const matCount = materials.filter((m) => m.courseCode === course.code).length;
                const vidCount = videos.filter((v) => v.courseCode === course.code).length;

                return (
                  <div
                    key={course.id}
                    className={`bg-white border ${style.border} rounded-xl p-5 flex flex-col justify-between transition-colors hover:border-slate-400`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${style.accentText}`}>
                            {course.code}
                          </span>
                          <span>·</span>
                          <span>{course.subject}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleCourseComplete(course.code)}
                          className={`text-xs flex items-center gap-1 cursor-pointer ${
                            isDone ? 'text-emerald-700 font-semibold' : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {course.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono tabular-nums">
                        {matCount} PDFs · {vidCount} Videos
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onAskQuestionForCourse(course.code)}
                          className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Ask Tutor
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCourseCode(course.code)}
                          className={`font-semibold ${style.accentText} hover:underline flex items-center gap-1 cursor-pointer`}
                        >
                          <span>Open Module</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Integrated Interactive Study Tools: Active Recall Flashcards & Self-Assessment Quiz */}
      <section className="pt-6 border-t border-slate-200">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            03. Integrated Interactive Study Lab: Flashcards & Self-Assessment Quiz
          </h3>
          <p className="text-xs text-slate-500">
            Reinforce core definitions, mathematical proofs, and biochemical pathways with active
            recall decks and timed course quizzes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Interactive Flashcard Deck */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                Active Recall Flashcards
              </span>
              <span className="font-mono tabular-nums">
                Card {cardIndex + 1} of {BUILTIN_FLASHCARDS.length} · {currentFlashcard.courseCode}
              </span>
            </div>

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-6 rounded-lg bg-slate-50 border border-slate-200 min-h-[180px] flex flex-col justify-center cursor-pointer select-none transition-colors hover:bg-slate-100/70"
            >
              <div className="text-[11px] font-mono text-sky-700 mb-2">
                {isFlipped ? 'CONCEPT SOLUTION & FORMULA' : 'PROMPT (CLICK TO FLIP)'} ·{' '}
                {currentFlashcard.subject}
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
                {isFlipped ? currentFlashcard.back : currentFlashcard.front}
              </p>
              {isFlipped && currentFlashcard.formula && (
                <p className="mt-3 px-3 py-1.5 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800 inline-block self-start">
                  {currentFlashcard.formula}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'Show Question' : 'Reveal Answer'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex(
                      (i) => (i - 1 + BUILTIN_FLASHCARDS.length) % BUILTIN_FLASHCARDS.length
                    );
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex((i) => (i + 1) % BUILTIN_FLASHCARDS.length);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Next Card
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Practice Quiz */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Course Self-Assessment Quiz ({currentQuiz.courseCode})
              </span>
              <span className="font-mono tabular-nums font-semibold text-emerald-700">
                Score: {quizScore} / {quizAnsweredCount}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                {currentQuiz.question}
              </p>

              <div className="space-y-2">
                {currentQuiz.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuiz.correctIndex;
                  let btnStyle = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'border-rose-400 bg-rose-50 text-rose-900';
                    }
                  } else if (isSelected) {
                    btnStyle = 'border-sky-600 bg-sky-50 text-sky-900 font-semibold';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={quizSubmitted}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left px-3.5 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${btnStyle}`}
                    >
                      <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong className="text-slate-900">Solution Explanation:</strong>{' '}
                  {currentQuiz.explanation}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                Question {quizIndex + 1} of {BUILTIN_QUIZZES.length}
              </span>
              <div className="flex items-center gap-2">
                {!quizSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleQuizCheck}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg cursor-pointer"
                  >
                    Verify Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuiz}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
