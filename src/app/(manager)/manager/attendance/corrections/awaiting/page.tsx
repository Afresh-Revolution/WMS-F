import { AttendancePage } from "@/components/attendance/AttendancePage";

export default function ManagerAttendanceCorrectionsAwaitingRoute() {
  return (
    <AttendancePage
      section="corrections"
      variant="manager"
      initialCorrectionFilter="Awaiting Admin Approval"
    />
  );
}
