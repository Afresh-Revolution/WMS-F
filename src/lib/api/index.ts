export {
  apiRequest,
  buildQuery,
  ApiError,
  extractErrorMessage,
  getSessionToken,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./client";
export type { ApiListResponse, PaginatedResponse, Id } from "./types";
export { unwrapList } from "./types";

export { authApi, dashboardApi, healthApi, searchApi } from "./auth";
export type { AuthUser, LoginPayload, LoginResponse, BootstrapPayload, BootstrapStatus } from "./auth";

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
