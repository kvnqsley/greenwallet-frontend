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
  sequence: number;
  title: string;
  description: string | null;
  releaseBp: number;
  dueDate: string | null;
  status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "REJECTED" | "RELEASED" | "CANCELLED";
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
  };
  memberships: UserMembershipOrg[];
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
