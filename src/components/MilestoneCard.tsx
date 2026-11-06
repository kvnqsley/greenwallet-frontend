// Milestone Card Component
// Displays a single milestone with status, progress, and action buttons

import { useState } from "react";
import { MilestoneEvidenceUpload } from "./MilestoneEvidenceUpload";
import { MilestoneApprovalModal } from "./MilestoneApprovalModal";
import type { Milestone as ApiMilestone } from "../api/tickets";

interface MilestoneCardProps {
  milestone: ApiMilestone & {
    evidence?: Array<{
      id: string;
      name: string;
      type: string;
      url?: string;
      createdAt: string;
    }>;
    rejectionNote?: string | null;
    submittedAt?: string | null;
    confirmedAt?: string | null;
    releasedAt?: string | null;
  };
  ticketId: string;
  userRole: "SUPPLIER" | "BUYER";
  onStatusChange?: () => void;
}

export function MilestoneCard({
  milestone,
  ticketId,
  userRole,
  onStatusChange
}: MilestoneCardProps) {
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const formatCurrency = (minor: string): string => {
    const amount = parseInt(minor, 10);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-NG");
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      PENDING: "Awaiting Evidence",
      SUBMITTED: "Under Review",
      CONFIRMED: "Ready for Release",
      REJECTED: "Needs Resubmission",
      RELEASED: "Completed",
      CANCELLED: "Cancelled"
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      PENDING: "status-pending",
      SUBMITTED: "status-submitted",
      CONFIRMED: "status-confirmed",
      REJECTED: "status-rejected",
      RELEASED: "status-released",
      CANCELLED: "status-cancelled"
    };
    return classes[status] || "";
  };

  const canUploadEvidence = userRole === "SUPPLIER" &&
    (milestone.status === "PENDING" || milestone.status === "REJECTED");

  const canSubmit = userRole === "SUPPLIER" &&
    milestone.status === "PENDING" &&
    (milestone.evidence && milestone.evidence.length > 0);

  const canApprove = userRole === "BUYER" && milestone.status === "SUBMITTED";

  const evidenceCount = milestone.evidence?.length || 0;

  const handleApprove = async (milestoneId: string) => {
    // In production, this would call the API
    console.log(`Approving milestone ${milestoneId}`);
    onStatusChange?.();
  };

  const handleReject = async (milestoneId: string, note: string) => {
    // In production, this would call the API
    console.log(`Rejecting milestone ${milestoneId} with note: ${note}`);
    onStatusChange?.();
  };

  return (
    <div className={`milestone-card ${getStatusClass(milestone.status)}`}>
      <div className="milestone-header">
        <div className="milestone-sequence">
          <span className="sequence-number">{milestone.sequence}</span>
        </div>
        <div className="milestone-title-area">
          <h3 className="milestone-title">{milestone.title}</h3>
          <span className={`status-badge ${getStatusClass(milestone.status)}`}>
            {getStatusLabel(milestone.status)}
          </span>
        </div>
        <div className="milestone-amount">
          {formatCurrency(milestone.amountMinor)}
        </div>
      </div>

      {milestone.description && (
        <p className="milestone-description">{milestone.description}</p>
      )}

      <div className="milestone-meta">
        <span className="meta-item">
          <span className="meta-label">Release:</span>
          <span className="meta-value">{(milestone.releaseBp / 100).toFixed(0)}%</span>
        </span>
        <span className="meta-item">
          <span className="meta-label">Due:</span>
          <span className="meta-value">{formatDate(milestone.dueDate)}</span>
        </span>
        {milestone.releasedAt && (
          <span className="meta-item">
            <span className="meta-label">Released:</span>
            <span className="meta-value">{formatDate(milestone.releasedAt)}</span>
          </span>
        )}
      </div>

      {milestone.status === "REJECTED" && milestone.rejectionNote && (
        <div className="rejection-notice">
          <strong>Rejection reason:</strong> {milestone.rejectionNote}
        </div>
      )}

      <div className="milestone-evidence">
        <div className="evidence-header">
          <span className="evidence-count">
            {evidenceCount} {evidenceCount === 1 ? "evidence file" : "evidence files"}
          </span>
        </div>
        {evidenceCount > 0 && (
          <ul className="evidence-preview">
            {milestone.evidence?.slice(0, 3).map((doc: { id: string; name: string; type: string }) => (
              <li key={doc.id} className="evidence-preview-item">
                <span className="evidence-icon">
                  {doc.type.startsWith("image/") ? "🖼️" : "📄"}
                </span>
                <span className="evidence-name">{doc.name}</span>
              </li>
            ))}
            {evidenceCount > 3 && (
              <li className="evidence-more">
                +{evidenceCount - 3} more
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="milestone-actions">
        {canUploadEvidence && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowEvidenceUpload(!showEvidenceUpload)}
          >
            {showEvidenceUpload ? "Hide Upload" : "Upload Evidence"}
          </button>
        )}

        {canApprove && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowApprovalModal(true)}
          >
            Review & Approve
          </button>
        )}

        {milestone.status === "RELEASED" && (
          <div className="completed-badge">
            ✓ Funds Released
          </div>
        )}
      </div>

      {showEvidenceUpload && canUploadEvidence && (
        <MilestoneEvidenceUpload
          ticketId={ticketId}
          milestoneId={milestone.id}
          milestoneTitle={milestone.title}
          onUploadComplete={() => {
            setShowEvidenceUpload(false);
            onStatusChange?.();
          }}
        />
      )}

      {showApprovalModal && canApprove && (
        <MilestoneApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          ticketId={ticketId}
          milestone={milestone as any}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}