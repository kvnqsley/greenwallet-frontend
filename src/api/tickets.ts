// greenwallet-frontend/src/api/tickets.ts
import { API_BASE_URL, authStorage, refreshApi } from "./auth";

export interface OrganizationSummary {
  id: string;
  name: string;
  verification?: string;
  roles?: string[];
  type?: string;
  regNumber?: string | null;
  country?: string;
}

export interface TicketParty {
  id: string;
  organizationId: string;
  role: "BUYER" | "SUPPLIER" | "EXPORTER";
  status: "INVITED" | "ACCEPTED" | "DECLINED";
  invitedEmail?: string | null;
  respondedAt?: string | null;
  organization?: OrganizationSummary;
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
}

export interface Ticket {
  id: string;
  reference: string;
  title?: string | null;
  status:
    | "DRAFT"
    | "AWAITING_ACCEPTANCE"
    | "ACTIVE"
    | "FUNDED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "DISPUTED";
  version: number;
  commodity: string;
  grade?: string | null;
  quantity: string;
  unit: string;
  unitPriceMinor: string;
  totalMinor: string;
  currency: string;
  deliveryTerms?: string | null;
  deliveryLocation?: string | null;
  deliveryFrom?: string | null;
  deliveryTo?: string | null;
  terms?: string | null;
  buyerOrgId: string;
  supplierOrgId: string;
  exporterOrgId?: string | null;
  buyer?: OrganizationSummary;
  supplier?: OrganizationSummary;
  exporter?: OrganizationSummary;
  parties: TicketParty[];
  milestones: Milestone[];
  acceptedAt?: string | null;
  fundedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTicketRequest {
  title?: string | null;
  buyerOrgId: string;
  supplierOrgId: string;
  exporterOrgId?: string | null;
  commodity: string;
  grade?: string | null;
  quantity: string;
  unit: string;
  unitPriceMinor: string;
  expectedTotalMinor: string;
  currency?: string;
  deliveryTerms?: string | null;
  deliveryLocation?: string | null;
  deliveryFrom?: string | null;
  deliveryTo?: string | null;
  terms?: string | null;
}

export interface TicketListResponse {
  tickets: Ticket[];
  nextCursor: string | null;
}

export interface TicketCharge {
  id: string;
  ticketId: string;
  organizationId: string;
  provider: "MOCK" | "PAYSTACK" | "NOMBA";
  reference: string;
  amountMinor: string;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED" | "REVERSED";
  authorizationUrl: string | null;
  accessCode: string | null;
  customerEmail: string;
  channel: string | null;
  providerTransactionId: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPaymentResponse {
  ticket: Ticket;
  charge: TicketCharge | null;
  blockedReason: string | null;
}

export interface UserMembershipOrg {
  id: string;
  role: string;
  organization: {
    id: string;
    name: string;
    type: string;
    roles: Array<"BUYER" | "SUPPLIER" | "EXPORTER">;
    verification: string;
  };
}

export interface UserMeResponse {
  user: {
    id: string;
    email: string;
    phone: string | null;
    name: string;
    platformRole: string;
    emailVerifiedAt?: string | null;
    createdAt?: string;
  };
  memberships: UserMembershipOrg[];
}

export interface UpdateMeRequest {
  name?: string;
  phone?: string;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = authStorage.getAccessToken();

  if (!token) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshed = await refreshApi(refreshToken);
        authStorage.saveSession({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          user: refreshed.user,
        });
        token = refreshed.accessToken;
      } catch {
        // Refresh failed
      }
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshed = await refreshApi(refreshToken);
        authStorage.saveSession({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          user: refreshed.user,
        });
        headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
        response = await fetch(url, { ...options, headers });
      } catch {
        authStorage.clearSession();
      }
    }
  }

  return response;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMsg =
      data?.detail ||
      data?.message ||
      (data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).flat().join(", ")
        : null) ||
      `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export async function getMeApi(): Promise<UserMeResponse> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/me`);
  return handleResponse<UserMeResponse>(res);
}

export async function updateMeApi(
  payload: UpdateMeRequest
): Promise<{ user: UserMeResponse["user"] }> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ user: UserMeResponse["user"] }>(res);
}

export async function searchOrganizationsApi(query: string): Promise<OrganizationSummary[]> {
  const searchParams = new URLSearchParams({ q: query, limit: "10" });
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/organizations/search?${searchParams.toString()}`
  );
  const data = await handleResponse<{ organizations: OrganizationSummary[] }>(res);
  return data.organizations;
}

export async function listTicketsApi(params?: {
  status?: string;
  organizationId?: string;
  commodity?: string;
  cursor?: string;
  limit?: number;
}): Promise<TicketListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.organizationId) searchParams.set("organizationId", params.organizationId);
  if (params?.commodity) searchParams.set("commodity", params.commodity);
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const url = `${API_BASE_URL}/api/v1/tickets${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
  const res = await authenticatedFetch(url);
  return handleResponse<TicketListResponse>(res);
}

export async function getTicketApi(ticketId: string): Promise<Ticket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}`);
  const data = await handleResponse<{ ticket: Ticket }>(res);
  return data.ticket;
}

export async function createTicketApi(
  payload: CreateTicketRequest
): Promise<Ticket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ ticket: Ticket }>(res);
  return data.ticket;
}

export async function submitTicketApi(ticketId: string): Promise<Ticket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}/submit`, {
    method: "POST",
  });
  const data = await handleResponse<{ ticket: Ticket }>(res);
  return data.ticket;
}

export async function acceptTicketApi(
  ticketId: string,
  organizationId?: string
): Promise<Ticket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId }),
  });
  const data = await handleResponse<{ ticket: Ticket }>(res);
  return data.ticket;
}

export async function declineTicketApi(
  ticketId: string,
  organizationId?: string
): Promise<Ticket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}/decline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId }),
  });
  const data = await handleResponse<{ ticket: Ticket }>(res);
  return data.ticket;
}

export async function cancelTicketApi(ticketId: string): Promise<Ticket> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}/cancel`, {
    method: "POST",
  });
  const data = await handleResponse<{ ticket: Ticket }>(res);
  return data.ticket;
}

export async function getTicketPaymentApi(
  ticketId: string
): Promise<TicketPaymentResponse> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/payment`
  );
  return handleResponse<TicketPaymentResponse>(res);
}

export async function verifyTicketPaymentApi(
  ticketId: string
): Promise<TicketPaymentResponse> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/payment/verify`,
    { method: "POST" }
  );
  return handleResponse<TicketPaymentResponse>(res);
}

export async function startTicketPaymentApi(
  ticketId: string
): Promise<TicketPaymentResponse> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/fund`,
    { method: "POST" }
  );
  return handleResponse<TicketPaymentResponse>(res);
}

export async function createMilestoneApi(
  ticketId: string,
  milestone: {
    title: string;
    description?: string | null;
    releaseBp: number;
    dueDate?: string | null;
  }
): Promise<Milestone> {
  const res = await authenticatedFetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(milestone),
  });
  const data = await handleResponse<{ milestone: Milestone }>(res);
  return data.milestone;
}

export async function submitMilestoneApi(
  ticketId: string,
  milestoneId: string
): Promise<Milestone> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/milestones/${milestoneId}/submit`,
    { method: "POST" }
  );
  const data = await handleResponse<{ milestone: Milestone }>(res);
  return data.milestone;
}

export async function confirmMilestoneApi(
  ticketId: string,
  milestoneId: string
): Promise<Milestone> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/milestones/${milestoneId}/confirm`,
    { method: "POST" }
  );
  const data = await handleResponse<{ milestone: Milestone }>(res);
  return data.milestone;
}

export async function rejectMilestoneApi(
  ticketId: string,
  milestoneId: string,
  rejectionNote: string
): Promise<Milestone> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/milestones/${milestoneId}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionNote }),
    }
  );
  const data = await handleResponse<{ milestone: Milestone }>(res);
  return data.milestone;
}

export async function releaseMilestoneFundsApi(
  ticketId: string,
  milestoneId: string
): Promise<Milestone> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/milestones/${milestoneId}/release`,
    { method: "POST" }
  );
  const data = await handleResponse<{ milestone: Milestone }>(res);
  return data.milestone;
}

export interface EvidenceFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
  createdAt: string;
}

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + chunkSize)
    );
  }
  return btoa(binary);
}

export async function uploadMilestoneEvidenceApi(
  ticketId: string,
  milestoneId: string,
  file: File
): Promise<EvidenceFile> {
  const dataBase64 = await fileToBase64(file);

  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/milestones/${milestoneId}/evidence`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64,
      }),
    }
  );

  const data = await handleResponse<{
    document: {
      id: string;
      originalName: string | null;
      mimeType: string;
      sizeBytes: number;
      createdAt: string;
    };
  }>(res);

  return {
    id: data.document.id,
    name: data.document.originalName ?? file.name,
    mimeType: data.document.mimeType,
    sizeBytes: data.document.sizeBytes,
    createdAt: data.document.createdAt,
  };
}

export async function listMilestoneEvidenceApi(
  ticketId: string,
  milestoneId: string
): Promise<EvidenceFile[]> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/milestones/${milestoneId}/evidence`
  );
  const data = await handleResponse<{
    documents: Array<{
      id: string;
      originalName: string | null;
      mimeType: string;
      sizeBytes: number;
      createdAt: string;
    }>;
  }>(res);
  return data.documents.map((document) => ({
    id: document.id,
    name: document.originalName ?? "Evidence file",
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt,
  }));
}

export async function downloadDocumentApi(
  documentId: string
): Promise<{ url: string; expiresAt: string }> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/documents/${documentId}/download`
  );
  return handleResponse<{ url: string; expiresAt: string }>(res);
}

export interface TicketPdfDownload {
  document: {
    id: string;
    kind: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
  download: {
    url: string;
    expiresAt: string;
  };
  snapshotHash: string;
}

export async function downloadTicketPdfApi(
  ticketId: string
): Promise<TicketPdfDownload> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/pdf`
  );
  return handleResponse<TicketPdfDownload>(res);
}

export interface TicketShareLink {
  shareLink: {
    id: string;
    ticketId: string;
    expiresAt: string;
    revokedAt: string | null;
    createdAt: string;
    active: boolean;
  };
  token: string;
  url: string;
}

export async function createTicketShareLinkApi(
  ticketId: string
): Promise<TicketShareLink> {
  const res = await authenticatedFetch(
    `${API_BASE_URL}/api/v1/tickets/${ticketId}/share-links`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }
  );
  return handleResponse<TicketShareLink>(res);
}
