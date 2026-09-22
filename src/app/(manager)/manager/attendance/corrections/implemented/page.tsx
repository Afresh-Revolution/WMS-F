import { AttendancePage } from "@/components/attendance/AttendancePage";

export default function ManagerAttendanceCorrectionsImplementedRoute() {
  return (
    <AttendancePage
      section="corrections"
      variant="manager"
      initialCorrectionFilter="Implemented"
    />
  );
}
