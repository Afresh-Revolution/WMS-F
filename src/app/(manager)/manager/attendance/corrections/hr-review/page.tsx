import { AttendancePage } from "@/components/attendance/AttendancePage";

export default function ManagerAttendanceCorrectionsHrReviewRoute() {
  return (
    <AttendancePage
      section="corrections"
      variant="manager"
      initialCorrectionFilter="Under HR Review"
    />
  );
}
