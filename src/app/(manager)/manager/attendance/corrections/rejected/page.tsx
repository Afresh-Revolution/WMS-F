import { AttendancePage } from "@/components/attendance/AttendancePage";

export default function ManagerAttendanceCorrectionsRejectedRoute() {
  return (
    <AttendancePage
      section="corrections"
      variant="manager"
      initialCorrectionFilter="Rejected"
    />
  );
}
