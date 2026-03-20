import { PageHeader } from "@/components/common/page-header";
import { SummaryCard } from "@/components/common/summary-card";
import { StatusBadge } from "@/components/common/status-badge";
import { formatCurrencyRs } from "@/lib/utils";

export default function OrganizerDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Organizer Dashboard" description="Performance overview for active trips and participant operations." />

      <div className="border border-border bg-card p-4">
        <p className="text-sm">Verification status: <StatusBadge status="pending" /></p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Revenue" value={formatCurrencyRs(12480000)} meta="Placeholder summary" />
        <SummaryCard title="Active Trips" value="8" meta="Published and ongoing" />
        <SummaryCard title="Pending Participants" value="19" meta="Requests awaiting action" />
        <SummaryCard title="Reviews" value="4.7" meta="Average organizer rating" />
      </div>
    </div>
  );
}
