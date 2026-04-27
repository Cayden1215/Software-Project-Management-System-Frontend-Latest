// API Client for Project Management System
// Base URL for backend API
const API_BASE_URL = 'http://localhost:8080';

// ============================================================================
// Helper Functions
// ============================================================================

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('current_user');
  return userJson ? JSON.parse(userJson) : null;
}

export function setCurrentUser(user: any): void {
  localStorage.setItem('current_user', JSON.stringify(user));
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
/*
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
*/
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
    }
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.statusText}`);
  }

  // Handle empty responses (like DELETE)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface TaskDto {
  taskID?: number;
  projectID?: number;
  taskName: string;
  description: string;
  taskStatus: string;
  priority: string;
  estimatedDuration?: number;
  requiredMemberNum?: number;
  assignee?: string;
  assigneeId?: number;
  requiredSkills: string[];
  skillIDs?: number[];
  startDate?: string;
  endDate?: string;
  dependencyIds?: number[];
  sprintID?: number;
  storyPoints?: number;
}

export interface UserDto {
  userID?: number;
  name: string;
  email: string;
  password: string;
  role: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
}

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
}

export interface ProjectDto {
  projectID?: number;
  projectName: string;
  projectDescription: string;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  projectStatus: string;
  projectManagerID?: number;
}

export interface ProjectMemberDto {
  projectMemberID?: number;
  projectID?: number;
  teamMemberID?: number;
  teamMemberUsername?: string;
  teamMemberEmail?: string;
  enrollmentDate?: string;
  projectRole?: string;
  skills?: SkillDto[];
}

export interface TaskAssignmentDto {
  assignmentID?: number;
  taskID?: number;
  taskName?: string;
  requiredMemberNum?: number;
  assignedMemberIds?: number[];
  assignedMemberNames?: string[];
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  projectID?: number;
  validMemberCount?: boolean;
  validationError?: string;
}

export interface SprintDto {
  sprintID?: number;
  sprintName: string;
  startDate: string;
  endDate: string;
  sprintGoal: string;
  sprintStatus: string;
}

export interface SkillDto {
  skillID?: number;
  skillName: string;
  projectID?: number;
}

export interface ProjectMemberSkillDto {
  projectMemberID: number;
  skillIDs: number[];
  skills?: SkillDto[];
}

// ============================================================================
// Authentication API
// ============================================================================

export const authAPI = {
  async register(data: UserDto): Promise<any> {
    const response = await apiRequest<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  async login(data: AuthenticationRequest): Promise<AuthenticationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const result = await response.json();
    setAuthToken(result.token);
    return result;
  },

  logout(): void {
    clearAuthToken();
  },
};

// ============================================================================
// Project API
// ============================================================================

export const projectAPI = {
  async getAllProjects(): Promise<ProjectDto[]> {
    return apiRequest<ProjectDto[]>('/api/v1/projects');
  },

  async getProjectById(id: number): Promise<ProjectDto> {
    return apiRequest<ProjectDto>(`/api/v1/projects/${id}`);
  },

  async createProject(data: ProjectDto): Promise<ProjectDto> {
    return apiRequest<ProjectDto>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: number, data: ProjectDto): Promise<ProjectDto> {
    return apiRequest<ProjectDto>(`/api/v1/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: number): Promise<void> {
    return apiRequest<void>(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async enrollTeamMember(projectId: number, data: ProjectMemberDto): Promise<void> {
    return apiRequest<void>(`/api/v1/projects/${projectId}/enroll`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProjectTeamMembers(projectId: number): Promise<ProjectMemberDto[]> {
    return apiRequest<ProjectMemberDto[]>(`/api/v1/projects/${projectId}/enrolled`);
  },

  async removeProjectTeamMember(projectId: number, projectMemberId: number): Promise<void> {
    return apiRequest<void>(`/api/v1/projects/${projectId}/enrolled/${projectMemberId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Task Assignment API
// ============================================================================

export const taskAssignmentAPI = {
  async getTaskAssignments(projectId: number): Promise<TaskAssignmentDto[]> {
    return apiRequest<TaskAssignmentDto[]>(`/api/v1/project/${projectId}/tasks/assignments`);
  },

  async getTaskAssignment(projectId: number, taskId: number): Promise<TaskAssignmentDto> {
    return apiRequest<TaskAssignmentDto>(`/api/v1/project/${projectId}/tasks/assignments/${taskId}`);
  },

  async createTaskAssignment(projectId: number, taskId: number, data: TaskAssignmentDto): Promise<TaskAssignmentDto> {
    return apiRequest<TaskAssignmentDto>(`/api/v1/project/${projectId}/tasks/assignments/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTaskAssignment(projectId: number, taskId: number, data: TaskAssignmentDto): Promise<TaskAssignmentDto> {
    return apiRequest<TaskAssignmentDto>(`/api/v1/project/${projectId}/tasks/assignments/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async scheduleTaskAssignment(projectId: number, data: TaskAssignmentDto): Promise<TaskAssignmentDto> {
    return apiRequest<TaskAssignmentDto>(`/api/v1/project/${projectId}/tasks/assignments/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// AI Scheduler API
// ============================================================================

export const schedulerAPI = {
  async runAIScheduler(projectId: number): Promise<string> {
    return apiRequest<string>(`/api/v1/scheduling/project/${projectId}/run`, {
      method: 'POST',
    });
  },

  async getProjectAssignments(projectId: number): Promise<TaskAssignmentDto[]> {
    return apiRequest<TaskAssignmentDto[]>(`/api/v1/scheduling/project/${projectId}/assignments`);
  },
};

// ============================================================================
// Sprint API
// ============================================================================

export const sprintAPI = {
  async getSprintsByProject(projectId: number): Promise<SprintDto[]> {
    return apiRequest<SprintDto[]>(`/api/v1/sprints/project/${projectId}`);
  },

  async getSprintById(id: number): Promise<SprintDto> {
    return apiRequest<SprintDto>(`/api/v1/sprints/${id}`);
  },

  async createSprint(projectId: number, data: SprintDto): Promise<SprintDto> {
    return apiRequest<SprintDto>(`/api/v1/sprints/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSprint(id: number, data: SprintDto): Promise<SprintDto> {
    return apiRequest<SprintDto>(`/api/v1/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSprint(id: number): Promise<void> {
    return apiRequest<void>(`/api/v1/sprints/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Task API
// ============================================================================

export const taskAPI = {
  async getProjectTasks(projectId: number): Promise<TaskDto[]> {
    return apiRequest<TaskDto[]>(`/api/v1/project/${projectId}/tasks`);
  },

  async getTaskById(projectId: number, taskId: number): Promise<TaskDto> {
    return apiRequest<TaskDto>(`/api/v1/project/${projectId}/tasks/${taskId}`);
  },

  async createTask(projectId: number, data: TaskDto): Promise<TaskDto> {
    return apiRequest<TaskDto>(`/api/v1/project/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(projectId: number, taskId: number, data: TaskDto): Promise<TaskDto> {
    return apiRequest<TaskDto>(`/api/v1/project/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTask(projectId: number, taskId: number): Promise<void> {
    return apiRequest<void>(`/api/v1/project/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Skill API
// ============================================================================

export const skillAPI = {
  async getProjectSkills(projectId: number): Promise<SkillDto[]> {
    return apiRequest<SkillDto[]>(`/api/v1/project/${projectId}/skills`);
  },

  async createSkill(projectId: number, data: SkillDto): Promise<SkillDto> {
    return apiRequest<SkillDto>(`/api/v1/project/${projectId}/skills`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSkillById(projectId: number, skillId: number): Promise<SkillDto> {
    return apiRequest<SkillDto>(`/api/v1/project/${projectId}/skills/${skillId}`);
  },

  async deleteSkill(projectId: number, skillId: number): Promise<void> {
    return apiRequest<void>(`/api/v1/project/${projectId}/skills/${skillId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Project Member Skills API
// ============================================================================

export const projectMemberSkillAPI = {
  async getProjectMemberSkills(projectId: number, projectMemberId: number): Promise<ProjectMemberSkillDto> {
    return apiRequest<ProjectMemberSkillDto>(`/api/v1/project/${projectId}/project-member-skills/${projectMemberId}`);
  },

  async addSkillsToProjectMember(projectId: number, data: ProjectMemberSkillDto): Promise<ProjectMemberSkillDto> {
    return apiRequest<ProjectMemberSkillDto>(`/api/v1/project/${projectId}/project-member-skills`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProjectMemberSkills(projectId: number, projectMemberId: number, data: ProjectMemberSkillDto): Promise<ProjectMemberSkillDto> {
    return apiRequest<ProjectMemberSkillDto>(`/api/v1/project/${projectId}/project-member-skills/${projectMemberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async removeSkillFromProjectMember(projectId: number, projectMemberId: number, skillId: number): Promise<void> {
    return apiRequest<void>(`/api/v1/project/${projectId}/project-member-skills/${projectMemberId}/skill/${skillId}`, {
      method: 'DELETE',
    });
  },

  async removeAllSkillsFromProjectMember(projectId: number, projectMemberId: number): Promise<void> {
    return apiRequest<void>(`/api/v1/project/${projectId}/project-member-skills/${projectMemberId}/all-skills`, {
      method: 'DELETE',
    });
  },
};
