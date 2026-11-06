// Milestone List Component
// Displays all milestones for a ticket with progress tracking

import { MilestoneCard } from "./MilestoneCard";
import type { Milestone as ApiMilestone } from "../api/tickets";

interface MilestoneListProps {
  milestones: ApiMilestone[];
  ticketId: string;
  userRole: "SUPPLIER" | "BUYER";
  ticketStatus: string;
  onMilestoneUpdate?: () => void;
}

export function MilestoneList({
  milestones,
  ticketId,
  userRole,
  ticketStatus,
  onMilestoneUpdate
}: MilestoneListProps) {
  // Calculate progress
  const totalBp = milestones.reduce((sum, m) => sum + m.releaseBp, 0);
  const releasedBp = milestones
    .filter(m => m.status === "RELEASED")
    .reduce((sum, m) => sum + m.releaseBp, 0);
  const releasedPercentage = totalBp > 0 ? (releasedBp / totalBp) * 100 : 0;

  // Group milestones by status for summary
  const statusCounts = {
    PENDING: milestones.filter(m => m.status === "PENDING").length,
    SUBMITTED: milestones.filter(m => m.status === "SUBMITTED").length,
    CONFIRMED: milestones.filter(m => m.status === "CONFIRMED").length,
    RELEASED: milestones.filter(m => m.status === "RELEASED").length,
    REJECTED: milestones.filter(m => m.status === "REJECTED").length
  };

  const formatCurrency = (minor: string): string => {
    const amount = parseInt(minor, 10);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount / 100);
  };

  const totalAmount = milestones.reduce(
    (sum, m) => sum + parseInt(m.amountMinor, 10),
    0
  );
  const releasedAmount = milestones
    .filter(m => m.status === "RELEASED")
    .reduce((sum, m) => sum + parseInt(m.amountMinor, 10), 0);

  return (
    <div className="milestone-list">
      <div className="milestone-progress-header">
        <h2>Payment Milestones</h2>
        <div className="milestone-progress-stats">
          <div className="progress-amount">
            <span className="released">{formatCurrency(releasedAmount.toString())}</span>
            <span className="separator">/</span>
            <span className="total">{formatCurrency(totalAmount.toString())}</span>
            <span className="label">released</span>
          </div>
        </div>
      </div>

      <div
        className="milestone-progress-bar"
        role="progressbar"
        aria-label="Milestone release progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={releasedPercentage}
      >
        <div
          className="progress-fill"
          style={{ width: `${releasedPercentage}%` }}
        />
      </div>

      <div className="milestone-status-summary">
        <span className="status-item status-pending">
          {statusCounts.PENDING} Pending
        </span>
        <span className="status-item status-submitted">
          {statusCounts.SUBMITTED} Awaiting Review
        </span>
        <span className="status-item status-confirmed">
          {statusCounts.CONFIRMED} Ready
        </span>
        <span className="status-item status-released">
          {statusCounts.RELEASED} Released
        </span>
        {statusCounts.REJECTED > 0 && (
          <span className="status-item status-rejected">
            {statusCounts.REJECTED} Needs Attention
          </span>
        )}
      </div>

      <div className="milestones-container">
        {milestones.map(milestone => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            ticketId={ticketId}
            userRole={userRole}
            onStatusChange={onMilestoneUpdate}
          />
        ))}
      </div>

      {milestones.length === 0 && (
        <div className="no-milestones">
          <p>No milestones have been defined for this trade ticket.</p>
        </div>
      )}
    </div>
  );
}