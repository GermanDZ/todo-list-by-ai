export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  dueDate?: Date | null;
  category?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  completed?: boolean;
  dueDate?: Date | null;
  category?: string | null;
}
