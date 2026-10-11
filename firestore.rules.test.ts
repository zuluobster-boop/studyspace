/**
 * Firestore Security Rules Test Suite — Verifies all "Dirty Dozen" payloads return PERMISSION_DENIED.
 */
export interface DirtyPayloadTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  actorUid: string;
  actorEmail: string;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyPayloadTestCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Supreme Admin by unprivileged user',
    collectionPath: '/users/attacker_1',
    operation: 'create',
    actorUid: 'attacker_1',
    actorEmail: 'student@example.edu',
    emailVerified: true,
    payload: {
      uid: 'attacker_1',
      name: 'Attacker',
      role: 'supreme_obster',
      status: 'approved',
      approvedAt: '2026-10-11T00:00:00.000Z',
      expiresAt: '2026-11-11T00:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on User Profile',
    collectionPath: '/users/student_1',
    operation: 'create',
    actorUid: 'student_1',
    actorEmail: 'student1@example.edu',
    emailVerified: true,
    payload: {
      uid: 'student_1',
      name: 'Student One',
      role: 'member',
      status: 'pending',
      approvedAt: '',
      expiresAt: '',
      isSuperUser: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Kunda5 attempting to delete Supreme Admin Obster',
    collectionPath: '/users/obster_uid',
    operation: 'delete',
    actorUid: 'kunda5_uid',
    actorEmail: 'kunda5@example.edu',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Tutor Admin attempting to revoke or modify member status',
    collectionPath: '/users/student_1',
    operation: 'update',
    actorUid: 'tutor_uid',
    actorEmail: 'tutor@example.edu',
    emailVerified: true,
    payload: {
      status: 'approved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'PII Lateral Scraping on another user private info',
    collectionPath: '/users/student_2/private/info',
    operation: 'get',
    actorUid: 'student_1',
    actorEmail: 'student1@example.edu',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Pending or Expired Member attempting to read PDF materials',
    collectionPath: '/materials/mat_1',
    operation: 'get',
    actorUid: 'pending_student',
    actorEmail: 'pending@example.edu',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning with invalid characters',
    collectionPath: '/courses/INVALID_ID$#@!',
    operation: 'create',
    actorUid: 'obster_uid',
    actorEmail: 'zuluobster@gmail.com',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Value Poisoning on Question Answer update',
    collectionPath: '/questions/q_1',
    operation: 'update',
    actorUid: 'tutor_uid',
    actorEmail: 'tutor@example.edu',
    emailVerified: true,
    payload: {
      answerText: 12345,
      status: 'answered',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Student attempting to answer their own question',
    collectionPath: '/questions/q_1',
    operation: 'update',
    actorUid: 'student_1',
    actorEmail: 'student1@example.edu',
    emailVerified: true,
    payload: {
      status: 'answered',
      answerText: 'Self answered',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-student question list scraping',
    collectionPath: '/questions',
    operation: 'list',
    actorUid: 'student_1',
    actorEmail: 'student1@example.edu',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Timestamp Forgery on Discussion Post',
    collectionPath: '/discussions/disc_1',
    operation: 'create',
    actorUid: 'student_1',
    actorEmail: 'student1@example.edu',
    emailVerified: true,
    payload: {
      createdAt: '1999-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Identity Spoofing on Question Submission',
    collectionPath: '/questions/q_spoof',
    operation: 'create',
    actorUid: 'student_1',
    actorEmail: 'student1@example.edu',
    emailVerified: true,
    payload: {
      studentId: 'student_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
