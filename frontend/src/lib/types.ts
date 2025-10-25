export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  owner_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface TodoCreateData {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface TodoUpdateData {
  title?: string;
  description?: string;
  completed?: boolean;
}
