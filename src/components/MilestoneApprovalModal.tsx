// Milestone Approval Modal Component
// Allows buyers to review evidence and approve/reject milestone completion

import { useState } from "react";
import {
  confirmMilestoneApi,
  downloadDocumentApi,
  rejectMilestoneApi,
} from "../api/tickets";

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
}: MilestoneApprovalModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const evidence = milestone.evidence ?? [];

  const handleViewDocument = async (documentId: string) => {
    try {
      const result = await downloadDocumentApi(documentId);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open this document."
      );
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await confirmMilestoneApi(ticketId, milestone.id);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
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
      }, 1500);
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
        className="modal-content"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="milestone-approval-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 id="milestone-approval-title">Review Milestone</h2>
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
            <p className="modal-error" role="alert">{error}</p>
          )}

          {success && (
            <p className="modal-success" role="status">
              {action === "approve"
                ? "Milestone approved. Funds will be released."
                : "Milestone rejected. Supplier has been notified."}
            </p>
          )}

          {!success && (
            <>
              <div className="modal-info-row">
                <span className="modal-label">Milestone</span>
                <span className="modal-value">{milestone.title}</span>
              </div>
              <div className="modal-info-row">
                <span className="modal-label">Amount</span>
                <span className="modal-value">{formatCurrency(milestone.amountMinor)}</span>
              </div>

              {evidence.length > 0 && (
                <div className="modal-section">
                  <span className="modal-label">Evidence</span>
                  <ul className="evidence-file-list">
                    {evidence.map(doc => (
                      <li key={doc.id} className="evidence-file-item">
                        <span>{doc.name}</span>
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => void handleViewDocument(doc.id)}
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {action === null && (
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setAction("approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAction("reject")}
                  >
                    Reject
                  </button>
                </div>
              )}

              {action === "reject" && (
                <div className="modal-section">
                  <label htmlFor="reject-note" className="modal-label">
                    Reason for rejection
                  </label>
                  <textarea
                    id="reject-note"
                    className="modal-textarea"
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Explain what needs to be corrected..."
                    rows={3}
                  />
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setAction(null);
                        setRejectNote("");
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleReject}
                      disabled={submitting || rejectNote.length < 3}
                    >
                      {submitting ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}

              {action === "approve" && (
                <div className="modal-section">
                  <p className="modal-confirm-text">
                    Confirm that the evidence meets requirements and approve this milestone for fund release.
                  </p>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setAction(null)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleApprove}
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