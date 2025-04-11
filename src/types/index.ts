export type UserRole = 'client' | 'project_manager' | 'designer';

export interface User {
  id: string;
  email: string;
  name?: string; // Make it optional for backward compatibility
  role: UserRole;
  created_at: string;
}

export type Project = {
  id: string;
  title: string;
  description: string;
  client_id: string;
  designer_id: string | null;
  created_at: string;
  updated_at: string;
  // Campos adicionales para la información del diseñador
  designer_name?: string;
  designer_email?: string;
};

export interface ProjectFile {
  id: string;
  project_id: string;
  file_path: string;
  file_name: string;
  created_at: string;
}