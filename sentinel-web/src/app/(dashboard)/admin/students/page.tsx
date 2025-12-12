import { StudentsDataTable } from "@/components/admin/StudentsDataTable";

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all student profiles in the system
        </p>
      </div>

      {/* Data Table */}
      <StudentsDataTable />
    </div>
  );
}
