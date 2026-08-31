<<<<<<< HEAD
export { getAccessToken, setAccessToken, clearAccessToken } from "./auth";
export { managerApi } from "./manager";
export { managerRequest, getManagerBaseUrl, isLiveApiEnabled, unwrapList, unwrapData } from "./client";
export { ApiError } from "./types";
export type { ManagerListParams, ListResult, PaginationMeta } from "./types";
=======
export { apiRequest, buildQuery, ApiError, getAccessToken, getRefreshToken, setTokens, clearTokens } from "./client";
export type { ApiListResponse, PaginatedResponse, Id } from "./types";
export { unwrapList } from "./types";

export { authApi, dashboardApi, healthApi, searchApi } from "./auth";
export type { AuthUser, LoginPayload, LoginResponse, BootstrapPayload } from "./auth";

export { profileApi } from "./profile";
export type { ProfileRecord } from "./profile";

export { systemManagementApi, systemApi } from "./systemManagement";
export { systemHealthApi, backupsApi, technicalAuditLogsApi } from "./systemHealth";
export { securityApi } from "./security";
export { emailConfigApi, notificationConfigApi, notificationsApi } from "./notifications";
export { usersApi, rolesApi, permissionsApi } from "./users";
export { departmentsApi, hrApi } from "./departments";
export { reportsApi, auditLogsApi } from "./reports";

export {
  createResourceApi,
  employersApi,
  branchesApi,
  employeesApi,
  internsApi,
  nyscApi,
  leaveTypesApi,
  salaryIncrementsApi,
  promotionsApi,
  tasksApi,
  vendorsApi,
  settingsApi,
  documentsApi,
  operationalAuditApi,
  helpApi,
  leaveApi,
  meetingsApi,
  meetingTypesApi,
  meetingRoomsApi,
  targetsApi,
  payrollApi,
  salariesApi,
  purchaseRequestsApi,
  purchaseOrdersApi,
  receiptsApi,
  billsApi,
  expensesApi,
  expensePoliciesApi,
  eventsApi,
  disciplineApi,
  nyscInternsApi,
  announcementsApi,
  purchasesApi,
} from "./resources";
export type { ResourceModule } from "./resources";
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
