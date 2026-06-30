export type TaskCategory =
  | "assignment"
  | "bill"
  | "interview"
  | "resume"
  | "meeting"
  | "personal"
  | "work"
  | "other";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "missed"
  | "postponed";

export interface ISubTask {
  _id: string;
  taskId: string;
  title: string;
  status: "pending" | "completed";
  estimatedEffort: number; // minutes
  order: number;
  createdAt: Date;
}

export interface ITask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  urgency: "urgent" | "not_urgent";
  importance: "important" | "not_important";
  status: TaskStatus;
  deadline?: Date;
  estimatedEffort: number; // minutes
  actualEffort?: number;
  riskScore: number; // 0-100
  riskExplanation?: string;
  aiSuggestions: string[];
  subtasks: ISubTask[];
  calendarEventId?: string;
  tags: string[];
  priorityReasoning?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  deadline?: string;
  estimatedEffort: number;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  deadline?: string;
  estimatedEffort?: number;
  tags?: string[];
}

export interface ScheduleBlock {
  taskId: string;
  taskTitle: string;
  startTime: string; // "HH:MM"
  endTime: string;
  date: string; // "YYYY-MM-DD"
  note?: string;
}
