import React, { useState, useMemo } from 'react';
import {
  FileText,
  Video,
  Search,
  Download,
  Play,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { CourseItem, MaterialItem, VideoTutorialItem, UserRole } from '../types';

interface KnowledgeLibraryProps {
  courses: CourseItem[];
  materials: MaterialItem[];
  videos: VideoTutorialItem[];
  userRole: UserRole;
  onDeleteMaterial: (id: string) => Promise<void>;
  onDeleteVideo: (id: string) => Promise<void>;
}

export const KnowledgeLibrary: React.FC<KnowledgeLibraryProps> = ({
  courses,
  materials,
  videos,
  userRole,
  onDeleteMaterial,
  onDeleteVideo,
}) => {
  const [resourceTab, setResourceTab] = useState<'all' | 'notes' | 'assignments' | 'videos'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<VideoTutorialItem | null>(null);

  const isAdmin =
    userRole === 'supreme_obster' || userRole === 'supreme_kunda5' || userRole === 'admin';

  const filteredMaterials = useMemo(() => {
    if (resourceTab === 'videos') return [];
    return materials.filter((m) => {
      if (resourceTab === 'notes' && m.category !== 'Notes') return false;
      if (resourceTab === 'assignments' && m.category !== 'Assignment Questions') return false;
      if (courseFilter !== 'ALL' && m.courseCode !== courseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.courseCode.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.uploaderName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [materials, resourceTab, courseFilter, searchQuery]);

  const filteredVideos = useMemo(() => {
    if (resourceTab === 'notes' || resourceTab === 'assignments') return [];
    return videos.filter((v) => {
      if (courseFilter !== 'ALL' && v.courseCode !== courseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.title.toLowerCase().includes(q) ||
          v.courseCode.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.uploaderName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [videos, resourceTab, courseFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Academic Knowledge Repository</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{materials.length} PDF Documents</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{videos.length} Video Lectures</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Study Notes, Past Assignment PDFs & Tutorial Videos
            </h2>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2 border-t border-slate-200">
          {/* Resource Category Segmented Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setResourceTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                resourceTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Resources
            </button>
            <button
              type="button"
              onClick={() => setResourceTab('notes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                resourceTab === 'notes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Study Notes (PDF)
            </button>
            <button
              type="button"
              onClick={() => setResourceTab('assignments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                resourceTab === 'assignments'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assignment Questions (PDF)
            </button>
            <button
              type="button"
              onClick={() => setResourceTab('videos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                resourceTab === 'videos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tutorial Videos
            </button>
          </div>

          {/* Course Selector & Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
            >
              <option value="ALL">All Course Codes</option>
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, topic, or tutor..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Video Streaming Theater */}
      {activeVideo && (
        <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4 border border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
                <span>{activeVideo.courseCode}</span>
                <span>·</span>
                <span>Duration: {activeVideo.duration}</span>
                <span>·</span>
                <span>Instructor: {activeVideo.uploaderName}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">{activeVideo.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
            >
              Close Player
            </button>
          </div>

          <div className="rounded-lg overflow-hidden bg-black aspect-video max-h-[460px] w-full flex items-center justify-center">
            <video
              key={activeVideo.videoUrl}
              src={activeVideo.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Your browser does not support embedded video playback.
            </video>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{activeVideo.description}</p>
        </div>
      )}

      {/* PDF Study Notes & Assignment Questions Section */}
      {resourceTab !== 'videos' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>PDF Study Notes & Assignment Question Papers</span>
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {filteredMaterials.length} Documents
            </span>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                No matching PDF documents found
              </p>
              <p className="text-xs text-slate-500">
                Adjust your course filter or search terms, or upload new PDF materials from the
                Admin Panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-700">{mat.courseCode}</span>
                        <span>·</span>
                        <span
                          className={
                            mat.category === 'Assignment Questions'
                              ? 'font-semibold text-amber-700'
                              : 'font-semibold text-emerald-700'
                          }
                        >
                          {mat.category}
                        </span>
                      </div>
                      <span>Tutor: {mat.uploaderName}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{mat.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{mat.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {mat.fileName}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(mat.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Delete PDF Material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <a
                        href={mat.fileUrl}
                        download={mat.fileName || `${mat.courseCode}_${mat.title}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tutorial Video Interface Section */}
      {resourceTab !== 'notes' && resourceTab !== 'assignments' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-600" />
              <span>Instructional Tutorial Videos</span>
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {filteredVideos.length} Videos
            </span>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
              <Video className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                No matching tutorial videos found
              </p>
              <p className="text-xs text-slate-500">
                Admins and Tutors can upload instructional video tutorials in the Admin Panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono font-bold text-emerald-700">{vid.courseCode}</span>
                      <span className="font-mono tabular-nums">{vid.duration}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">{vid.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{vid.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">By {vid.uploaderName}</span>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteVideo(vid.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Delete Video Tutorial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveVideo(vid)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Stream Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
