import { CourseItem, FlashcardItem, QuizItem, SubjectCategory, UserRole } from './types';

export const BOOTSTRAPPED_OBSTER_EMAIL = 'zuluobster@gmail.com';

export const ROLE_LABELS: Record<UserRole, string> = {
  supreme_obster: 'Supreme Admin ("Obster")',
  supreme_kunda5: 'Supreme Admin ("Kunda5")',
  admin: 'Admin / Tutor',
  member: 'Ordinary Member',
};

export const SUBJECT_COLORS: Record<
  SubjectCategory,
  { accentText: string; border: string; bgSubtle: string; indicator: string }
> = {
  Mathematics: {
    accentText: 'text-sky-700',
    border: 'border-sky-200',
    bgSubtle: 'bg-sky-50/70',
    indicator: 'bg-sky-600',
  },
  Biology: {
    accentText: 'text-emerald-700',
    border: 'border-emerald-200',
    bgSubtle: 'bg-emerald-50/70',
    indicator: 'bg-emerald-600',
  },
  Physics: {
    accentText: 'text-amber-700',
    border: 'border-amber-200',
    bgSubtle: 'bg-amber-50/70',
    indicator: 'bg-amber-600',
  },
  Chemistry: {
    accentText: 'text-rose-700',
    border: 'border-rose-200',
    bgSubtle: 'bg-rose-50/70',
    indicator: 'bg-rose-600',
  },
  'Computer Science': {
    accentText: 'text-indigo-700',
    border: 'border-indigo-200',
    bgSubtle: 'bg-indigo-50/70',
    indicator: 'bg-indigo-600',
  },
  Languages: {
    accentText: 'text-slate-700',
    border: 'border-slate-300',
    bgSubtle: 'bg-slate-100/80',
    indicator: 'bg-slate-700',
  },
};

export const INITIAL_COURSES: Omit<CourseItem, 'id' | 'createdBy' | 'createdAt'>[] = [
  // First Year: MA110, BI110, PH110, CH110, CS110, LA111
  {
    code: 'MA110',
    title: 'Foundations of Calculus & Linear Algebra',
    year: 1,
    subject: 'Mathematics',
    description:
      'Limits, continuity, differential and integral calculus of single-variable functions, vector spaces, and matrix transformations.',
  },
  {
    code: 'BI110',
    title: 'Cellular Biology & Molecular Genetics',
    year: 1,
    subject: 'Biology',
    description:
      'Eukaryotic and prokaryotic cell architecture, metabolic pathways, DNA replication, transcription, and Mendelian inheritance.',
  },
  {
    code: 'PH110',
    title: 'Classical Mechanics & Thermodynamics',
    year: 1,
    subject: 'Physics',
    description:
      'Newtonian kinematics, conservation of momentum and energy, harmonic oscillation, wave mechanics, and laws of thermodynamics.',
  },
  {
    code: 'CH110',
    title: 'General & Stoichiometric Chemistry',
    year: 1,
    subject: 'Chemistry',
    description:
      'Atomic orbital theory, periodic trends, chemical bonding, gas laws, thermochemistry, and aqueous acid-base equilibria.',
  },
  {
    code: 'CS110',
    title: 'Introduction to Procedural & Object-Oriented Computing',
    year: 1,
    subject: 'Computer Science',
    description:
      'Algorithmic problem solving, memory models, recursion, modular abstraction, and foundational data structures.',
  },
  {
    code: 'LA111',
    title: 'Academic Communication & Scientific Rhetoric',
    year: 1,
    subject: 'Languages',
    description:
      'Critical scholarly reading, formal research writing, citation methodology, and technical presentation synthesis.',
  },
  // Second Year: BI250, BI260, BI240, BI265, CH240, CH260, CS230, CS250
  {
    code: 'BI240',
    title: 'Human Physiology & Homeostatic Systems',
    year: 2,
    subject: 'Biology',
    description:
      'Cardiovascular hemodynamics, respiratory gas exchange, renal filtration, and neuroendocrine signaling cascades.',
  },
  {
    code: 'BI250',
    title: 'Microbiology & Immunological Defense',
    year: 2,
    subject: 'Biology',
    description:
      'Bacteriology, virology, host-pathogen interactions, innate and adaptive immunity, and clinical antimicrobial mechanisms.',
  },
  {
    code: 'BI260',
    title: 'Biochemistry of Macromolecules',
    year: 2,
    subject: 'Biology',
    description:
      'Protein folding kinetics, Michaelis-Menten enzyme catalysis, oxidative phosphorylation, and lipid biosynthesis.',
  },
  {
    code: 'BI265',
    title: 'Evolutionary Ecology & Population Dynamics',
    year: 2,
    subject: 'Biology',
    description:
      'Hardy-Weinberg equilibrium, natural selection models, trophic energetics, and biodiversity conservation metrics.',
  },
  {
    code: 'CH240',
    title: 'Organic Chemistry: Structure & Reaction Mechanisms',
    year: 2,
    subject: 'Chemistry',
    description:
      'Stereochemistry, nucleophilic substitution (SN1/SN2), elimination pathways, aromaticity, and carbonyl synthesis.',
  },
  {
    code: 'CH260',
    title: 'Physical & Quantum Chemistry',
    year: 2,
    subject: 'Chemistry',
    description:
      'Chemical thermodynamics, Gibbs free energy, electrochemical cells, reaction kinetics, and quantum mechanical wavefunctions.',
  },
  {
    code: 'CS230',
    title: 'Data Structures & Algorithmic Complexity',
    year: 2,
    subject: 'Computer Science',
    description:
      'Balanced binary search trees, hash tables, graph traversal (BFS/DFS), dynamic programming, and asymptotic Big-O analysis.',
  },
  {
    code: 'CS250',
    title: 'Computer Architecture & Systems Organization',
    year: 2,
    subject: 'Computer Science',
    description:
      'Digital logic gates, instruction set architecture (ISA), pipelined datapaths, cache hierarchy, and virtual memory.',
  },
];

export const BUILTIN_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-ma110-1',
    courseCode: 'MA110',
    subject: 'Mathematics',
    front: 'State the Fundamental Theorem of Calculus (Part 1).',
    back: 'If f is continuous on [a, b], then the function F(x) defined by the definite integral from a to x of f(t)dt is differentiable on (a, b) and F\'(x) = f(x).',
    formula: 'd/dx ∫_a^x f(t) dt = f(x)',
  },
  {
    id: 'fc-bi260-1',
    courseCode: 'BI260',
    subject: 'Biology',
    front: 'What does the Michaelis constant (Km) represent in enzyme kinetics?',
    back: 'Km is the substrate concentration at which the reaction velocity (v) reaches exactly half of the maximum velocity (Vmax / 2). A low Km indicates high substrate affinity.',
    formula: 'v = (Vmax · [S]) / (Km + [S])',
  },
  {
    id: 'fc-ph110-1',
    courseCode: 'PH110',
    subject: 'Physics',
    front: 'State the First Law of Thermodynamics for a closed system.',
    back: 'The change in internal energy (ΔU) of a closed system is equal to the heat (Q) added to the system minus the work (W) done by the system on its surroundings.',
    formula: 'ΔU = Q - W',
  },
  {
    id: 'fc-ch240-1',
    courseCode: 'CH240',
    subject: 'Chemistry',
    front: 'Distinguish SN2 from SN1 nucleophilic substitution stereochemistry.',
    back: 'SN2 is a concerted bimolecular mechanism resulting in 100% inversion of configuration (Walden inversion), whereas SN1 proceeds via a planar carbocation intermediate yielding a racemic mixture.',
    formula: 'Rate(SN2) = k[Substrate][Nucleophile]',
  },
  {
    id: 'fc-cs230-1',
    courseCode: 'CS230',
    subject: 'Computer Science',
    front: 'What is the time complexity of searching, inserting, and deleting in a balanced AVL Tree?',
    back: 'Because an AVL tree maintains a height balance factor of {-1, 0, 1} at every node via rotations, height is strictly O(log n), guaranteeing O(log n) worst-case lookup, insertion, and deletion.',
    formula: 'T(n) = O(log₂ n)',
  },
  {
    id: 'fc-bi240-1',
    courseCode: 'BI240',
    subject: 'Biology',
    front: 'Explain the Bohr Effect on the hemoglobin-oxygen dissociation curve.',
    back: 'An increase in partial pressure of CO₂ or a decrease in blood pH (higher H⁺ concentration) shifts the oxygen-hemoglobin dissociation curve to the right, facilitating oxygen unloading to active tissues.',
    formula: 'Hb(O₂)₄ + H⁺ ⇌ HbH⁺ + 4O₂',
  },
];

export const BUILTIN_QUIZZES: QuizItem[] = [
  {
    id: 'qz-ma110-1',
    courseCode: 'MA110',
    subject: 'Mathematics',
    question: 'If A is an invertible 3×3 matrix with determinant det(A) = 4, what is the determinant of det(2A⁻¹)?',
    options: ['2', '1/2', '8', '4'],
    correctIndex: 0,
    explanation: 'For an n×n matrix, det(c · A⁻¹) = cⁿ · (1 / det(A)). Here n = 3 and c = 2, so 2³ / 4 = 8 / 4 = 2.',
  },
  {
    id: 'qz-cs230-1',
    courseCode: 'CS230',
    subject: 'Computer Science',
    question: 'Which graph traversal algorithm uses a FIFO Queue and guarantees the shortest path in an unweighted graph?',
    options: [
      'Depth-First Search (DFS)',
      'Breadth-First Search (BFS)',
      'Topological Sort',
      'Kruskal Minimum Spanning Tree',
    ],
    correctIndex: 1,
    explanation: 'Breadth-First Search (BFS) explores vertices in concentric layers by distance using a FIFO queue, finding the shortest unweighted path in O(V + E) time.',
  },
  {
    id: 'qz-ch110-1',
    courseCode: 'CH110',
    subject: 'Chemistry',
    question: 'According to the Brønsted-Lowry definition, what is the conjugate base of the dihydrogen phosphate ion (H₂PO₄⁻)?',
    options: ['H₃PO₄', 'HPO₄²⁻', 'PO₄³⁻', 'OH⁻'],
    correctIndex: 1,
    explanation: 'A conjugate base is formed by removing a single proton (H⁺) from the acid. Removing H⁺ from H₂PO₄⁻ yields HPO₄²⁻.',
  },
  {
    id: 'qz-bi110-1',
    courseCode: 'BI110',
    subject: 'Biology',
    question: 'During eukaryotic cellular respiration, where are the enzymes of the Citric Acid Cycle (Krebs Cycle) localized?',
    options: [
      'Cytosol',
      'Outer mitochondrial membrane',
      'Mitochondrial matrix',
      'Thylakoid lumen',
    ],
    correctIndex: 2,
    explanation: 'In eukaryotes, the Citric Acid Cycle enzymes operate inside the mitochondrial matrix (with succinate dehydrogenase bound to the inner mitochondrial membrane).',
  },
  {
    id: 'qz-ph110-1',
    courseCode: 'PH110',
    subject: 'Physics',
    question: 'A simple pendulum of length L has period T on Earth. If the pendulum length is quadrupled (4L), what is the new period?',
    options: ['T / 2', '2T', '4T', '√2 T'],
    correctIndex: 1,
    explanation: 'Since T = 2π√(L/g), the period is proportional to the square root of length (√L). Quadrupling L multiplies the period by √4 = 2.',
  },
];

/**
 * Generates a valid downloadable PDF Data URI containing structured academic notes or assignment questions.
 */
export function generateSamplePdfDataUri(title: string, courseCode: string, bodyText: string): string {
  const cleanTitle = title.replace(/[()\\]/g, '');
  const cleanBody = bodyText.replace(/[()\\]/g, '').slice(0, 220);
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 260 >>
stream
BT
/F1 16 Tf
50 720 Td
(${courseCode} - ${cleanTitle}) Tj
/F1 11 Tf
0 -32 Td
(Apex Study Hub Official Academic Resource) Tj
0 -28 Td
(${cleanBody}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000297 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
610
%%EOF`;
  return `data:application/pdf;base64,${btoa(pdfContent)}`;
}
