import {
  DEPARTMENTS,
  PROJECT_ID,
  PROJECT_REV,
  type DepartmentId,
  type DepartmentStatus,
} from "./catalog";
import {
  inspectGrokAdapter,
  type GrokAdapterConfig,
  type GrokAdapterSnapshot,
} from "../intelligence/grok-adapter";

export type DepartmentSnapshot = {
  id: DepartmentId;
  title: string;
  route: string;
  status: DepartmentStatus;
  group: string;
};

export type AnalyzeSnapshot = {
  projectId: string;
  projectRev: number;
  departmentCount: number;
  statusCounts: Record<DepartmentStatus, number>;
  departments: DepartmentSnapshot[];
  integrations: {
    grok: GrokAdapterSnapshot;
  };
};

export function getDepartment(id: DepartmentId): DepartmentSnapshot {
  const department = DEPARTMENTS.find((entry) => entry.id === id);
  if (!department) {
    throw new Error(`Unknown department: ${id}`);
  }

  return {
    id: department.id,
    title: department.title,
    route: department.path,
    status: department.status,
    group: department.group,
  };
}

export function analyzeDepartments(grokConfig: GrokAdapterConfig = {}): AnalyzeSnapshot {
  const statusCounts: Record<DepartmentStatus, number> = {
    registered: 0,
    partial: 0,
    ready: 0,
    blocked: 0,
  };

  const departments = DEPARTMENTS.map((department) => {
    statusCounts[department.status] += 1;
    return getDepartment(department.id);
  });

  return {
    projectId: PROJECT_ID,
    projectRev: PROJECT_REV,
    departmentCount: departments.length,
    statusCounts,
    departments,
    integrations: {
      grok: inspectGrokAdapter(grokConfig),
    },
  };
}
