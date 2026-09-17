import { Suspense } from "react";
import { EmployeesPage } from "@/components/employees/EmployeesPage";

export default function EmployeesRoute() {
  return (
    <Suspense fallback={null}>
      <EmployeesPage />
    </Suspense>
  );
}
