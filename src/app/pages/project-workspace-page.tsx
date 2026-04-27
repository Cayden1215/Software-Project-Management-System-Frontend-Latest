import { useState, useEffect } from 'react';
import { User, Project, Task, Sprint, TeamMember } from '../App';
import { ProjectWorkspace } from '../components/project-workspace';
import { useParams, useNavigate, Navigate } from 'react-router';
import { projectAPI, ProjectDto, skillAPI, sprintAPI, taskAPI } from '../services/api-client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectWorkspacePageProps {
  currentUser: User;
}

// Convert ProjectDto from API to Project domain model
function convertProjectDtoToProject(dto: ProjectDto): Project {
  return {
    id: String(dto.projectID || ''),
    name: dto.projectName,
    description: dto.projectDescription,
    manager: dto.projectManagerID ? String(dto.projectManagerID) : '', // Store manager ID for comparison
    members: [],
    teamMembers: [],
    registeredSkills: [],
    tasks: [],
    sprints: [],
    createdAt: dto.startDate,
    status: (dto.projectStatus?.toLowerCase() as any) || 'planning',
  };
}

function convertTaskStatus(status: string | undefined): Task['status'] {
  switch ((status || '').toLowerCase()) {
    case 'todo':
      return 'todo';
    case 'in-progress':
    case 'inprogress':
      return 'in-progress';
    case 'review':
      return 'review';
    case 'done':
      return 'done';
    default:
      return 'todo';
  }
}

function convertTaskPriority(priority: string | undefined): Task['priority'] {
  switch ((priority || '').toLowerCase()) {
    case 'low':
      return 'low';
    case 'high':
      return 'high';
    default:
      return 'medium';
  }
}

function convertSprintStatus(status: string | undefined): Sprint['status'] {
  switch ((status || '').toLowerCase()) {
    case 'planned':
      return 'planned';
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    default:
      return 'planned';
  }
}

export default function ProjectWorkspacePage({
  currentUser,
}: ProjectWorkspacePageProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjectDetails = async (id: number): Promise<Project> => {
    const projectDto = await projectAPI.getProjectById(id);
    const baseProject = convertProjectDtoToProject(projectDto);

    const [taskDtos, sprintDtos, projectMembers, skillDtos] = await Promise.all([
      taskAPI.getProjectTasks(id).catch(() => []),
      sprintAPI.getSprintsByProject(id).catch(() => []),
      projectAPI.getProjectTeamMembers(id).catch(() => []),
      skillAPI.getProjectSkills(id).catch(() => []),
    ]);

    const tasks: Task[] = taskDtos.map((dto) => ({
      id: dto.taskID?.toString() || '',
      title: dto.taskName,
      description: dto.description,
      status: convertTaskStatus(dto.taskStatus),
      assignee: dto.assignee,
      requiredSkills: dto.requiredSkills || [],
      startDate: dto.startDate,
      endDate: dto.endDate,
      estimatedDuration: dto.estimatedDuration || 0,
      requiredMemberNum: dto.requiredMemberNum ?? 1,
      dependencies: (dto.dependencyIds || []).map((depId) => depId.toString()),
      priority: convertTaskPriority(dto.priority),
      sprintId: dto.sprintID?.toString(),
      storyPoints: dto.storyPoints,
    }));

    const sprints: Sprint[] = sprintDtos.map((dto) => {
      const sprintId = dto.sprintID?.toString() || '';
      return {
        id: sprintId,
        name: dto.sprintName,
        startDate: dto.startDate,
        endDate: dto.endDate,
        goal: dto.sprintGoal,
        status: convertSprintStatus(dto.sprintStatus),
        taskIds: tasks.filter((t) => t.sprintId === sprintId).map((t) => t.id),
      };
    });

    const teamMembers: TeamMember[] = projectMembers.map((m) => ({
      id: (m.projectMemberID ?? m.teamMemberID ?? '').toString(),
      name: m.teamMemberUsername || m.teamMemberEmail || 'Team Member',
      email: m.teamMemberEmail || '',
      role: m.projectRole || 'member',
      skills: (m.skills || []).map((s) => s.skillName).filter(Boolean),
    }));

    const registeredSkills = Array.from(new Set(skillDtos.map((s) => s.skillName).filter(Boolean))).sort();

    return {
      ...baseProject,
      tasks,
      sprints,
      teamMembers,
      registeredSkills,
      members: teamMembers.map((m) => m.email).filter(Boolean),
    };
  };

  // Fetch project on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!projectId) {
          setError('Project ID not found');
          return;
        }
        const loadedProject = await loadProjectDetails(Number(projectId));
        setProject(loadedProject);
      } catch (err: any) {
        console.error('Failed to load project:', err);
        setError('Failed to load project');
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleUpdateProject = async (updatedProject: Project) => {
    const previousProject = project;

    // Always update local state for immediate UI feedback
    setProject(updatedProject);

    // Only persist "project-level" changes here. Task/sprint changes are persisted by their own APIs.
    if (!previousProject) return;
    const metaChanged =
      previousProject.name !== updatedProject.name ||
      previousProject.description !== updatedProject.description ||
      previousProject.status !== updatedProject.status ||
      previousProject.manager !== updatedProject.manager ||
      previousProject.createdAt !== updatedProject.createdAt;

    if (!metaChanged) return;

    try {
      const updateDto: ProjectDto = {
        projectID: Number(updatedProject.id),
        projectName: updatedProject.name,
        projectDescription: updatedProject.description,
        startDate: updatedProject.createdAt,
        deadline: updatedProject.createdAt, // Using same date as fallback
        projectStatus: updatedProject.status,
        projectManagerID: Number(updatedProject.manager),
      };
      await projectAPI.updateProject(Number(updatedProject.id), updateDto);
      toast.success('Project updated successfully');
    } catch (err: any) {
      console.error('Failed to update project:', err);
      toast.error('Failed to update project');
      if (projectId) {
        const loadedProject = await loadProjectDetails(Number(projectId));
        setProject(loadedProject);
      }
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return <Navigate to="/dashboard" replace />;
  }

  // Compare user ID instead of email - the manager field stores the projectManagerID
  const isProjectManager = project.manager === currentUser.id || currentUser.role === 'manager';

  return (
    <ProjectWorkspace
      project={project}
      currentUser={currentUser}
      isManager={isProjectManager}
      onUpdateProject={handleUpdateProject}
      onBack={handleBack}
    />
  );
}
