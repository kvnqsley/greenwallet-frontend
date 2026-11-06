import { useState, useEffect } from "react";
import {
  listTicketsApi,
  type Ticket,
  type UserMeResponse,
  getMeApi,
} from "./api/tickets";
import { authStorage } from "./api/auth";

export function WorkspaceHeader({
  onSignOut,
}: {
  onSignOut: () => void;
}) {
  return (
    <header className="workspace-header">
      <a className="workspace-brand" href="/" aria-label="GreenWallet home">
        <img
          src="/assets/imgframe1618870115.svg"
          width="36"
          height="36"
          alt=""
        />
        <span>GreenWallet</span>
      </a>
      <button className="workspace-sign-out" type="button" onClick={onSignOut}>
        Sign out
      </button>
    </header>
  );
}

export function WorkspaceNavigation({
  onProfile,
}: {
  onProfile: () => void;
}) {
  return (
    <nav className="workspace-sidebar" aria-label="Workspace navigation">
      <a
        className="workspace-nav-link is-current"
        href="/trade-tickets"
        aria-current="page"
      >
        <img src="/assets/icon-confirmation-number.svg" alt="" />
        <span>Trade tickets</span>
      </a>
      <button
        className="workspace-nav-link"
        type="button"
        onClick={onProfile}
      >
        <img src="/assets/icon-person.svg" alt="" />
        <span>Profile</span>
      </button>
    </nav>
  );
}

export function formatStatusBadge(status: Ticket["status"]) {
  switch (status) {
    case "DRAFT":
      return <span className="ticket-badge ticket-badge-draft">Draft</span>;
    case "AWAITING_ACCEPTANCE":
      return <span className="ticket-badge ticket-badge-awaiting">Awaiting Acceptance</span>;
    case "ACTIVE":
      return <span className="ticket-badge ticket-badge-active">Active</span>;
    case "FUNDED":
      return <span className="ticket-badge ticket-badge-funded">Funded</span>;
    case "IN_PROGRESS":
      return <span className="ticket-badge ticket-badge-in_progress">In Progress</span>;
    case "COMPLETED":
      return <span className="ticket-badge ticket-badge-completed">Completed</span>;
    case "CANCELLED":
      return <span className="ticket-badge ticket-badge-cancelled">Cancelled</span>;
    case "DISPUTED":
      return <span className="ticket-badge ticket-badge-disputed">Disputed</span>;
    default:
      return <span className="ticket-badge">{status}</span>;
  }
}

export function TradeTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCommodity, setSearchCommodity] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [me, setMe] = useState<UserMeResponse | null>(null);

  useEffect(() => {
    // Fetch current user and org context
    getMeApi()
      .then((data) => setMe(data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  async function fetchTickets() {
    setLoading(true);
    setError(null);
    try {
      const response = await listTicketsApi({
        commodity: searchCommodity.trim() || undefined,
        status: statusFilter || undefined,
      });
      setTickets(response.tickets);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load trade tickets.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchTickets();
  }

  function openTicket(id: string) {
    window.location.href = `/trade-tickets/details?ticketId=${encodeURIComponent(id)}`;
  }

  function handleSignOut() {
    authStorage.clearSession();
    window.location.href = "/sign-in";
  }

  return (
    <div className="workspace-page">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <WorkspaceHeader onSignOut={handleSignOut} />
      <div className="workspace-layout">
        <WorkspaceNavigation
          onProfile={() =>
            alert(
              me?.user
                ? `Signed in as: ${me.user.name} (${me.user.email})\nOrganization: ${me.memberships[0]?.organization?.name || "None"
                }`
                : "No active profile found."
            )
          }
        />
        <main className="workspace-main" id="workspace-main">
          <section className="workspace-intro" aria-labelledby="workspace-title">
            <p className="workspace-eyebrow">Agricultural trade Nigeria</p>
            <h1 id="workspace-title">Your trade, clearly recorded</h1>
            <p className="workspace-description">
              Bring the people, terms, milestones, and instructions for a trade into one shared record.
            </p>
            <a className="workspace-primary-action" href="/record-trade">
              + New Trade Ticket
            </a>
          </section>

          <form className="ticket-list-controls" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="ticket-search-input"
              placeholder="Search by commodity name (e.g. Maize, Cocoa)..."
              value={searchCommodity}
              onChange={(e) => setSearchCommodity(e.target.value)}
            />
            <select
              className="ticket-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="AWAITING_ACCEPTANCE">Awaiting Acceptance</option>
              <option value="ACTIVE">Active</option>
              <option value="FUNDED">Funded</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
            </select>
            <button className="ticket-view-btn" type="submit" style={{ height: "44px" }}>
              Search
            </button>
          </form>

          {error && (
            <div style={{ marginTop: "20px", color: "#dc2626", fontSize: "14px" }}>
              {error}
            </div>)}
          <section className="workspace-cards" aria-label="Workspace information">
            <article className="workspace-info-card">
              <h2>Trade tickets</h2>
              <p>Create a record or reopen a ticket shared with you</p>
              {/* <a className="workspace-card-action" href="/trade-tickets/details">
                View shared ticket
              </a> */}
            </article>
            <article className="workspace-info-card">
              <h2>Identity verification is required</h2>
              <p>
                Individual and business accounts verify with different details
                before opening a trade ticket.
              </p>
            </article>
          </section>

          <p className="workspace-preview-note">
            Tickets you create or are invited to appear here. Open a ticket to
            review its terms, accept or reject it, or fund an accepted trade.
          </p>

          <div className="ticket-table-container">
            {loading ? (
              <div className="ticket-empty-state">Loading trade tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="ticket-empty-state">
                No trade tickets found.
              </div>
            ) : (
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Ticket / Commodity</th>
                    <th>Buyer</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.reference}</td>
                      <td>
                        {t.title ? (
                          <>
                            <div style={{ fontWeight: 500 }}>{t.title}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {t.commodity} {t.grade ? `(${t.grade})` : ""}
                            </div>
                          </>
                        ) : (
                          <>
                            {t.commodity} {t.grade ? `(${t.grade})` : ""}
                          </>
                        )}
                      </td>
                      <td>{t.buyer?.name || t.buyerOrgId.slice(0, 8)}</td>
                      <td>{t.supplier?.name || t.supplierOrgId.slice(0, 8)}</td>
                      <td>
                        {t.quantity} {t.unit}
                      </td>
                      <td>{formatStatusBadge(t.status)}</td>
                      <td>
                        <button
                          className="ticket-view-btn"
                          type="button"
                          onClick={() => openTicket(t.id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
