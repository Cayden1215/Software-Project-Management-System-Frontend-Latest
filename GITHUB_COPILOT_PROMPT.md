# GitHub Copilot Prompt: Project Management System with AI Scheduling

## System Overview

Build a comprehensive **Project Management System** using **React**, **TypeScript**, and **Tailwind CSS** that supports task management, team collaboration, sprint planning, and AI-powered scheduling. The system uses **React Router** for navigation and follows a role-based access control model.

### ⚠️ CRITICAL: API-First Architecture

**ALL data must be fetched from and persisted to the backend REST API at `http://localhost:8080`.**

- ❌ **DO NOT** use local state, mock data, or localStorage for persisting application data
- ❌ **DO NOT** implement scheduling logic in the frontend
- ✅ **DO** fetch data from API endpoints on component mount
- ✅ **DO** send all mutations (create, update, delete) to the backend
- ✅ **DO** use the AI scheduler endpoint for generating schedules
- ✅ **DO** include JWT authentication token in all API requests

**The frontend is a presentation layer. All business logic, data persistence, and AI scheduling happens on the backend.**

---

## User Roles & Permissions

### 1. Project Manager
- Create and manage projects
- Add/remove team members with specific skills
- Register skills for the project
- Create tasks with dependencies in the timeline view
- Manually move backlog tasks to sprints
- Use AI scheduler to generate optimal project schedules
- View all project views (Timeline, Kanban, Scrum Board)
- Update project status and settings
- Delete projects

### 2. Team Member
- Enroll in projects (accept invitations)
- View assigned tasks
- Update status of their own tasks only
- View Timeline and Kanban boards (read-only for task creation)
- View Scrum board and sprint details
- Cannot create or delete tasks
- Cannot manage team members or project settings

---

## Core Features

### 1. **Authentication & User Management**
- Login/Signup with email and password
- Role selection during signup (Manager or Member)
- Session persistence
- Protected routes based on authentication

### 2. **Project Management**
- Create projects with name, description, and status
- Project statuses: Planning, Active, On Hold, Completed
- Project dashboard showing all enrolled/managed projects
- Project workspace with multiple views
- Delete projects (managers only)

### 3. **Team & Resource Management**
- Add team members by email
- Assign roles and skills to team members
- Register available skills at project level
- Track team member availability and workload
- View team member profiles with:
  - Assigned tasks
  - Skills
  - Current workload
  - Task completion statistics

### 4. **Task Management**
- Create tasks ONLY from Timeline view (not from Kanban)
- Task properties:
  - Title and description
  - Status: To Do, In Progress, Review, Done
  - Assignee (must have required skills)
  - Required skills (multiple)
  - Start date and end date
  - Duration in days
  - Dependencies (array of task IDs)
  - Priority: Low, Medium, High
  - Story points (for Scrum estimation)
  - Sprint assignment (optional)
- Task dependency validation
- Drag-and-drop status updates (team members can only update their own tasks)

### 5. **Timeline View (Gantt Chart)**
- Visual timeline with Gantt-chart-like interface
- Display tasks as horizontal bars with start/end dates
- Show task dependencies with connecting arrows
- Drag to adjust task dates
- Color-coding by status or priority
- Filter by assignee, status, sprint
- **AI Scheduler button** (managers only):
  - Analyzes all registered tasks and dependencies
  - Considers team member skills and availability
  - Generates optimal schedule
  - Automatically assigns start/end dates
  - Assigns tasks to appropriate team members
  - Respects dependency constraints

### 6. **Kanban Board**
- Four columns: To Do, In Progress, Review, Done
- Drag-and-drop to update task status
- **NO task creation from Kanban** (tasks must be created in Timeline)
- Team members can only drag their own tasks
- Managers can drag any task
- Visual progress tracking
- Filter by sprint, assignee, priority
- Card shows: title, assignee, priority, story points

### 7. **Scrum Kanban Board**
- Sprint-focused view
- Backlog column for unassigned tasks
- Sprint columns showing active sprint tasks
- **Manual sprint assignment**: Managers drag tasks from backlog to sprint
- Sprint management:
  - Create sprints with name, dates, and goal
  - Set sprint status: Planned, Active, Completed
  - Track sprint velocity
  - View sprint burndown
- Story point estimation
- Sprint capacity planning
- Team members can update task status within sprint
- Cannot move tasks between sprints or backlog (managers only)

### 8. **AI-Powered Scheduling**
- **Location**: Timeline view only
- **Features**:
  - Analyze task dependencies to determine execution order
  - Consider required skills for each task
  - Match tasks to team members based on skills
  - Calculate optimal start/end dates
  - Detect and resolve scheduling conflicts
  - Balance workload across team members
  - Respect task dependencies (prerequisite tasks must complete first)
  - Generate realistic timeline based on task durations
- **Algorithm considerations**:
  - Critical path analysis
  - Resource leveling
  - Skill matching
  - Dependency resolution
  - Workload balancing

---

## Application Workflow

### For Project Managers:

1. **Initial Setup**
   - Sign up/Login as Project Manager
   - Create new project
   - Add team members with emails
   - Assign roles and skills to team members
   - Register available skills for the project

2. **Task Planning** (Timeline View)
   - Switch to Timeline view
   - Create tasks with all properties
   - Set task dependencies
   - Define required skills for each task
   - Set durations and priorities

3. **AI Scheduling**
   - Click "Generate Schedule with AI" button
   - AI analyzes tasks, dependencies, and team skills
   - AI automatically assigns:
     - Start and end dates
     - Appropriate team members
     - Optimal task order
   - Review and adjust AI-generated schedule if needed

4. **Sprint Planning** (Scrum Board)
   - Switch to Scrum Kanban view
   - Create sprints with goals and timeframes
   - Manually drag tasks from backlog to sprint
   - Set story points for estimation
   - Monitor sprint progress

5. **Monitoring** (Kanban View)
   - Switch to Kanban board
   - Monitor task progress across statuses
   - View team member activity
   - Track completion rates

### For Team Members:

1. **Onboarding**
   - Sign up/Login as Team Member
   - Receive project invitation (via email/notification)
   - Accept invitation to enroll in project

2. **Task Execution**
   - View assigned tasks in Timeline, Kanban, or Scrum views
   - Update status of own tasks only:
     - To Do → In Progress
     - In Progress → Review
     - Review → Done
   - Cannot create, delete, or reassign tasks
   - Cannot move tasks between sprints

3. **Collaboration**
   - View team member profiles
   - Check task dependencies
   - See project timeline and deadlines

---

## Data Structures

**IMPORTANT**: These interfaces match the backend API DTOs. Use these exact structures when making API calls.

```typescript
// Authentication
interface UserDto {
  userID?: number;
  name: string;
  email: string;
  password: string;
  role: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
}

interface AuthenticationRequest {
  email: string;
  password: string;
}

interface AuthenticationResponse {
  token: string;
}

// Projects
interface ProjectDto {
  projectID?: number;
  projectName: string;
  projectDescription: string;
  startDate: string; // YYYY-MM-DD format
  deadline: string; // YYYY-MM-DD format
  projectStatus: string; // 'planning' | 'active' | 'on-hold' | 'completed'
  projectManagerID?: number;
}

// Team Members
interface ProjectMemberDto {
  projectMemberID?: number;
  projectID?: number;
  teamMemberID?: number;
  teamMemberUsername?: string;
  teamMemberEmail?: string;
  enrollmentDate?: string; // YYYY-MM-DD format
  projectRole?: string;
  skills?: SkillDto[];
}

// Tasks & Assignments
interface TaskAssignmentDto {
  assignmentID?: number;
  taskID?: number;
  taskName?: string;
  requiredMemberNum?: number;
  assignedMemberIds?: number[];
  assignedMemberNames?: string[];
  scheduledStartDate?: string; // YYYY-MM-DD format
  scheduledEndDate?: string; // YYYY-MM-DD format
  projectID?: number;
  validMemberCount?: boolean;
  validationError?: string;
}

// Sprints
interface SprintDto {
  sprintID?: number;
  sprintName: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  sprintGoal: string;
  sprintStatus: string; // 'planned' | 'active' | 'completed'
}

// Skills
interface SkillDto {
  skillID?: number;
  skillName: string;
  projectID?: number;
}

interface ProjectMemberSkillDto {
  projectMemberID: number;
  skillIDs: number[];
  skills?: SkillDto[];
}

// Frontend-only interfaces for UI state
interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assigneeIds: number[];
  assigneeNames: string[];
  requiredSkills: SkillDto[];
  startDate?: string;
  endDate?: string;
  duration: number; // in days
  dependencies: number[]; // task IDs
  priority: 'low' | 'medium' | 'high';
  sprintId?: number;
  storyPoints?: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  manager: number;
  members: ProjectMemberDto[];
  registeredSkills: SkillDto[];
  tasks: TaskAssignmentDto[];
  sprints: SprintDto[];
  startDate: string;
  deadline: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
}
```

---

## Technical Requirements

### Tech Stack
- **React 18+** with TypeScript
- **React Router** (Data mode with createBrowserRouter)
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Drag and Drop**: react-dnd or similar
- **Date handling**: date-fns or similar
- **State Management**: React Context or local state
- **API Client**: fetch API with TypeScript
- **Backend**: RESTful API at `http://localhost:8080`

### API Integration

**IMPORTANT**: All components must fetch data from the backend API. Do NOT use local state or mock data for persistence.

#### Base Configuration
```typescript
const API_BASE_URL = 'http://localhost:8080';

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// Helper function for authenticated requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

#### Authentication Endpoints

**Register**
```typescript
// POST /api/auth/register
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
}

async function register(data: RegisterRequest) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Login**
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  
  const result = await response.json();
  // Store token in localStorage
  localStorage.setItem('auth_token', result.token);
  return result;
}
```

#### Project Endpoints

**Get All Projects**
```typescript
// GET /api/v1/projects
async function getAllProjects() {
  return apiRequest('/api/v1/projects');
}
```

**Get Project by ID**
```typescript
// GET /api/v1/projects/{id}
async function getProjectById(id: number) {
  return apiRequest(`/api/v1/projects/${id}`);
}
```

**Create Project**
```typescript
// POST /api/v1/projects
interface CreateProjectRequest {
  projectName: string;
  projectDescription: string;
  startDate: string; // YYYY-MM-DD format
  deadline: string; // YYYY-MM-DD format
  projectStatus: string;
  projectManagerID: number;
}

async function createProject(data: CreateProjectRequest) {
  return apiRequest('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Update Project**
```typescript
// PUT /api/v1/projects/{id}
async function updateProject(id: number, data: CreateProjectRequest) {
  return apiRequest(`/api/v1/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
```

**Delete Project**
```typescript
// DELETE /api/v1/projects/{id}
async function deleteProject(id: number) {
  return apiRequest(`/api/v1/projects/${id}`, {
    method: 'DELETE',
  });
}
```

**Enroll Team Member to Project**
```typescript
// POST /api/v1/projects/{id}/enroll
interface ProjectMemberDto {
  teamMemberID: number;
  projectRole: string;
}

async function enrollTeamMember(projectId: number, data: ProjectMemberDto) {
  return apiRequest(`/api/v1/projects/${projectId}/enroll`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Get Project Team Members**
```typescript
// GET /api/v1/projects/{projectId}/enrolled
async function getProjectTeamMembers(projectId: number) {
  return apiRequest(`/api/v1/projects/${projectId}/enrolled`);
}
```

#### Task Assignment Endpoints

**Get Task Assignments by Project**
```typescript
// GET /api/v1/project/{projectId}/tasks/assignments
async function getTaskAssignments(projectId: number) {
  return apiRequest(`/api/v1/project/${projectId}/tasks/assignments`);
}
```

**Get Single Task Assignment**
```typescript
// GET /api/v1/project/{projectId}/tasks/assignments/{taskId}
async function getTaskAssignment(projectId: number, taskId: number) {
  return apiRequest(`/api/v1/project/${projectId}/tasks/assignments/${taskId}`);
}
```

**Create Task Assignment**
```typescript
// POST /api/v1/project/{projectId}/tasks/assignments/{taskId}
interface TaskAssignmentDto {
  taskID: number;
  taskName: string;
  requiredMemberNum: number;
  assignedMemberIds: number[];
  scheduledStartDate?: string; // YYYY-MM-DD
  scheduledEndDate?: string; // YYYY-MM-DD
  projectID: number;
}

async function createTaskAssignment(projectId: number, taskId: number, data: TaskAssignmentDto) {
  return apiRequest(`/api/v1/project/${projectId}/tasks/assignments/${taskId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Update Task Assignment**
```typescript
// PUT /api/v1/project/{projectId}/tasks/assignments/{taskId}
async function updateTaskAssignment(projectId: number, taskId: number, data: TaskAssignmentDto) {
  return apiRequest(`/api/v1/project/${projectId}/tasks/assignments/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
```

**Schedule Task Assignment (Manual)**
```typescript
// POST /api/v1/project/{projectId}/tasks/assignments/schedule
async function scheduleTaskAssignment(projectId: number, data: TaskAssignmentDto) {
  return apiRequest(`/api/v1/project/${projectId}/tasks/assignments/schedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

#### AI Scheduler Endpoint (Critical)

**Activate AI Scheduler**
```typescript
// POST /api/v1/scheduling/project/{projectId}/run
// This endpoint triggers the AI scheduling algorithm on the backend
// The backend will analyze all tasks, dependencies, and team member skills
// Then it will automatically assign tasks to team members and set optimal dates
async function runAIScheduler(projectId: number): Promise<string> {
  const response = await apiRequest(`/api/v1/scheduling/project/${projectId}/run`, {
    method: 'POST',
  });
  return response; // Returns a status message string
}

// Usage in Timeline view:
async function handleAISchedule() {
  setLoading(true);
  try {
    const result = await runAIScheduler(projectId);
    console.log('AI Scheduler Result:', result);
    // Fetch updated assignments after scheduling
    const updatedAssignments = await getProjectAssignments(projectId);
    setTasks(updatedAssignments);
    showSuccessMessage('Schedule generated successfully!');
  } catch (error) {
    showErrorMessage('Failed to generate schedule');
  } finally {
    setLoading(false);
  }
}
```

**Get Scheduled Assignments**
```typescript
// GET /api/v1/scheduling/project/{projectId}/assignments
// Retrieve all task assignments after AI scheduling
async function getProjectAssignments(projectId: number) {
  return apiRequest(`/api/v1/scheduling/project/${projectId}/assignments`);
}
```

#### Sprint Endpoints

**Get Sprints by Project**
```typescript
// GET /api/v1/sprints/project/{projectId}
async function getSprintsByProject(projectId: number) {
  return apiRequest(`/api/v1/sprints/project/${projectId}`);
}
```

**Get Sprint by ID**
```typescript
// GET /api/v1/sprints/{id}
async function getSprintById(id: number) {
  return apiRequest(`/api/v1/sprints/${id}`);
}
```

**Create Sprint**
```typescript
// POST /api/v1/sprints/{projectId}
interface SprintDto {
  sprintName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  sprintGoal: string;
  sprintStatus: string;
}

async function createSprint(projectId: number, data: SprintDto) {
  return apiRequest(`/api/v1/sprints/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Update Sprint**
```typescript
// PUT /api/v1/sprints/{id}
async function updateSprint(id: number, data: SprintDto) {
  return apiRequest(`/api/v1/sprints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
```

**Delete Sprint**
```typescript
// DELETE /api/v1/sprints/{id}
async function deleteSprint(id: number) {
  return apiRequest(`/api/v1/sprints/${id}`, {
    method: 'DELETE',
  });
}
```

#### Skill Management Endpoints

**Get Project Skills**
```typescript
// GET /api/v1/project/{projectId}/skills
async function getProjectSkills(projectId: number) {
  return apiRequest(`/api/v1/project/${projectId}/skills`);
}
```

**Create Skill**
```typescript
// POST /api/v1/project/{projectId}/skills
interface SkillDto {
  skillName: string;
  projectID: number;
}

async function createSkill(projectId: number, data: SkillDto) {
  return apiRequest(`/api/v1/project/${projectId}/skills`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Get Skill by ID**
```typescript
// GET /api/v1/project/{projectId}/skills/{id}
async function getSkillById(projectId: number, skillId: number) {
  return apiRequest(`/api/v1/project/${projectId}/skills/${skillId}`);
}
```

**Delete Skill**
```typescript
// DELETE /api/v1/project/{projectId}/skills/{id}
async function deleteSkill(projectId: number, skillId: number) {
  return apiRequest(`/api/v1/project/${projectId}/skills/${skillId}`, {
    method: 'DELETE',
  });
}
```

#### Project Member Skills Endpoints

**Get Project Member Skills**
```typescript
// GET /api/v1/project/{projectId}/project-member-skills/{projectMemberID}
async function getProjectMemberSkills(projectMemberId: number) {
  return apiRequest(`/api/v1/project/{projectId}/project-member-skills/${projectMemberId}`);
}
```

**Add Skills to Project Member**
```typescript
// POST /api/v1/project/{projectId}/project-member-skills
interface ProjectMemberSkillDto {
  projectMemberID: number;
  skillIDs: number[];
}

async function addSkillsToProjectMember(projectId: number, data: ProjectMemberSkillDto) {
  return apiRequest(`/api/v1/project/${projectId}/project-member-skills`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

**Update Project Member Skills**
```typescript
// PUT /api/v1/project/{projectId}/project-member-skills/{projectMemberID}
async function updateProjectMemberSkills(projectId: number, projectMemberId: number, data: ProjectMemberSkillDto) {
  return apiRequest(`/api/v1/project/${projectId}/project-member-skills/${projectMemberId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
```

**Remove Single Skill from Project Member**
```typescript
// DELETE /api/v1/project/{projectId}/project-member-skills/{projectMemberID}/skill/{skillID}
async function removeSkillFromProjectMember(projectMemberId: number, skillId: number) {
  return apiRequest(`/api/v1/project/{projectId}/project-member-skills/${projectMemberId}/skill/${skillId}`, {
    method: 'DELETE',
  });
}
```

**Remove All Skills from Project Member**
```typescript
// DELETE /api/v1/project/{projectId}/project-member-skills/{projectMemberID}/all-skills
async function removeAllSkillsFromProjectMember(projectMemberId: number) {
  return apiRequest(`/api/v1/project/{projectId}/project-member-skills/${projectMemberId}/all-skills`, {
    method: 'DELETE',
  });
}
```

#### Data Fetching Patterns

**Component Data Loading**
```typescript
// Example: Timeline component
function TimelineView({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const assignments = await getTaskAssignments(projectId);
        setTasks(assignments);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [projectId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return <Timeline tasks={tasks} />;
}
```

**Error Handling Best Practices**
```typescript
// Centralized error handler
function handleApiError(error: Error) {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Forbidden - show permission error
    showErrorNotification('You do not have permission to perform this action');
  } else if (error.message.includes('404')) {
    // Not found
    showErrorNotification('Resource not found');
  } else {
    // Generic error
    showErrorNotification('An error occurred. Please try again.');
  }
}
```

### Routing Structure
```
/                      → Redirect to /login or /dashboard
/login                 → Login page
/signup                → Signup page
/dashboard             → Project list (protected)
/projects/:projectId   → Project workspace (protected)
/settings              → User settings (protected)
/about                 → About page
/*                     → 404 Not Found
```

### Component Architecture

```
src/
├── app/
│   ├── App.tsx                          # Main app with router
│   ├── routes.tsx                       # Route configuration
│   ├── components/
│   │   ├── login-form.tsx              # Authentication
│   │   ├── signup-form.tsx
│   │   ├── project-list.tsx            # Dashboard
│   │   ├── project-workspace.tsx       # Main workspace
│   │   ├── timeline-view.tsx           # Gantt chart view
│   │   ├── kanban-board.tsx            # Standard kanban
│   │   ├── scrum-kanban-board.tsx      # Sprint-based kanban
│   │   ├── ai-scheduler.tsx            # AI scheduling engine
│   │   ├── resource-management.tsx     # Team members
│   │   ├── task-modal.tsx              # Task creation/editing
│   │   ├── sprint-modal.tsx            # Sprint management
│   │   ├── team-member-modal.tsx       # Add team members
│   │   └── task-management.tsx         # Task list/grid
│   ├── layouts/
│   │   ├── root-layout.tsx
│   │   └── auth-layout.tsx
│   └── pages/
│       ├── login-page.tsx
│       ├── signup-page.tsx
│       ├── dashboard-page.tsx
│       ├── project-workspace-page.tsx
│       ├── settings-page.tsx
│       ├── about-page.tsx
│       └── not-found-page.tsx
```

---

## Key Implementation Rules

### 1. **Task Creation Workflow**
- ❌ NO task creation from Kanban board
- ❌ NO task creation from Scrum board
- ✅ Tasks ONLY created from Timeline view
- ✅ Use task modal with all required fields
- ✅ Validate required skills exist in project
- ✅ Validate assignee has required skills
- ✅ Validate dependencies don't create circular references

### 2. **Task Status Updates**
- ✅ Team members can only update their own tasks
- ✅ Managers can update any task
- ✅ Drag-and-drop between status columns
- ✅ Cannot move tasks if dependencies not met
- ✅ Status changes reflect immediately in all views

### 3. **Sprint Assignment**
- ❌ NO automatic sprint assignment
- ✅ Managers manually drag tasks from backlog to sprint
- ✅ Tasks start in backlog by default
- ✅ Can only assign tasks to active or planned sprints
- ✅ Team members cannot move tasks between sprints

### 4. **AI Scheduler**
- ✅ Available ONLY in Timeline view
- ✅ Only visible to project managers
- ✅ Triggers backend API: `POST /api/v1/scheduling/project/{projectId}/run`
- ✅ Backend performs scheduling and persists results
- ✅ Frontend fetches updated assignments after scheduling completes
- ✅ Show loading state during scheduling operation
- ✅ Handle errors (missing skills, circular dependencies, etc.)
- ✅ Backend algorithm:
  - Topologically sort tasks based on dependencies
  - Assign tasks to team members with matching skills
  - Calculate start dates based on dependency completion
  - Set end dates based on task duration
  - Distribute workload evenly when possible
  - Flag conflicts (e.g., over-allocation, missing skills)

### 5. **Permissions Matrix**

| Action | Manager | Member |
|--------|---------|--------|
| Create project | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Add team members | ✅ | ❌ |
| Create tasks (Timeline) | ✅ | ❌ |
| Edit any task | ✅ | ❌ |
| Edit own task status | ✅ | ✅ |
| Run AI scheduler | ✅ | ❌ |
| Create sprints | ✅ | ❌ |
| Move tasks to sprint | ✅ | ❌ |
| View all views | ✅ | ✅ |

---

## UI/UX Guidelines

### Design Principles
- Clean, modern interface with gradient backgrounds
- Card-based layouts for projects and tasks
- Color-coded status indicators
- Responsive design for mobile and desktop
- Drag-and-drop interactions for intuitive workflow
- Loading states for AI operations
- Clear visual hierarchy
- Accessible forms and controls

### Color Scheme
- **Primary**: Blue (#3B82F6) for managers, Purple (#9333EA) for members
- **Status Colors**:
  - To Do: Gray
  - In Progress: Blue
  - Review: Yellow
  - Done: Green
- **Priority Colors**:
  - Low: Gray
  - Medium: Yellow
  - High: Red
- **Project Status**:
  - Planning: Blue
  - Active: Green
  - On Hold: Yellow
  - Completed: Gray

### Typography
- Use default Tailwind font classes
- Clear hierarchy with headings (h1, h2, h3)
- Readable body text (text-gray-600, text-gray-700)
- Emphasis on important information

---

## AI Scheduler Algorithm (Backend Implementation)

**IMPORTANT**: The AI scheduling algorithm runs on the backend. The frontend only triggers it via the API endpoint `POST /api/v1/scheduling/project/{projectId}/run`.

### Frontend Implementation

```typescript
// Timeline view - AI Scheduler button handler
async function handleRunAIScheduler(projectId: number) {
  try {
    setScheduling(true);
    
    // Call backend AI scheduler endpoint
    const result = await runAIScheduler(projectId);
    console.log('Scheduling result:', result);
    
    // Fetch updated task assignments from backend
    const updatedAssignments = await getProjectAssignments(projectId);
    
    // Update UI with scheduled tasks
    setTasks(updatedAssignments);
    
    showSuccessNotification('Schedule generated successfully!');
  } catch (error) {
    handleApiError(error);
    showErrorNotification('Failed to generate schedule. Please ensure all tasks have required skills defined.');
  } finally {
    setScheduling(false);
  }
}
```

### Backend Algorithm (Reference - for understanding)

The backend implements the following scheduling logic:

```pseudocode
function generateOptimalSchedule(projectId):
  // 1. Fetch project data
  project = getProjectById(projectId)
  tasks = getAllTasksForProject(projectId)
  teamMembers = getProjectTeamMembers(projectId)
  
  // 2. Validate inputs
  validateTasksHaveRequiredSkills(tasks)
  validateTeamMembersHaveSkills(teamMembers)
  
  // 3. Build dependency graph
  dependencyGraph = buildDependencyGraph(tasks)
  
  // 4. Topological sort to determine execution order
  sortedTasks = topologicalSort(dependencyGraph)
  
  // 5. Initialize tracking
  teamWorkload = initializeWorkload(teamMembers)
  scheduledTasks = []
  
  // 6. Schedule each task
  for task in sortedTasks:
    // Find team member with matching skills
    eligibleMembers = teamMembers.filter(member => 
      hasRequiredSkills(member.skills, task.requiredSkills)
    )
    
    // Select member with lowest current workload
    assignedMember = findLeastBusyMember(eligibleMembers, teamWorkload)
    
    // Calculate earliest start date based on dependencies
    earliestStart = calculateEarliestStart(
      task.dependencies,
      scheduledTasks,
      project.startDate
    )
    
    // Calculate start date based on assignee availability
    startDate = findNextAvailableSlot(
      assignedMember,
      teamWorkload,
      earliestStart
    )
    
    // Calculate end date based on duration
    endDate = addWorkingDays(startDate, task.duration)
    
    // Create or update task assignment
    taskAssignment = TaskAssignment {
      taskID: task.id,
      scheduledStartDate: startDate,
      scheduledEndDate: endDate,
      assignedMemberIds: [assignedMember.id],
      projectID: projectId
    }
    
    saveTaskAssignment(taskAssignment)
    
    // Update workload tracking
    updateWorkload(teamWorkload, assignedMember, startDate, endDate)
    
    scheduledTasks.push(taskAssignment)
  
  return "Scheduling completed successfully"
```

### Expected Backend Behavior

1. **Input Validation**
   - All tasks must have required skills defined
   - Team members must have skills assigned
   - No circular dependencies in task graph

2. **Dependency Resolution**
   - Tasks with no dependencies start first
   - Dependent tasks start only after prerequisites complete
   - Uses topological sort to determine valid execution order

3. **Skill Matching**
   - Only assign tasks to team members with required skills
   - If no member has required skills, task remains unassigned

4. **Workload Balancing**
   - Distribute tasks evenly across team members
   - Prefer assigning to member with least current workload

5. **Date Calculation**
   - Start date = max(earliest dependency completion, assignee availability)
   - End date = start date + task duration (in working days)

6. **Persistence**
   - All scheduled assignments saved to database
   - Frontend fetches updated assignments after scheduling

---

## Testing Scenarios

### 1. **Authentication Flow**
- User can sign up as manager or member
- User can log in with credentials
- Protected routes redirect to login
- Logout clears session

### 2. **Project Creation**
- Manager creates project
- Project appears in dashboard
- Project details are saved correctly

### 3. **Team Management**
- Add team member with email
- Assign skills to team member
- Team member receives invitation
- Team member can enroll in project

### 4. **Task Creation**
- Create task in Timeline view only
- Task validates required skills
- Task validates assignee skills
- Dependencies are tracked correctly

### 5. **AI Scheduling**
- AI assigns tasks to correct team members
- Dependencies are respected
- No circular dependencies
- Workload is balanced
- Dates are calculated correctly

### 6. **Sprint Management**
- Create sprint with dates
- Manually move tasks to sprint
- Track sprint progress
- Complete sprint

### 7. **Permission Testing**
- Members cannot create tasks
- Members can only update own tasks
- Members cannot access AI scheduler
- Managers have full access

---

## Development Best Practices

1. **Type Safety**: Use TypeScript interfaces for all data structures
2. **Component Reusability**: Create small, focused components
3. **State Management**: Keep state close to where it's used
4. **Error Handling**: Validate inputs and show clear error messages
5. **Loading States**: Show spinners during async operations
6. **Responsive Design**: Test on mobile, tablet, and desktop
7. **Accessibility**: Use semantic HTML and ARIA labels
8. **Performance**: Memoize expensive calculations
9. **Code Organization**: Group related components and utilities
10. **Documentation**: Add comments for complex logic

---

## Next Steps for Implementation

1. Set up React project with TypeScript and Tailwind CSS
2. Implement authentication and routing
3. Create data structures and context providers
4. Build project list and dashboard
5. Implement Timeline view with Gantt chart
6. Add task creation modal
7. Build Kanban board with drag-and-drop
8. Implement Scrum board with sprint management
9. Develop AI scheduling algorithm
10. Add team member management
11. Implement permissions and role-based access
12. Add settings and user profile pages
13. Test all workflows thoroughly
14. Optimize performance and UX

---

**This system provides a complete project management solution with intelligent scheduling, role-based collaboration, and multiple visualization options for effective team coordination.**
