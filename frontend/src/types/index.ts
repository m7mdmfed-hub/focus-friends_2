// Mirrors backend Prisma models. Keep in sync.

export type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
export type RepeatType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type PostType = 'ACHIEVEMENT' | 'STREAK' | 'LEVEL_UP' | 'CHALLENGE' | 'GENERAL';
export type ReactionKind = 'FIRE' | 'CLAP' | 'MUSCLE' | 'ROCKET' | 'HEART';
export type FriendStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  bio: string | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  image: string | null;
  points: number;
  priority: Priority;
  repeat: RepeatType;
  visibility: Visibility;
  dueAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  logs?: TaskLog[];
}

export interface TaskLog {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  completed: boolean;
  note: string | null;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  targetPerWeek: number;
  currentStreak: number;
  bestStreak: number;
  active: boolean;
  createdAt: string;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
}

export interface Friend {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendStatus;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  type: PostType;
  imageUrl: string | null;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'level'>;
  reactions: Reaction[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  kind: ReactionKind;
  createdAt: string;
}

export interface Challenge {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  goal: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  owner: Pick<User, 'id' | 'name' | 'avatar'>;
  _count?: { members: number };
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  xpReward: number;
  coinReward: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: string;
  achievement: Achievement;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
