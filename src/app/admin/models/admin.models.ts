// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export type UserStatus    = 'active' | 'suspended' | 'pending' | 'inactive';
export type SessionStatus = 'live' | 'open' | 'closed';
export type ReportStatus  = 'flagged' | 'reviewing' | 'resolved';
export type ReportType = 'group_title' | 'chat_message' | 'session_title' | 'user_name';
export type AdminAction   = 'warn' | 'delete_content' | 'suspend_user' | 'dismiss';

// ─────────────────────────────────────────────
//  Interfaces
// ─────────────────────────────────────────────

export interface User {
  id: number;
  initials: string;
  avatarColor: string;
  name: string;
  email: string;
  joinDate: string;
  status: UserStatus;
  sessions: number;
  studyHours: number;
  streak: number;
  bestStreak: number;
  bio: string;
  topSubjects: string[];
  recentSessions: UserSession[];
  weeklyHours: number[];          // last 7 days
}

export interface UserSession {
  subject: string;
  subjectColor: string;
  date: string;
  duration: string;
  members: number;
  role: 'host' | 'member';
}

export interface StudySession {
  id: number;
  subject: string;
  subjectColor: string;
  host: string;
  hostId: number;
  members: number;
  maxMembers: number;
  status: SessionStatus;
  duration: string;
  createdAt: string;
  topic: string;
}

export interface Report {
  id:               number;
  type:             ReportType;
  title:            string;
  contentSnapshot:  string;
  matchedKeyword:   string;
  reportedTarget:   string;
  reportedUserId:   number;
  date:             string;
  status:           ReportStatus;
  action?:          AdminAction;
  adminNote?:       string;
  offenseCount:     number;
}

export interface StatCardData {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  iconColor: 'violet' | 'blue' | 'green' | 'orange';
  icon: string;
}

export interface BarDay {
  day: string;
  sessions: number;
  signups: number;
}

export interface SubjectStat {
  name: string;
  color: string;
  pct: number;
}

// ─────────────────────────────────────────────
//  Mock data
// ─────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 1, initials: 'YB', avatarColor: '#7c6ef5',
    name: 'Youssef Benali', email: 'y.benali@mail.com',
    joinDate: '2025-01-12', status: 'active',
    sessions: 142, studyHours: 318, streak: 22, bestStreak: 34,
    bio: 'Math & physics enthusiast. Final year engineering student.',
    topSubjects: ['Mathematics', 'Physics', 'Algorithms'],
    weeklyHours: [2, 3.5, 2.5, 4, 3, 5, 2],
    recentSessions: [
      { subject: 'Calculus II',    subjectColor: '#7c6ef5', date: 'Today',      duration: '1h 22m', members: 6, role: 'host'   },
      { subject: 'Linear Algebra', subjectColor: '#4e9af1', date: 'Yesterday',  duration: '2h 05m', members: 4, role: 'host'   },
      { subject: 'Algorithms',     subjectColor: '#4ecb8f', date: '2 days ago', duration: '1h 40m', members: 5, role: 'member' },
    ],
  },
  {
    id: 2, initials: 'SH', avatarColor: '#4e9af1',
    name: 'Sara Haddad', email: 's.haddad@mail.com',
    joinDate: '2025-02-03', status: 'pending',
    sessions: 4, studyHours: 6, streak: 2, bestStreak: 2,
    bio: 'New to the platform. Studying quantum physics.',
    topSubjects: ['Quantum Physics'],
    weeklyHours: [0, 0, 1, 0, 2, 0, 3],
    recentSessions: [
      { subject: 'Quantum Physics', subjectColor: '#4e9af1', date: 'Today', duration: '45m', members: 4, role: 'host' },
    ],
  },
  {
    id: 3, initials: 'KM', avatarColor: '#4ecb8f',
    name: 'Karim Mansour', email: 'k.mansour@mail.com',
    joinDate: '2024-11-19', status: 'active',
    sessions: 87, studyHours: 201, streak: 15, bestStreak: 28,
    bio: 'Chemistry tutor and avid learner.',
    topSubjects: ['Organic Chemistry', 'Biology'],
    weeklyHours: [2, 2, 3, 2.5, 1.5, 4, 3],
    recentSessions: [
      { subject: 'Organic Chemistry', subjectColor: '#4ecb8f', date: 'Today',     duration: '—',      members: 5, role: 'host'   },
      { subject: 'Biology',           subjectColor: '#f5944e', date: 'Yesterday', duration: '1h 10m', members: 3, role: 'member' },
    ],
  },
  {
    id: 4, initials: 'LZ', avatarColor: '#f5944e',
    name: 'Layla Zahraoui', email: 'l.zahraoui@mail.com',
    joinDate: '2025-01-28', status: 'active',
    sessions: 53, studyHours: 124, streak: 9, bestStreak: 14,
    bio: 'History & literature student. Loves group study.',
    topSubjects: ['World History', 'French Literature'],
    weeklyHours: [1.5, 2, 1, 3, 2, 2.5, 1],
    recentSessions: [
      { subject: 'World History', subjectColor: '#f5944e', date: 'Today',      duration: '2h 05m', members: 3, role: 'host'   },
      { subject: 'French Lit.',   subjectColor: '#f56b6b', date: '2 days ago', duration: '1h 30m', members: 2, role: 'member' },
    ],
  },
  {
    id: 5, initials: 'OM', avatarColor: '#f56b6b',
    name: 'Omar Mossad', email: 'o.mossad@mail.com',
    joinDate: '2024-12-05', status: 'suspended',
    sessions: 29, studyHours: 67, streak: 0, bestStreak: 11,
    bio: 'Account suspended pending review.',
    topSubjects: ['Probability', 'Statistics'],
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    recentSessions: [],
  },
  {
    id: 6, initials: 'NR', avatarColor: '#f5d44e',
    name: 'Nadia Rachidi', email: 'n.rachidi@mail.com',
    joinDate: '2025-03-01', status: 'active',
    sessions: 11, studyHours: 28, streak: 5, bestStreak: 5,
    bio: 'Literature student, first month on the platform.',
    topSubjects: ['French Literature', 'Philosophy'],
    weeklyHours: [1, 0, 2, 1.5, 0, 3, 1],
    recentSessions: [
      { subject: 'French Literature', subjectColor: '#f56b6b', date: 'Today', duration: '—', members: 2, role: 'host' },
    ],
  },
  {
    id: 7, initials: 'AB', avatarColor: '#7c6ef5',
    name: 'Amine Boukhari', email: 'a.boukhari@mail.com',
    joinDate: '2024-10-14', status: 'active',
    sessions: 210, studyHours: 489, streak: 41, bestStreak: 41,
    bio: 'Top contributor. Math & CS sessions almost every day.',
    topSubjects: ['Linear Algebra', 'Algorithms', 'Mathematics'],
    weeklyHours: [4, 5, 3.5, 4.5, 4, 6, 3],
    recentSessions: [
      { subject: 'Linear Algebra', subjectColor: '#7c6ef5', date: 'Today',      duration: '3h 10m', members: 8, role: 'host'   },
      { subject: 'Algorithms',     subjectColor: '#4ecb8f', date: 'Yesterday',  duration: '1h 55m', members: 6, role: 'host'   },
      { subject: 'Mathematics',    subjectColor: '#4e9af1', date: '2 days ago', duration: '2h 20m', members: 5, role: 'member' },
    ],
  },
  {
    id: 8, initials: 'FE', avatarColor: '#4ecb8f',
    name: 'Fatima El-Amrani', email: 'f.elamrani@mail.com',
    joinDate: '2025-02-18', status: 'inactive',
    sessions: 3, studyHours: 5, streak: 0, bestStreak: 3,
    bio: 'Joined but rarely active.',
    topSubjects: ['Electromagnetism'],
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    recentSessions: [],
  },
  {
    id: 9, initials: 'HB', avatarColor: '#4e9af1',
    name: 'Hassan Bakkali', email: 'h.bakkali@mail.com',
    joinDate: '2024-09-30', status: 'active',
    sessions: 178, studyHours: 402, streak: 33, bestStreak: 38,
    bio: 'Physics & thermodynamics. One of the oldest members.',
    topSubjects: ['Thermodynamics', 'Electromagnetism', 'Physics'],
    weeklyHours: [3, 4, 3.5, 5, 4, 4.5, 2.5],
    recentSessions: [
      { subject: 'Thermodynamics', subjectColor: '#f5d44e', date: 'Yesterday',  duration: '2h 30m', members: 4, role: 'host'   },
      { subject: 'Physics',        subjectColor: '#4e9af1', date: '2 days ago', duration: '1h 45m', members: 6, role: 'member' },
    ],
  },
  {
    id: 10, initials: 'RO', avatarColor: '#f5944e',
    name: 'Rim Ouazzani', email: 'r.ouazzani@mail.com',
    joinDate: '2025-01-07', status: 'active',
    sessions: 66, studyHours: 148, streak: 18, bestStreak: 22,
    bio: 'CS student focusing on algorithms and data structures.',
    topSubjects: ['Algorithms', 'Probability', 'Mathematics'],
    weeklyHours: [2, 2.5, 3, 2, 3.5, 4, 2],
    recentSessions: [
      { subject: 'Algorithms',  subjectColor: '#4ecb8f', date: 'Yesterday',  duration: '1h 55m', members: 6, role: 'host'   },
      { subject: 'Probability', subjectColor: '#f5944e', date: '2 days ago', duration: '1h 40m', members: 5, role: 'member' },
    ],
  },
];

export const MOCK_SESSIONS: StudySession[] = [
  { id: 1,  subject: 'Calculus II',        subjectColor: '#7c6ef5', host: 'Youssef B.',  hostId: 1,  members: 6, maxMembers: 8,  status: 'live',   duration: '1h 22m', createdAt: 'Today 09:14',   topic: 'Integration techniques & applications' },
  { id: 2,  subject: 'Quantum Physics',    subjectColor: '#4e9af1', host: 'Sara H.',     hostId: 2,  members: 4, maxMembers: 6,  status: 'live',   duration: '45m',    createdAt: 'Today 10:01',   topic: 'Wave-particle duality & Schrödinger eq.' },
  { id: 3,  subject: 'Organic Chemistry',  subjectColor: '#4ecb8f', host: 'Karim M.',    hostId: 3,  members: 5, maxMembers: 10, status: 'open',   duration: '—',      createdAt: 'Today 11:30',   topic: 'Reaction mechanisms: SN1 vs SN2' },
  { id: 4,  subject: 'World History',      subjectColor: '#f5944e', host: 'Layla Z.',    hostId: 4,  members: 3, maxMembers: 6,  status: 'live',   duration: '2h 05m', createdAt: 'Today 08:50',   topic: 'WWI causes & consequences' },
  { id: 5,  subject: 'French Literature',  subjectColor: '#f56b6b', host: 'Nadia R.',    hostId: 6,  members: 2, maxMembers: 4,  status: 'open',   duration: '—',      createdAt: 'Today 12:00',   topic: 'Flaubert: Madame Bovary analysis' },
  { id: 6,  subject: 'Linear Algebra',     subjectColor: '#7c6ef5', host: 'Amine B.',    hostId: 7,  members: 8, maxMembers: 8,  status: 'live',   duration: '3h 10m', createdAt: 'Today 07:45',   topic: 'Eigenvalues, eigenvectors & diagonalization' },
  { id: 7,  subject: 'Thermodynamics',     subjectColor: '#f5d44e', host: 'Hassan B.',   hostId: 9,  members: 4, maxMembers: 8,  status: 'closed', duration: '2h 30m', createdAt: 'Yesterday',     topic: 'Carnot cycle & entropy' },
  { id: 8,  subject: 'Algorithms',         subjectColor: '#4ecb8f', host: 'Rim O.',      hostId: 10, members: 6, maxMembers: 6,  status: 'closed', duration: '1h 55m', createdAt: 'Yesterday',     topic: 'Dynamic programming & memoization' },
  { id: 9,  subject: 'Electromagnetism',   subjectColor: '#4e9af1', host: 'Fatima E.',   hostId: 8,  members: 3, maxMembers: 6,  status: 'closed', duration: '1h 10m', createdAt: '2 days ago',    topic: "Maxwell's equations overview" },
  { id: 10, subject: 'Probability',        subjectColor: '#f5944e', host: 'Omar M.',     hostId: 5,  members: 5, maxMembers: 8,  status: 'closed', duration: '1h 40m', createdAt: '2 days ago',    topic: "Bayes' theorem & conditional probability" },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 1, type: 'group_title', title: 'Inappropriate group title',
    contentSnapshot: 'the offensive title here', matchedKeyword: 'badword',
    reportedTarget: 'Youssef B.', reportedUserId: 1,
    date: '2h ago', status: 'flagged', offenseCount: 1
  },
  {
    id: 2, type: 'chat_message', title: 'Offensive chat message',
    contentSnapshot: 'the offensive message here', matchedKeyword: 'badword2',
    reportedTarget: 'Omar M.', reportedUserId: 5,
    date: '5h ago', status: 'reviewing', offenseCount: 3
  },
  {
    id: 3, type: 'session_title', title: 'Inappropriate session title',
    contentSnapshot: 'offensive session name', matchedKeyword: 'badword',
    reportedTarget: 'Sara H.', reportedUserId: 2,
    date: '1d ago', status: 'resolved', action: 'warn', offenseCount: 1
  },
];

export const TOP_SUBJECTS: SubjectStat[] = [
  { name: 'Mathematics', color: '#7c6ef5', pct: 78 },
  { name: 'Physics',     color: '#4e9af1', pct: 61 },
  { name: 'Chemistry',   color: '#4ecb8f', pct: 49 },
  { name: 'History',     color: '#f5944e', pct: 37 },
  { name: 'Languages',   color: '#f56b6b', pct: 28 },
];

export const BAR_DAYS: BarDay[] = [
  { day: 'Mon', sessions: 48, signups: 12 },
  { day: 'Tue', sessions: 63, signups: 19 },
  { day: 'Wed', sessions: 55, signups: 8  },
  { day: 'Thu', sessions: 80, signups: 24 },
  { day: 'Fri', sessions: 72, signups: 17 },
  { day: 'Sat', sessions: 91, signups: 30 },
  { day: 'Sun', sessions: 67, signups: 14 },
];
