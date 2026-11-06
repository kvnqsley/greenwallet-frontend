// Milestone Approval Modal Component
// Allows buyers to review evidence and approve/reject milestone completion

import { useState } from "react";
import { confirmMilestoneApi, rejectMilestoneApi } from "../api/tickets";

interface Evidence {
  id: string;
  name: string;
  type: string;
  url?: string;
  createdAt: string;
}

interface MilestoneApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  milestone: {
    id: string;
    title: string;
    description: string | null;
    amountMinor: string;
    sequence: number;
    status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED" | "RELEASED" | "CANCELLED";
    submittedAt?: string | null;
    submittedById?: string | null;
    rejectionNote?: string | null;
    evidence: Evidence[];
  };
  onApprove: (milestoneId: string) => Promise<void>;
  onReject: (milestoneId: string, note: string) => Promise<void>;
}

export function MilestoneApprovalModal({
  isOpen,
  onClose,
  ticketId,
  milestone,
  onApprove,
  onReject
}: MilestoneApprovalModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await confirmMilestoneApi(ticketId, milestone.id);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to approve milestone. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectNote.length < 3 || rejectNote.length > 1000) {
      setError("Rejection note must be between 3 and 1000 characters");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await rejectMilestoneApi(ticketId, milestone.id, rejectNote);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to reject milestone. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (minor: string): string => {
    const amount = parseInt(minor, 10);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount / 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content milestone-approval-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="milestone-approval-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 id="milestone-approval-title">Review Milestone: {milestone.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" role="status">
              {action === "approve"
                ? "Milestone approved! Funds will be released."
                : "Milestone rejected. Supplier has been notified."}
            </div>
          )}

          {!success && (
            <>
              <div className="milestone-info">
                <div className="milestone-detail">
                  <span className="label">Amount</span>
                  <span className="value">{formatCurrency(milestone.amountMinor)}</span>
                </div>
                <div className="milestone-detail">
                  <span className="label">Status</span>
                  <span className={`status-badge status-${milestone.status.toLowerCase()}`}>
                    {milestone.status}
                  </span>
                </div>
                {milestone.submittedAt && (
                  <div className="milestone-detail">
                    <span className="label">Submitted</span>
                    <span className="value">
                      {new Date(milestone.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {milestone.description && (
                <div className="milestone-description">
                  <h3>Description</h3>
                  <p>{milestone.description}</p>
                </div>
              )}

              <div className="evidence-review">
                <h3>Evidence Documents ({milestone.evidence.length})</h3>
                {milestone.evidence.length === 0 ? (
                  <p className="no-evidence">No evidence documents submitted</p>
                ) : (
                  <ul className="evidence-list">
                    {milestone.evidence.map(doc => (
                      <li key={doc.id} className="evidence-item">
                        <span className="evidence-icon">
                          {doc.type.startsWith("image/") ? "🖼️" : "📄"}
                        </span>
                        <span className="evidence-name">{doc.name}</span>
                        <span className="evidence-date">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {action === null && (
                <div className="approval-actions">
                  <button
                    type="button"
                    onClick={() => setAction("approve")}
                    className="btn btn-success"
                  >
                    Approve & Release Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("reject")}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </div>
              )}

              {action === "reject" && (
                <div className="reject-form">
                  <h3>Reject Milestone</h3>
                  <label htmlFor="reject-note">
                    Please provide a reason for rejection (required):
                  </label>
                  <textarea
                    id="reject-note"
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Explain what evidence is missing or what needs to be corrected..."
                    rows={4}
                    minLength={3}
                    maxLength={1000}
                  />
                  <div className="reject-form-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setAction(null);
                        setRejectNote("");
                      }}
                      className="btn btn-secondary"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      className="btn btn-danger"
                      disabled={submitting || rejectNote.length < 3}
                    >
                      {submitting ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}

              {action === "approve" && (
                <div className="approve-confirmation">
                  <h3>Confirm Approval</h3>
                  <p>
                    By approving this milestone, <strong>{formatCurrency(milestone.amountMinor)}</strong>
                    will be released from escrow to the supplier.
                  </p>
                  <p className="confirmation-note">
                    This action cannot be undone.
                  </p>
                  <div className="approve-form-actions">
                    <button
                      type="button"
                      onClick={() => setAction(null)}
                      className="btn btn-secondary"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      className="btn btn-success"
                      disabled={submitting}
                    >
                      {submitting ? "Approving..." : "Confirm Approval"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}