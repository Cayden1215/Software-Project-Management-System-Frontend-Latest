# Gantt Chart View - API-Based Unassigned Tasks Analysis & Implementation

## Overview
The Gantt Chart View component has been updated to use the API endpoint `GET /api/v1/project/{projectId}/tasks/assignments/unassigned` for obtaining unassigned tasks instead of computing them locally.

## Analysis

### Previous Implementation
- **Approach**: Local computation using `useMemo`
- **Logic**: Compared scheduled task IDs from assignments with project tasks
- **Issue**: Inefficient for large projects; duplicated backend logic in frontend

### New Implementation  
- **Approach**: API-driven data fetching
- **Endpoint**: `GET /api/v1/project/{projectId}/tasks/assignments/unassigned`
- **Benefits**: 
  - Single source of truth from backend
  - More maintainable and scalable
  - Cleaner component state management
  - Better separation of concerns

## Technical Changes

### 1. API Client Updates (`src/app/services/api-client.ts`)

#### New Method Added to `taskAssignmentAPI`
```typescript
async getUnassignedTasks(projectId: number): Promise<TaskDto[]> {
  return apiRequest<TaskDto[]>(`/api/v1/project/${projectId}/tasks/assignments/unassigned`);
}
```

**Returns**: Array of `TaskDto` objects representing unassigned tasks

### 2. Component Updates (`src/app/components/gantt-chart-view.tsx`)

#### New State Variables
```typescript
const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
const [unassignedTasksLoading, setUnassignedTasksLoading] = useState(false);
const [unassignedTasksError, setUnassignedTasksError] = useState<string | null>(null);
```

#### New Function: `fetchUnassignedTasks`
- Fetches unassigned tasks from the API
- Converts `TaskDto[]` to `Task[]` for component compatibility
- Handles loading and error states
- Called on:
  - Component mount
  - Every 30 seconds (polling interval)
  - After successful task scheduling

#### Removed Code
- Old `unscheduledTasks` useMemo computation
- Local filtering logic based on assignments

#### Updated Components
1. **Add Task Button**
   - Displays count from `unassignedTasks.length`
   - Disabled state based on API-fetched list

2. **Add Task Modal - Task Selection Dropdown**
   - Shows loading spinner while fetching
   - Displays error message if fetch fails
   - Populates with tasks from API
   - Gracefully handles empty state

3. **Polling Mechanism**
   - Refreshes both assigned tasks AND unassigned tasks every 30 seconds
   - Keeps UI synchronized with backend state

## Data Flow

```
Component Mount / Polling Interval
    ↓
[refreshTasks() & fetchUnassignedTasks() called]
    ↓
API Calls:
  - GET /api/v1/project/{id}/tasks/assignments → assignments list
  - GET /api/v1/project/{id}/tasks/assignments/unassigned → unassigned tasks
    ↓
[Update component state]
    ↓
UI Renders:
  - Gantt chart with assigned tasks
  - "Add Task" button with unassigned count
  - Modal populates with unassigned task options
```

## Benefits

1. **Correctness**: Backend determines what's unassigned, not frontend logic
2. **Performance**: Delegated computation to API; frontend just displays
3. **Maintainability**: Changes to assignment logic only in backend
4. **Real-time Sync**: Polling keeps unassigned list current
5. **Error Handling**: Graceful degradation with error messages
6. **User Experience**: Loading states prevent UI flicker

## Error Handling

- **API Failures**: Logged to console; error message shown in modal
- **Fallback Behavior**: Empty task list displayed if fetch fails
- **Non-blocking**: Unassigned tasks error doesn't affect main Gantt chart

## TypeScript Types

### TaskDto → Task Conversion
```typescript
{
  id: String(dto.taskID),
  title: dto.taskName || 'Untitled Task',
  description: dto.description,
  status: dto.taskStatus as Task['status'],
  assignee: dto.assignee,
  assignedMemberIds: dto.assignedMemberIds,
  requiredSkills: dto.requiredSkills,
  skillIDs: dto.skillIDs,
  startDate: dto.startDate,
  endDate: dto.endDate,
  estimatedDuration: dto.estimatedDuration,
  requiredMemberNum: dto.requiredMemberNum,
  dependencies: dto.dependencyIds,
  sprintId: dto.sprintID,
  storyPoints: dto.storyPoints,
}
```

## Testing Recommendations

1. **API Endpoint**: Verify backend returns correct unassigned tasks
2. **Loading State**: Check modal shows spinner while loading
3. **Error Handling**: Test with simulated API failures
4. **Polling**: Verify tasks update every 30 seconds
5. **Modal Interaction**: Test task selection and scheduling
6. **Edge Cases**: 
   - No unassigned tasks
   - Large number of unassigned tasks
   - Network latency

## Files Modified

- `src/app/services/api-client.ts` - Added `getUnassignedTasks` method
- `src/app/components/gantt-chart-view.tsx` - Integrated API-based fetching
