export interface UserPreferences {
  workStartTime: string; // "09:00"
  workEndTime: string; // "18:00"
  preferredTaskTypes: string[];
  productiveHours: number[]; // [20, 21, 22] = 8PM-10PM
  timezone: string;
  darkMode: boolean;
}

export interface BehaviorProfile {
  completionPatterns: {
    category: string;
    avgCompletionTime: string; // time of day
    completionRate: number;
  }[];
  postponePatterns: string[]; // categories often postponed
  avgCompletionRate: number;
  bestWorkHours: number[];
  lastUpdated: Date;
}

export interface IUser {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
  preferences: UserPreferences;
  behaviorProfile: BehaviorProfile;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  calendarConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}
