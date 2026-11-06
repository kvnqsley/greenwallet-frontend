// API Functions for Milestone Operations
import { API_BASE_URL, authStorage } from "./auth";

export interface MilestoneEvidence {
  id: string;
  ownerOrgId: string;
  uploadedById: string;
  ticketId: string;
  milestoneId: string;
  kind: string;
  publicId: string;
  resourceType: string;
  format: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  ticketId: string;
  sequence: number;
  title: string;
  description: string | null;
  releaseBp: number;
  amountMinor: string;
  dueDate: string | null;
  status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED" | "RELEASED" | "CANCELLED";
  submittedById?: string | null;
  submittedAt?: string | null;
  confirmedById?: string | null;
  confirmedAt?: string | null;
  releasedAt?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  evidence?: MilestoneEvidence[];
}

async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = authStorage.getAccessToken();
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
}

/**
 * Fetch all milestones for a ticket
 */
export async function getMilestones(ticketId: string): Promise<Milestone[]> {
  const response = await authenticatedFetch(
    `/api/v1/tickets/${ticketId}/milestones`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch milestones");
  }

  const data = await response.json();
  return data.milestones;
}

/**
 * Get evidence documents for a specific milestone
 */
export async function getMilestoneEvidence(
  ticketId: string,
  milestoneId: string
): Promise<MilestoneEvidence[]> {
  const response = await authenticatedFetch(
    `/api/v1/tickets/${ticketId}/milestones/${milestoneId}/evidence`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch evidence");
  }

  const data = await response.json();
  return data.documents;
}

/**
 * Submit a milestone for buyer review
 * Requires at least one evidence document to be uploaded first
 */
export async function submitMilestone(
  ticketId: string,
  milestoneId: string
): Promise<{ milestone: Milestone }> {
  const idempotencyKey = `${ticketId}-${milestoneId}-${Date.now()}`;

  const response = await fetch(
    `/api/v1/tickets/${ticketId}/milestones/${milestoneId}/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to submit milestone");
  }

  return response.json();
}

/**
 * Approve a submitted milestone (buyer action)
 * This releases the funds to the supplier
 */
export async function confirmMilestone(
  ticketId: string,
  milestoneId: string
): Promise<{ milestone: Milestone }> {
  const idempotencyKey = `${ticketId}-${milestoneId}-${Date.now()}`;

  const response = await fetch(
    `/api/v1/tickets/${ticketId}/milestones/${milestoneId}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to confirm milestone");
  }

  return response.json();
}

/**
 * Reject a submitted milestone (buyer action)
 * Requires a rejection note explaining the reason
 */
export async function rejectMilestone(
  ticketId: string,
  milestoneId: string,
  note: string
): Promise<{ milestone: Milestone }> {
  const idempotencyKey = `${ticketId}-${milestoneId}-${Date.now()}`;

  const response = await fetch(
    `/api/v1/tickets/${ticketId}/milestones/${milestoneId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({ note })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reject milestone");
  }

  return response.json();
}

/**
 * Release milestone funds (triggers fund transfer)
 */
export async function releaseMilestone(
  ticketId: string,
  milestoneId: string
): Promise<{
  ticket: any;
  milestone: Milestone;
  transaction: any;
}> {
  const idempotencyKey = `${ticketId}-${milestoneId}-${Date.now()}`;

  const response = await fetch(
    `/api/v1/tickets/${ticketId}/milestones/${milestoneId}/release`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to release milestone funds");
  }

  return response.json();
}

/**
 * Upload evidence document for a milestone
 * Returns a presigned URL for upload
 */
export async function getEvidenceUploadUrl(
  purpose: "EVIDENCE",
  kind: "EVIDENCE" | "CERTIFICATE" | "OTHER",
  milestoneId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{
  uploadUrl: string;
  publicId: string;
  fields: Record<string, string>;
}> {
  const response = await authenticatedFetch("/api/v1/uploads/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      purpose,
      kind,
      milestoneId,
      fileName,
      fileType,
      fileSize
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get upload URL");
  }

  return response.json();
}

/**
 * Register a document after successful upload
 */
export async function registerEvidenceDocument(
  purpose: "EVIDENCE",
  kind: "EVIDENCE" | "CERTIFICATE" | "OTHER",
  publicId: string,
  resourceType: string,
  originalName: string,
  milestoneId: string
): Promise<MilestoneEvidence> {
  const response = await authenticatedFetch("/api/v1/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      purpose,
      kind,
      publicId,
      resourceType,
      originalName,
      milestoneId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to register document");
  }

  return response.json();
}

/**
 * Get download URL for a document
 */
export async function getDocumentDownloadUrl(
  documentId: string
): Promise<{ document: MilestoneEvidence; url: string; expiresAt: string }> {
  const response = await authenticatedFetch(
    `/api/v1/documents/${documentId}/download`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get download URL");
  }

  return response.json();
}