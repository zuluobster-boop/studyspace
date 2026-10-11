/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  hashPassword,
  OperationType,
} from './firebase';
import {
  AssignmentQuestionItem,
  CourseItem,
  DiscussionPostItem,
  EmailLogItem,
  MaterialItem,
  SubjectCategory,
  UserPrivateInfo,
  UserProfile,
  UserRole,
  VideoTutorialItem,
} from './types';
import {
  BOOTSTRAPPED_OBSTER_EMAIL,
  INITIAL_COURSES,
  ROLE_LABELS,
  generateSamplePdfDataUri,
} from './constants';
import { AuthGate } from './components/AuthGate';
import { AccessHoldScreen } from './components/AccessHoldScreen';
import { StudyTools } from './components/StudyTools';
import { KnowledgeLibrary } from './components/KnowledgeLibrary';
import { QnAAndCommunity } from './components/QnAAndCommunity';
import { AdminConsole } from './components/AdminConsole';
import { CheckCircle2, Clock, LogOut, ShieldCheck } from 'lucide-react';

type ActiveSection = 'dashboard' | 'courses' | 'library' | 'qna' | 'admin';

export default function App() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [preselectedQnaCourse, setPreselectedQnaCourse] = useState<string | undefined>(undefined);

  // Domain Collections State
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [videos, setVideos] = useState<VideoTutorialItem[]>([]);
  const [questions, setQuestions] = useState<AssignmentQuestionItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPostItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [allMembers, setAllMembers] = useState<UserProfile[]>([]);
  const [memberPrivateMap, setMemberPrivateMap] = useState<Record<string, UserPrivateInfo>>({});

  // Personal study completion tracker (persisted in localStorage per user)
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);

  // Load or initialize user profile and check 1-month expiration rule
  const loadUserProfile = useCallback(
    async (
      fbUser: FirebaseUser,
      signupPayload?: { name: string; phone: string; email: string; password: string }
    ) => {
      const userRef = doc(db, 'users', fbUser.uid);
      const privRef = doc(db, 'users', fbUser.uid, 'private', 'info');

      try {
        const snap = await getDoc(userRef);
        const isObsterEmail =
          fbUser.email?.toLowerCase() === BOOTSTRAPPED_OBSTER_EMAIL.toLowerCase();

        if (!snap.exists()) {
          // Initialize new user atomically with isolated PII subcollection
          const nowIso = new Date().toISOString();
          const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          const role: UserRole = isObsterEmail ? 'supreme_obster' : 'member';
          const status = isObsterEmail ? 'approved' : 'pending';
          const displayName = isObsterEmail
            ? signupPayload?.name || 'Obster'
            : signupPayload?.name || fbUser.displayName || 'Academic Member';

          const pwHash = await hashPassword(signupPayload?.password || fbUser.uid);
          const batch = writeBatch(db);

          batch.set(userRef, {
            uid: fbUser.uid,
            name: displayName.slice(0, 100),
            role,
            status,
            approvedAt: isObsterEmail ? nowIso : '',
            expiresAt: isObsterEmail ? oneYearLater : '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          batch.set(privRef, {
            uid: fbUser.uid,
            email: (signupPayload?.email || fbUser.email || 'member@university.edu').slice(0, 150),
            phone: (signupPayload?.phone || '+260-970-000000').slice(0, 30),
            passwordHash: pwHash,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          await batch.commit();
        }

        const freshSnap = await getDoc(userRef);
        const freshPrivSnap = await getDoc(privRef);

        if (freshSnap.exists()) {
          const data = freshSnap.data() as UserProfile;

          // Enforce 1-Month Expiration Check for Ordinary Members
          if (
            data.role === 'member' &&
            data.status === 'approved' &&
            data.expiresAt &&
            new Date(data.expiresAt).getTime() < Date.now()
          ) {
            const expiredProfile: UserProfile = { ...data, status: 'expired' };
            setProfile(expiredProfile);
          } else {
            setProfile(data);
          }
        }

        if (freshPrivSnap.exists()) {
          setPrivateInfo(freshPrivSnap.data() as UserPrivateInfo);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      }
    },
    []
  );

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setAuthUser(fbUser);
      if (fbUser) {
        await loadUserProfile(fbUser);
        const savedProgress = localStorage.getItem(`apex_progress_${fbUser.uid}`);
        if (savedProgress) {
          try {
            setCompletedCourses(JSON.parse(savedProgress));
          } catch {
            setCompletedCourses([]);
          }
        }
      } else {
        setProfile(null);
        setPrivateInfo(null);
      }
      setIsAuthReady(true);
    });
    return () => unsub();
  }, [loadUserProfile]);

  // Seed initial 14 courses, sample PDFs, videos, and study discussions when an Admin logs in
  const seedInitialDataIfEmpty = useCallback(
    async (adminProfile: UserProfile) => {
      const isAnyAdmin =
        adminProfile.role === 'supreme_obster' ||
        adminProfile.role === 'supreme_kunda5' ||
        adminProfile.role === 'admin';
      if (!isAnyAdmin) return;

      try {
        const coursesQuery = query(collection(db, 'courses'), where('year', 'in', [1, 2, 3, 4]));
        const existingCourses = await getDocs(coursesQuery);
        if (existingCourses.empty) {
          const batch = writeBatch(db);
          for (const c of INITIAL_COURSES) {
            const cRef = doc(db, 'courses', c.code);
            batch.set(cRef, {
              code: c.code,
              title: c.title,
              year: c.year,
              subject: c.subject,
              description: c.description,
              createdBy: adminProfile.uid,
              createdAt: serverTimestamp(),
            });
          }

          // Seed initial PDF Notes & Assignment Questions
          const mat1Ref = doc(db, 'materials', 'mat_ma110_notes');
          batch.set(mat1Ref, {
            title: 'Lecture 1–4: Limits, Continuity & Matrix Eigenvalues',
            courseCode: 'MA110',
            category: 'Notes',
            description:
              'Comprehensive First-Year Mathematics lecture notes covering epsilon-delta limits, L’Hôpital’s Rule, and linear transformations.',
            fileUrl: generateSamplePdfDataUri(
              'Limits and Linear Algebra Notes',
              'MA110',
              'Theorem 1.1: Squeeze Theorem and Derivative Foundations.'
            ),
            fileName: 'MA110_Calculus_Linear_Algebra_Notes.pdf',
            uploadedBy: adminProfile.uid,
            uploaderName: adminProfile.name,
            createdAt: serverTimestamp(),
          });

          const mat2Ref = doc(db, 'materials', 'mat_bi260_assignment');
          batch.set(mat2Ref, {
            title: 'Problem Set 2: Michaelis-Menten Kinetics & Allosteric Inhibition',
            courseCode: 'BI260',
            category: 'Assignment Questions',
            description:
              'Second-Year Biochemistry assignment worksheet requiring Lineweaver-Burk reciprocal plots and Vmax/Km derivations.',
            fileUrl: generateSamplePdfDataUri(
              'Biochemistry Problem Set 2',
              'BI260',
              'Calculate Km and Vmax from initial velocity experimental data.'
            ),
            fileName: 'BI260_Enzyme_Kinetics_Assignment.pdf',
            uploadedBy: adminProfile.uid,
            uploaderName: adminProfile.name,
            createdAt: serverTimestamp(),
          });

          const mat3Ref = doc(db, 'materials', 'mat_cs230_notes');
          batch.set(mat3Ref, {
            title: 'Balanced Binary Search Trees (AVL & Red-Black) Reference Guide',
            courseCode: 'CS230',
            category: 'Notes',
            description:
              'Detailed rotation invariants, asymptotic complexity proofs, and breadth-first vs depth-first graph traversal pseudocode.',
            fileUrl: generateSamplePdfDataUri(
              'Data Structures AVL Trees',
              'CS230',
              'AVL Tree single and double rotation invariants.'
            ),
            fileName: 'CS230_AVL_Trees_Graph_Algorithms.pdf',
            uploadedBy: adminProfile.uid,
            uploaderName: adminProfile.name,
            createdAt: serverTimestamp(),
          });

          // Seed initial Tutorial Videos
          const vid1Ref = doc(db, 'videos', 'vid_ma110_1');
          batch.set(vid1Ref, {
            title: 'Visualizing Eigenvalues, Eigenvectors & Linear Transformations',
            courseCode: 'MA110',
            description:
              'Step-by-step tutorial demonstrating characteristic polynomials det(A - λI) = 0 and geometric scaling.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: '16:40',
            uploadedBy: adminProfile.uid,
            uploaderName: adminProfile.name,
            createdAt: serverTimestamp(),
          });

          const vid2Ref = doc(db, 'videos', 'vid_bi240_1');
          batch.set(vid2Ref, {
            title: 'Cardiovascular Hemodynamics & The Bohr Oxygen Shift',
            courseCode: 'BI240',
            description:
              'Walkthrough of hemoglobin cooperative binding, partial pressure gradients, and bicarbonate buffering.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            duration: '21:15',
            uploadedBy: adminProfile.uid,
            uploaderName: adminProfile.name,
            createdAt: serverTimestamp(),
          });

          // Seed initial Study Group Discussion
          const disc1Ref = doc(db, 'discussions', 'disc_welcome_1');
          batch.set(disc1Ref, {
            authorId: adminProfile.uid,
            authorName: adminProfile.name,
            authorRole: adminProfile.role,
            courseCode: 'MA110',
            groupTitle: 'First-Year Sciences Peer Study Circle',
            message:
              'Welcome to the Apex Study Hub! Review the MA110 and BI110 lecture PDFs in the Knowledge Library and submit any assignment questions via the Q&A tab.',
            createdAt: serverTimestamp(),
          });

          await batch.commit();
        }
      } catch (err) {
        console.warn('Seed check skipped or already populated:', err);
      }
    },
    []
  );

  // Attach real-time Firestore listeners once authenticated
  useEffect(() => {
    if (!isAuthReady || !authUser || !profile) return;

    const isAnyAdmin =
      profile.role === 'supreme_obster' ||
      profile.role === 'supreme_kunda5' ||
      profile.role === 'admin';
    const isApproved = isAnyAdmin || profile.status === 'approved';

    if (isAnyAdmin) {
      seedInitialDataIfEmpty(profile);
    }

    const unsubscribers: (() => void)[] = [];

    // 1. User's own profile real-time listener
    const unsubSelf = onSnapshot(
      doc(db, 'users', authUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          if (
            data.role === 'member' &&
            data.status === 'approved' &&
            data.expiresAt &&
            new Date(data.expiresAt).getTime() < Date.now()
          ) {
            setProfile({ ...data, status: 'expired' });
          } else {
            setProfile(data);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${authUser.uid}`)
    );
    unsubscribers.push(unsubSelf);

    // 2. Email logs listener
    const emailQ = isAnyAdmin
      ? query(
          collection(db, 'emailLogs'),
          where('eventType', 'in', ['APPROVED', 'REJECTED', 'RENEWED', 'ROLE_CHANGED'])
        )
      : query(collection(db, 'emailLogs'), where('recipientUid', '==', authUser.uid));

    const unsubEmails = onSnapshot(
      emailQ,
      (snap) => {
        const items: EmailLogItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmailLogItem, 'id'>),
        }));
        setEmailLogs(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'emailLogs')
    );
    unsubscribers.push(unsubEmails);

    // If user is not approved yet, do not subscribe to protected academic collections
    if (!isApproved) {
      return () => unsubscribers.forEach((u) => u());
    }

    // 3. Courses listener
    const coursesQ = query(collection(db, 'courses'), where('year', 'in', [1, 2, 3, 4]));
    const unsubCourses = onSnapshot(
      coursesQ,
      (snap) => {
        const loaded: CourseItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CourseItem, 'id'>),
        }));
        if (loaded.length === 0) {
          // Provide default curriculum view if no admin has seeded yet
          setCourses(
            INITIAL_COURSES.map((c) => ({
              ...c,
              id: c.code,
              createdBy: 'system',
            }))
          );
        } else {
          setCourses(loaded);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'courses')
    );
    unsubscribers.push(unsubCourses);

    // 4. Materials listener
    const matQ = query(
      collection(db, 'materials'),
      where('category', 'in', ['Notes', 'Assignment Questions'])
    );
    const unsubMaterials = onSnapshot(
      matQ,
      (snap) => {
        setMaterials(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<MaterialItem, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'materials')
    );
    unsubscribers.push(unsubMaterials);

    // 5. Videos listener
    const vidQ = query(collection(db, 'videos'), where('duration', '>=', ''));
    const unsubVideos = onSnapshot(
      vidQ,
      (snap) => {
        setVideos(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<VideoTutorialItem, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'videos')
    );
    unsubscribers.push(unsubVideos);

    // 6. Questions listener (Students see own questions; Admins see all open/answered questions)
    const questionsQ = isAnyAdmin
      ? query(collection(db, 'questions'), where('status', 'in', ['open', 'answered']))
      : query(collection(db, 'questions'), where('studentId', '==', authUser.uid));

    const unsubQuestions = onSnapshot(
      questionsQ,
      (snap) => {
        setQuestions(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AssignmentQuestionItem, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'questions')
    );
    unsubscribers.push(unsubQuestions);

    // 7. Discussions listener
    const discQ = query(
      collection(db, 'discussions'),
      where('authorRole', 'in', ['supreme_obster', 'supreme_kunda5', 'admin', 'member'])
    );
    const unsubDiscussions = onSnapshot(
      discQ,
      (snap) => {
        setDiscussions(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<DiscussionPostItem, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'discussions')
    );
    unsubscribers.push(unsubDiscussions);

    // 8. Admin Member Directory listener
    if (isAnyAdmin) {
      const membersQ = query(
        collection(db, 'users'),
        where('status', 'in', ['pending', 'approved', 'rejected', 'expired'])
      );
      const unsubMembers = onSnapshot(
        membersQ,
        async (snap) => {
          const memberList: UserProfile[] = snap.docs.map((d) => d.data() as UserProfile);
          setAllMembers(memberList);

          // Load isolated private contact info for each member
          const privEntries: Record<string, UserPrivateInfo> = {};
          await Promise.all(
            memberList.map(async (m) => {
              try {
                const pSnap = await getDoc(doc(db, 'users', m.uid, 'private', 'info'));
                if (pSnap.exists()) {
                  privEntries[m.uid] = pSnap.data() as UserPrivateInfo;
                }
              } catch {
                // ignore individual missing private doc
              }
            })
          );
          setMemberPrivateMap(privEntries);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      );
      unsubscribers.push(unsubMembers);
    }

    return () => unsubscribers.forEach((u) => u());
  }, [isAuthReady, authUser, profile?.role, profile?.status, seedInitialDataIfEmpty]);

  // Handlers
  const handleAuthenticate = async (payload: {
    mode: 'login' | 'signup';
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await loadUserProfile(result.user, payload);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Authentication popup was closed or blocked. Please try again.'
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setProfile(null);
    setPrivateInfo(null);
  };

  const handleToggleCourseComplete = (code: string) => {
    if (!authUser) return;
    setCompletedCourses((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      localStorage.setItem(`apex_progress_${authUser.uid}`, JSON.stringify(next));
      return next;
    });
  };

  const handleAddCourse = async (newCourse: {
    code: string;
    title: string;
    year: 1 | 2 | 3 | 4;
    subject: SubjectCategory;
    description: string;
  }) => {
    if (!authUser) return;
    const path = `courses/${newCourse.code}`;
    try {
      await setDoc(doc(db, 'courses', newCourse.code), {
        code: newCourse.code,
        title: newCourse.title,
        year: newCourse.year,
        subject: newCourse.subject,
        description: newCourse.description,
        createdBy: authUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleUploadMaterial = async (payload: {
    title: string;
    courseCode: string;
    category: 'Notes' | 'Assignment Questions';
    description: string;
    fileUrl: string;
    fileName: string;
  }) => {
    if (!authUser || !profile) return;
    const matId = `mat_${Date.now()}`;
    try {
      await setDoc(doc(db, 'materials', matId), {
        title: payload.title.slice(0, 150),
        courseCode: payload.courseCode.slice(0, 20),
        category: payload.category,
        description: payload.description.slice(0, 800),
        fileUrl: payload.fileUrl,
        fileName: payload.fileName.slice(0, 180),
        uploadedBy: authUser.uid,
        uploaderName: profile.name.slice(0, 100),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `materials/${matId}`);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'materials', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `materials/${id}`);
    }
  };

  const handleUploadVideo = async (payload: {
    title: string;
    courseCode: string;
    description: string;
    videoUrl: string;
    duration: string;
  }) => {
    if (!authUser || !profile) return;
    const vidId = `vid_${Date.now()}`;
    try {
      await setDoc(doc(db, 'videos', vidId), {
        title: payload.title.slice(0, 150),
        courseCode: payload.courseCode.slice(0, 20),
        description: payload.description.slice(0, 600),
        videoUrl: payload.videoUrl,
        duration: payload.duration.slice(0, 30),
        uploadedBy: authUser.uid,
        uploaderName: profile.name.slice(0, 100),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `videos/${vidId}`);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `videos/${id}`);
    }
  };

  const handleSubmitQuestion = async (payload: {
    courseCode: string;
    title: string;
    questionText: string;
  }) => {
    if (!authUser || !profile) return;
    const qId = `q_${Date.now()}`;
    try {
      await setDoc(doc(db, 'questions', qId), {
        studentId: authUser.uid,
        studentName: profile.name.slice(0, 100),
        courseCode: payload.courseCode.slice(0, 20),
        title: payload.title.slice(0, 150),
        questionText: payload.questionText.slice(0, 2500),
        status: 'open',
        answerText: '',
        answeredBy: '',
        answeredByName: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `questions/${qId}`);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answerText: string) => {
    if (!authUser || !profile) return;
    try {
      await updateDoc(doc(db, 'questions', questionId), {
        status: 'answered',
        answerText: answerText.slice(0, 4000),
        answeredBy: authUser.uid,
        answeredByName: profile.name.slice(0, 100),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `questions/${questionId}`);
    }
  };

  const handleSubmitDiscussion = async (payload: {
    courseCode: string;
    groupTitle: string;
    message: string;
  }) => {
    if (!authUser || !profile) return;
    const dId = `disc_${Date.now()}`;
    try {
      await setDoc(doc(db, 'discussions', dId), {
        authorId: authUser.uid,
        authorName: profile.name.slice(0, 100),
        authorRole: profile.role,
        courseCode: payload.courseCode.slice(0, 20),
        groupTitle: payload.groupTitle.slice(0, 120),
        message: payload.message.slice(0, 1500),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `discussions/${dId}`);
    }
  };

  // Admin IAM & Automated Email Notification Handlers
  const dispatchAutomatedEmail = async (
    target: UserProfile,
    eventType: 'APPROVED' | 'REJECTED' | 'RENEWED' | 'ROLE_CHANGED',
    subject: string,
    body: string
  ) => {
    if (!authUser) return;
    const recipientEmail =
      memberPrivateMap[target.uid]?.email || `${target.name.toLowerCase().replace(/\s+/g, '.')}@university.edu`;
    const logId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await setDoc(doc(db, 'emailLogs', logId), {
      recipientUid: target.uid,
      recipientEmail: recipientEmail.slice(0, 150),
      subject: subject.slice(0, 200),
      body: body.slice(0, 2000),
      eventType,
      sentByUid: authUser.uid,
      createdAt: serverTimestamp(),
    });
  };

  const handleApproveMember = async (target: UserProfile) => {
    const nowIso = new Date().toISOString();
    const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        status: 'approved',
        approvedAt: nowIso,
        expiresAt: oneMonthLater,
        updatedAt: serverTimestamp(),
      });
      await dispatchAutomatedEmail(
        target,
        'APPROVED',
        'Apex Study Hub: Your Membership Has Been Approved',
        `Dear ${target.name}, your Study Hub account has been manually verified and approved by ${profile?.name}. Your 1-month access cycle is active until ${new Date(oneMonthLater).toLocaleDateString()}.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${target.uid}`);
    }
  };

  const handleRejectMember = async (target: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
      await dispatchAutomatedEmail(
        target,
        'REJECTED',
        'Apex Study Hub: Membership Registration Update',
        `Dear ${target.name}, your registration request was reviewed by ${profile?.name} and could not be approved at this time.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${target.uid}`);
    }
  };

  const handleRenewMember = async (target: UserProfile) => {
    const nowIso = new Date().toISOString();
    const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        status: 'approved',
        approvedAt: nowIso,
        expiresAt: oneMonthLater,
        updatedAt: serverTimestamp(),
      });
      await dispatchAutomatedEmail(
        target,
        'RENEWED',
        'Apex Study Hub: 1-Month Membership Renewed',
        `Dear ${target.name}, your Study Hub membership has been renewed for an additional 30 days by ${profile?.name}. New expiration date: ${new Date(oneMonthLater).toLocaleDateString()}.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${target.uid}`);
    }
  };

  const handleChangeRole = async (target: UserProfile, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        role: newRole,
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
      await dispatchAutomatedEmail(
        target,
        'ROLE_CHANGED',
        `Apex Study Hub: Administrative Role Updated to ${ROLE_LABELS[newRole]}`,
        `Dear ${target.name}, your platform authority level has been updated to ${ROLE_LABELS[newRole]} by ${profile?.name}.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${target.uid}`);
    }
  };

  const handleDeleteMember = async (target: UserProfile) => {
    try {
      // Delete isolated private subcollection doc first if exists, then user doc
      try {
        await deleteDoc(doc(db, 'users', target.uid, 'private', 'info'));
      } catch {
        // ignore if already absent
      }
      await deleteDoc(doc(db, 'users', target.uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${target.uid}`);
    }
  };

  // Seed representative hierarchy accounts for testing multi-tiered permissions
  const handleProvisionDemoMember = async (
    preset: 'kunda5' | 'tutor' | 'student' | 'expired_student'
  ) => {
    const idSuffix = Math.floor(1000 + Math.random() * 9000);
    const uid =
      preset === 'kunda5'
        ? 'kunda5_supreme_uid'
        : `member_${preset}_${idSuffix}`;
    const nowIso = new Date().toISOString();
    const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    let name = 'Kunda5';
    let role: UserRole = 'supreme_kunda5';
    let status: 'pending' | 'approved' | 'expired' = 'approved';
    let email = 'kunda5@university.edu';
    let expiresAt = oneMonthLater;

    if (preset === 'tutor') {
      name = `Dr. Mulenga (Tutor ${idSuffix})`;
      role = 'admin';
      status = 'approved';
      email = `mulenga.${idSuffix}@university.edu`;
    } else if (preset === 'student') {
      name = `Mutale Banda (Applicant ${idSuffix})`;
      role = 'member';
      status = 'pending';
      email = `mutale.${idSuffix}@student.edu`;
      expiresAt = '';
    } else if (preset === 'expired_student') {
      name = `Bwalya Phiri (Expired ${idSuffix})`;
      role = 'member';
      status = 'expired';
      email = `bwalya.${idSuffix}@student.edu`;
      expiresAt = pastDate;
    }

    try {
      const pwHash = await hashPassword('DemoPass2026!');
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid), {
        uid,
        name,
        role,
        status,
        approvedAt: status === 'pending' ? '' : nowIso,
        expiresAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'users', uid, 'private', 'info'), {
        uid,
        email,
        phone: '+260 97 555 0199',
        passwordHash: pwHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            Initializing Apex Study Hub Security Context...
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Verifying Firestore RBAC & Session State
          </p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Show Signup/Login Gate
  if (!authUser || !profile) {
    return (
      <AuthGate
        onAuthenticate={handleAuthenticate}
        isSubmitting={isSubmittingAuth}
        errorMessage={authError}
      />
    );
  }

  const isAnyAdmin =
    profile.role === 'supreme_obster' ||
    profile.role === 'supreme_kunda5' ||
    profile.role === 'admin';

  // 2. Ordinary Member whose status is pending, rejected, or expired -> Show IAM Access Hold Screen
  if (!isAnyAdmin && profile.status !== 'approved') {
    return (
      <AccessHoldScreen
        profile={profile}
        privateInfo={privateInfo}
        emailLogs={emailLogs}
        onSignOut={handleSignOut}
        onRefreshStatus={() => loadUserProfile(authUser)}
      />
    );
  }

  // Days remaining calculation for 1-month membership
  const daysRemaining =
    profile.role === 'member' && profile.expiresAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(profile.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          Apex Study Hub
        </a>

        {/* Zone 2: 4–5 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'dashboard'
                ? 'text-slate-900 font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            Overview
          </a>
          <a
            href="#courses"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('courses');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'courses'
                ? 'text-slate-900 font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            Courses
          </a>
          <a
            href="#library"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('library');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'library'
                ? 'text-slate-900 font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            Library
          </a>
          <a
            href="#qna"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('qna');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'qna'
                ? 'text-slate-900 font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            Assignment Q&A
          </a>
          {isAnyAdmin && (
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('admin');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'admin'
                  ? 'text-sky-700 font-semibold underline underline-offset-8'
                  : ''
              }`}
            >
              Admin Panel
            </a>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-6 py-2.5 bg-white border-b border-slate-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeSection === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('courses')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeSection === 'courses' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Courses
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('library')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeSection === 'library' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Library
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('qna')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeSection === 'qna' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Assignment Q&A
        </button>
        {isAnyAdmin && (
          <button
            type="button"
            onClick={() => setActiveSection('admin')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeSection === 'admin' ? 'bg-sky-600 text-white' : 'text-slate-600'
            }`}
          >
            Admin Panel
          </button>
        )}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-12 py-8 space-y-8">
        {/* Account Status & Identity Strip */}
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="font-bold text-slate-900">{profile.name}</span>
            <span>·</span>
            <span className="font-semibold text-sky-700">{ROLE_LABELS[profile.role]}</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Status: Approved
            </span>
            {daysRemaining !== null && (
              <>
                <span>·</span>
                <span className="font-mono tabular-nums flex items-center gap-1 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  1-Month Term: {daysRemaining} Days Remaining
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setActiveSection('qna')}
              className="font-semibold text-sky-700 hover:underline cursor-pointer"
            >
              Ask Assignment Question
            </button>
            {isAnyAdmin && (
              <>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setActiveSection('admin')}
                  className="font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Manage Platform ({allMembers.filter((m) => m.status === 'pending').length} Pending)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section Routing */}
        {activeSection === 'dashboard' && (
          <div className="space-y-10">
            {/* Quick Summary Metrics Grid (Tabular Numerals, Single Elevation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div
                onClick={() => setActiveSection('courses')}
                className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <span className="text-xs text-slate-500 block">
                  Categorized Academic Courses
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {courses.length}
                </span>
                <span className="text-xs text-sky-700 font-medium mt-2 block">
                  Year 1 (6 Modules) · Year 2 (8 Modules) →
                </span>
              </div>

              <div
                onClick={() => setActiveSection('library')}
                className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <span className="text-xs text-slate-500 block">
                  PDF Study Notes & Assignments
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {materials.length}
                </span>
                <span className="text-xs text-emerald-700 font-medium mt-2 block">
                  Browse Notes & Problem Sets →
                </span>
              </div>

              <div
                onClick={() => setActiveSection('library')}
                className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <span className="text-xs text-slate-500 block">
                  Instructional Video Tutorials
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {videos.length}
                </span>
                <span className="text-xs text-sky-700 font-medium mt-2 block">
                  Stream On-Demand Lectures →
                </span>
              </div>

              <div
                onClick={() => setActiveSection('qna')}
                className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <span className="text-xs text-slate-500 block">
                  Private Assignment Q&A Threads
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                  {questions.length}
                </span>
                <span className="text-xs text-amber-700 font-medium mt-2 block">
                  {questions.filter((q) => q.status === 'answered').length} Answered ·{' '}
                  {questions.filter((q) => q.status === 'open').length} Open →
                </span>
              </div>
            </div>

            {/* Full Course Dashboard & Interactive Study Tools */}
            <StudyTools
              courses={courses}
              materials={materials}
              videos={videos}
              userRole={profile.role}
              completedCourses={completedCourses}
              onToggleCourseComplete={handleToggleCourseComplete}
              onAddCourse={handleAddCourse}
              onAskQuestionForCourse={(code) => {
                setPreselectedQnaCourse(code);
                setActiveSection('qna');
              }}
            />
          </div>
        )}

        {activeSection === 'courses' && (
          <StudyTools
            courses={courses}
            materials={materials}
            videos={videos}
            userRole={profile.role}
            completedCourses={completedCourses}
            onToggleCourseComplete={handleToggleCourseComplete}
            onAddCourse={handleAddCourse}
            onAskQuestionForCourse={(code) => {
              setPreselectedQnaCourse(code);
              setActiveSection('qna');
            }}
          />
        )}

        {activeSection === 'library' && (
          <KnowledgeLibrary
            courses={courses}
            materials={materials}
            videos={videos}
            userRole={profile.role}
            onDeleteMaterial={handleDeleteMaterial}
            onDeleteVideo={handleDeleteVideo}
          />
        )}

        {activeSection === 'qna' && (
          <QnAAndCommunity
            profile={profile}
            courses={courses}
            questions={questions}
            discussions={discussions}
            initialCourseCode={preselectedQnaCourse}
            onSubmitQuestion={handleSubmitQuestion}
            onAnswerQuestion={handleAnswerQuestion}
            onSubmitDiscussion={handleSubmitDiscussion}
          />
        )}

        {activeSection === 'admin' && isAnyAdmin && (
          <AdminConsole
            currentAdmin={profile}
            members={allMembers}
            memberPrivateMap={memberPrivateMap}
            courses={courses}
            questions={questions}
            emailLogs={emailLogs}
            onApproveMember={handleApproveMember}
            onRejectMember={handleRejectMember}
            onRenewMember={handleRenewMember}
            onChangeRole={handleChangeRole}
            onDeleteMember={handleDeleteMember}
            onUploadMaterial={handleUploadMaterial}
            onUploadVideo={handleUploadVideo}
            onAnswerQuestion={handleAnswerQuestion}
            onProvisionDemoMember={handleProvisionDemoMember}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 lg:px-12 py-4 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>Apex Study Hub & Academic Portal · Multi-Tiered Educational Platform</span>
          <div className="flex items-center gap-4">
            <span>Role: {ROLE_LABELS[profile.role]}</span>
            <span>·</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

