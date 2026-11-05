import { useState, useEffect } from "react";
import {
  listTicketsApi,
  getTicketApi,
  submitTicketApi,
  acceptTicketApi,
  declineTicketApi,
  cancelTicketApi,
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

function formatStatusBadge(status: Ticket["status"]) {
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
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

  async function viewTicket(id: string) {
    setModalLoading(true);
    setActionNotice(null);
    try {
      const ticket = await getTicketApi(id);
      setSelectedTicket(ticket);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error fetching ticket details");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleSubmitTicket(ticketId: string) {
    setActionNotice(null);
    try {
      const updated = await submitTicketApi(ticketId);
      setSelectedTicket(updated);
      fetchTickets();
      setActionNotice("Ticket submitted for acceptance!");
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Failed to submit ticket");
    }
  }

  async function handleAcceptTicket(ticketId: string) {
    setActionNotice(null);
    try {
      const userOrgId = me?.memberships[0]?.organization?.id;
      const updated = await acceptTicketApi(ticketId, userOrgId);
      setSelectedTicket(updated);
      fetchTickets();
      setActionNotice("Ticket accepted successfully!");
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Failed to accept ticket");
    }
  }

  async function handleDeclineTicket(ticketId: string) {
    setActionNotice(null);
    try {
      const userOrgId = me?.memberships[0]?.organization?.id;
      const updated = await declineTicketApi(ticketId, userOrgId);
      setSelectedTicket(updated);
      fetchTickets();
      setActionNotice("Ticket declined.");
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Failed to decline ticket");
    }
  }

  async function handleCancelTicket(ticketId: string) {
    if (!confirm("Are you sure you want to cancel this ticket?")) return;
    setActionNotice(null);
    try {
      const updated = await cancelTicketApi(ticketId);
      setSelectedTicket(updated);
      fetchTickets();
      setActionNotice("Ticket cancelled.");
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Failed to cancel ticket");
    }
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
              <a className="workspace-card-action" href="/trade-tickets/review">
                Review shared ticket
              </a>
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
            Preview only. Sign-in, profile management, and trade ticket services
            are not connected. Identity checks use a dummy service; entered
            identity details are not sent or stored.
          </p>
          {/* {notice && (
            <p className="workspace-notice" role="status" aria-live="polite">
              {noticeCopy[notice]}
            </p>
          )} */}

          <div className="ticket-table-container">
            {loading ? (
              <div className="ticket-empty-state">Loading trade tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="ticket-empty-state">
                No trade tickets found matching your query.
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
                          onClick={() => viewTicket(t.id)}
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

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-modal-header">
              <div>
                <span className="workspace-eyebrow">Trade Ticket</span>
                <h2 style={{ margin: "4px 0 0", fontSize: "22px" }}>
                  {selectedTicket.reference} - {selectedTicket.title || selectedTicket.commodity}
                </h2>
              </div>
              <button
                className="ticket-modal-close"
                type="button"
                onClick={() => setSelectedTicket(null)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px", fontSize: "14px", lineHeight: "1.6" }}>
              <div>
                <strong>Status:</strong> {formatStatusBadge(selectedTicket.status)}
              </div>
              <div>
                <strong>Buyer:</strong> {selectedTicket.buyer?.name || selectedTicket.buyerOrgId}
              </div>
              <div>
                <strong>Supplier:</strong> {selectedTicket.supplier?.name || selectedTicket.supplierOrgId}
              </div>
              {selectedTicket.exporter && (
                <div>
                  <strong>Exporter:</strong> {selectedTicket.exporter.name}
                </div>
              )}
              <div>
                <strong>Quantity & Unit:</strong> {selectedTicket.quantity} {selectedTicket.unit}
              </div>
              <div>
                <strong>Unit Price:</strong> {(Number(selectedTicket.unitPriceMinor) / 100).toLocaleString()}{" "}
                {selectedTicket.currency}
              </div>
              <div>
                <strong>Total Value:</strong> {(Number(selectedTicket.totalMinor) / 100).toLocaleString()}{" "}
                {selectedTicket.currency}
              </div>
              {selectedTicket.deliveryLocation && (
                <div>
                  <strong>Delivery Location:</strong> {selectedTicket.deliveryLocation}
                </div>
              )}
              {selectedTicket.deliveryTerms && (
                <div>
                  <strong>Delivery Terms:</strong> {selectedTicket.deliveryTerms}
                </div>
              )}
              {selectedTicket.terms && (
                <div>
                  <strong>Terms:</strong>
                  <p style={{ margin: "4px 0 0", color: "#444", whiteSpace: "pre-wrap" }}>
                    {selectedTicket.terms}
                  </p>
                </div>
              )}

              {selectedTicket.milestones && selectedTicket.milestones.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <strong>Milestones:</strong>
                  <ul style={{ paddingLeft: "20px", margin: "6px 0 0" }}>
                    {selectedTicket.milestones.map((m) => (
                      <li key={m.id}>
                        {m.title} ({m.releaseBp / 100}%) - Status: {m.status}
                        {m.dueDate && ` | Due: ${new Date(m.dueDate).toLocaleDateString()}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {actionNotice && (
                <p style={{ color: "var(--green)", fontWeight: 500, margin: "10px 0 0" }}>
                  {actionNotice}
                </p>
              )}

              <div className="ticket-modal-actions">
                {selectedTicket.status === "DRAFT" && (
                  <button
                    className="ticket-action-btn btn-primary"
                    type="button"
                    onClick={() => handleSubmitTicket(selectedTicket.id)}
                  >
                    Submit for Counterparty Acceptance
                  </button>
                )}

                {selectedTicket.status === "AWAITING_ACCEPTANCE" && (
                  <>
                    <button
                      className="ticket-action-btn btn-primary"
                      type="button"
                      onClick={() => handleAcceptTicket(selectedTicket.id)}
                    >
                      Accept Ticket
                    </button>
                    <button
                      className="ticket-action-btn btn-outline"
                      type="button"
                      onClick={() => handleDeclineTicket(selectedTicket.id)}
                    >
                      Decline Ticket
                    </button>
                  </>
                )}

                {["DRAFT", "AWAITING_ACCEPTANCE"].includes(selectedTicket.status) && (
                  <button
                    className="ticket-action-btn btn-danger"
                    type="button"
                    onClick={() => handleCancelTicket(selectedTicket.id)}
                  >
                    Cancel Ticket
                  </button>
                )}

                <button
                  className="ticket-action-btn btn-outline"
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
