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
export { unwrapList, unwrapData, unwrapRecord, asRecord } from "./types";

export { managerApi } from "./manager";
export type { ManagerApi, ManagerListParams } from "./manager";

export { secretaryApi } from "./secretary";
export type { SecretaryListParams } from "./secretary";

export { employeeApi } from "./employee";
export type { EmployeeApi } from "./employee";

export { authApi, dashboardApi, healthApi, searchApi, DEFAULT_LOGIN_OPTIONS } from "./auth";
export type { AuthUser, LoginPayload, LoginOptions, LoginResponse, BootstrapPayload, BootstrapStatus } from "./auth";

export { profileApi } from "./profile";
export type { ProfileRecord } from "./profile";

export { systemManagementApi, systemApi } from "./systemManagement";
export { systemHealthApi, backupsApi, technicalAuditLogsApi } from "./systemHealth";
export { securityApi } from "./security";
export { emailConfigApi, notificationConfigApi, notificationsApi } from "./notifications";
export { usersApi, rolesApi, permissionsApi } from "./users";
export { departmentsApi, hrApi } from "./departments";
export { lookupsApi, loadHodOptions, loadManagerLookups, readLookupLists } from "./lookups";
export { reportsApi, auditLogsApi, loadOrgReport } from "./reports";
export { superAdminApi, saRequest } from "./superAdmin";

export { accountantApi, accountantSettled } from "./accountant";
export { internApi, internSettled, nyscInternsManageApi } from "./intern";
export { attendanceApi, attendanceSettled } from "./attendance";
export type { GpsCheckInBody } from "./attendance";

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
export {
  listCompanyAnnouncements,
  listManagerAnnouncements,
  publishCompanyAnnouncement,
  publishManagerAnnouncement,
  getAdminAnnouncementDashboard,
  getManagerAnnouncementDashboard,
  publishAdminAnnouncement,
  publishManagerDraft,
  pinAdminAnnouncement,
  pinManagerAnnouncement,
  unpinAdminAnnouncement,
  unpinManagerAnnouncement,
  listStaffAnnouncements,
  getStaffUnreadCount,
  getStaffAnnouncement,
  markStaffAnnouncementRead,
  staffUnreadCountFrom,
} from "./companyAnnouncements";
export {
  listLeaveTypes,
  listMyLeave,
  listLeaveBalances,
  listOrganisationLeave,
  applyForLeave,
  approveLeaveExtension,
  extendLeaveRequest,
  isActiveLeaveBlock,
  leaveRequestIdFromError,
  rejectLeaveExtension,
  getEmployeeLeave,
  approveLeaveRequest,
  rejectLeaveRequest,
  withdrawLeaveRequest,
  leaveDayCount,
  employeeBalanceCards,
  remainingDaysForType,
  leaveDecisionLetter,
} from "./leave";
export type { LeaveTypeOption, LeaveBalanceCard, LeaveApplyInput } from "./leave";
export {
  listDisciplinaryRecords,
  createDisciplinaryRecord,
  acknowledgeDisciplinaryRecord,
  closeDisciplinaryRecord,
} from "./discipline";
export {
  listStaffEmployees,
  getStaffEmployee,
  createStaffEmployee,
  findStaffEmployeeByEmail,
  mergeLocalEmployees,
} from "./staffEmployees";
export type { DisciplinaryRecordInput } from "./discipline";
export type { ResourceModule } from "./resources";
