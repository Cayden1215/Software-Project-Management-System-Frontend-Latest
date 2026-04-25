import { useState, useEffect } from 'react';
import { User, Project } from '../App';
import { ProjectWorkspace } from '../components/project-workspace';
import { useParams, useNavigate, Navigate } from 'react-router';
import { projectAPI, ProjectDto } from '../services/api-client';
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

export default function ProjectWorkspacePage({
  currentUser,
}: ProjectWorkspacePageProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const projectDto = await projectAPI.getProjectById(Number(projectId));
        const convertedProject = convertProjectDtoToProject(projectDto);
        setProject(convertedProject);
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
    try {
      // Update the local state first for immediate UI feedback
      setProject(updatedProject);
      
      // Then update on server
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
      // Reload to sync with server
      const projectDto = await projectAPI.getProjectById(Number(projectId));
      setProject(convertProjectDtoToProject(projectDto));
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
  const isProjectManager = project.manager === currentUser.id || currentUser.role === 'admin';

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
