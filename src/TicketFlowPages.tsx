import { useEffect, useState, type ReactNode } from "react";
import {
  acceptTicketApi,
  cancelTicketApi,
  declineTicketApi,
  createTicketShareLinkApi,
  downloadTicketPdfApi,
  getMeApi,
  getTicketApi,
  getTicketPaymentApi,
  startTicketPaymentApi,
  submitTicketApi,
  verifyTicketPaymentApi,
  type Milestone,
  type Ticket,
  type TicketParty,
  type TicketPaymentResponse,
  type UserMeResponse,
} from "./api/tickets";
import { authStorage } from "./api/auth";
import {
  WorkspaceHeader,
  WorkspaceNavigation,
  formatStatusBadge,
} from "./TradeTicketsPage";
import { MilestoneList } from "./components/MilestoneList";

type TicketDecision = "accepted" | "rejected";

const PENDING_TICKET_KEY = "gw_pending_ticket_id";

function WorkspaceFrame({ children }: { children: ReactNode }) {
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
        <WorkspaceNavigation current="tickets" />
        <main className="workspace-main ticket-flow-main" id="workspace-main">
          {children}
        </main>
      </div>
    </div>
  );
}

function formatMoney(amountMinor: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(amountMinor) / 100);
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : null;
}

function roleLabel(role: TicketParty["role"]) {
  switch (role) {
    case "BUYER":
      return "Buyer";
    case "SUPPLIER":
      return "Seller";
    case "EXPORTER":
      return "Exporter";
  }
}

function findMembership(me: UserMeResponse | null, ticket: Ticket) {
  return (
    me?.memberships.find((membership) =>
      [ticket.buyerOrgId, ticket.supplierOrgId, ticket.exporterOrgId].includes(
        membership.organization.id
      )
    ) ?? null
  );
}

function TicketDetails({
  ticket,
  me,
}: {
  ticket: Ticket;
  me: UserMeResponse | null;
}) {
  const membership = findMembership(me, ticket);
  const party = membership
    ? ticket.parties.find(
      (candidate) =>
        candidate.organizationId === membership.organization.id
    )
    : null;
  const counterparty = ticket.parties.find(
    (candidate) =>
      candidate.role !== "EXPORTER" &&
      candidate.organizationId !== membership?.organization.id
  );

  return (
    <>
      <dl className="ticket-summary">
        <div>
          <dt>Ticket name</dt>
          <dd>{ticket.title || ticket.commodity}</dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd>{ticket.reference}</dd>
        </div>
        <div>
          <dt>Your role</dt>
          <dd>{party ? roleLabel(party.role) : "Participant"}</dd>
        </div>
        <div>
          <dt>Counterparty role</dt>
          <dd>{counterparty ? roleLabel(counterparty.role) : "—"}</dd>
        </div>
        <div>
          <dt>Commodity</dt>
          <dd>
            {ticket.commodity}
            {ticket.grade ? ` (${ticket.grade})` : ""}
          </dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>
            {ticket.quantity} {ticket.unit}
          </dd>
        </div>
        <div>
          <dt>Unit price</dt>
          <dd>{formatMoney(ticket.unitPriceMinor, ticket.currency)}</dd>
        </div>
        <div>
          <dt>Total value</dt>
          <dd>{formatMoney(ticket.totalMinor, ticket.currency)}</dd>
        </div>
        <div>
          <dt>Delivery location</dt>
          <dd>{ticket.deliveryLocation || "Not specified"}</dd>
        </div>
        <div>
          <dt>Delivery terms</dt>
          <dd>{ticket.deliveryTerms || "Not specified"}</dd>
        </div>
      </dl>

      <div className="ticket-detail-block">
        <h3>Parties</h3>
        <ul>
          {ticket.parties.map((item) => (
            <li key={item.id}>
              <span>
                {item.organization?.name || item.organizationId} ·{" "}
                {roleLabel(item.role)}
              </span>
              <span>{item.status.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      </div>

      {ticket.milestones.length > 0 && (
        <div className="ticket-detail-block">
          <h3>Milestones</h3>
          <ul>
            {ticket.milestones.map((milestone: Milestone) => (
              <li key={milestone.id}>
                <span>
                  {milestone.sequence}. {milestone.title} ·{" "}
                  {milestone.releaseBp / 100}%
                </span>
                <span>
                  {formatMoney(
                    String(
                      (Number(ticket.totalMinor) * milestone.releaseBp) / 10000
                    ),
                    ticket.currency
                  )}{" "}
                  · {milestone.status.toLowerCase()}
                  {milestone.dueDate
                    ? ` · due ${formatDate(milestone.dueDate)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ticket.terms && (
        <div className="ticket-detail-block">
          <h3>Terms</h3>
          <p className="ticket-detail-copy">{ticket.terms}</p>
        </div>
      )}
    </>
  );
}

function StatusNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <p
      className={`ticket-flow-disclaimer ticket-flow-notice${tone === "error" ? " is-error" : ""
        }`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

function LoadingState() {
  return <div className="ticket-empty-state">Loading trade ticket...</div>;
}

function MissingTicketState() {
  return (
    <section className="ticket-result-card" aria-labelledby="ticket-missing">
      <p className="workspace-eyebrow">Trade ticket</p>
      <h1 id="ticket-missing">No ticket selected</h1>
      <p className="workspace-description">
        Open a trade ticket from your workspace to review it here.
      </p>
      <a className="ticket-accept-action" href="/trade-tickets">
        View trade tickets
      </a>
    </section>
  );
}

export function ReviewTradeTicketPage({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [me, setMe] = useState<UserMeResponse | null>(null);
  const [payment, setPayment] = useState<TicketPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<
    "accept" | "decline" | "submit" | "cancel" | "fund" | "pdf" | "share" | null
  >(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!ticketId) {
        setLoading(false);
        return;
      }
      if (!authStorage.getAccessToken() && !authStorage.getRefreshToken()) {
        setError("Please sign in to review this trade ticket.");
        setLoading(false);
        return;
      }

      try {
        const [ticketData, meData] = await Promise.all([
          getTicketApi(ticketId),
          getMeApi(),
        ]);
        if (!active) return;
        setTicket(ticketData);
        setMe(meData);

        try {
          const paymentData = await getTicketPaymentApi(ticketId);
          if (active) setPayment(paymentData);
        } catch {
          // Payment details are optional until funding begins.
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load this trade ticket."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [ticketId]);

  if (!ticketId) {
    return (
      <WorkspaceFrame>
        <MissingTicketState />
      </WorkspaceFrame>
    );
  }

  if (loading) {
    return (
      <WorkspaceFrame>
        <LoadingState />
      </WorkspaceFrame>
    );
  }

  if (error || !ticket) {
    return (
      <WorkspaceFrame>
        <section className="ticket-result-card" aria-labelledby="ticket-error">
          <p className="workspace-eyebrow">Trade ticket</p>
          <h1 id="ticket-error">Unable to open ticket</h1>
          <p className="workspace-description">
            {error || "The trade ticket could not be found."}
          </p>
          <a className="ticket-accept-action" href="/trade-tickets">
            View trade tickets
          </a>
        </section>
      </WorkspaceFrame>
    );
  }

  const membership = findMembership(me, ticket);
  const organizationId = membership?.organization.id;
  const myParty = organizationId
    ? ticket.parties.find(
      (party) => party.organizationId === organizationId
    )
    : null;
  const isBuyer = organizationId === ticket.buyerOrgId;
  const isSupplier = organizationId === ticket.supplierOrgId;
  const canDecide =
    isSupplier &&
    ticket.status === "AWAITING_ACCEPTANCE" &&
    myParty?.status === "INVITED";
  const canSubmit = isBuyer && ticket.status === "DRAFT";
  const canFund =
    isBuyer &&
    ticket.status === "ACTIVE" &&
    authStorage.getAccessToken() !== null;

  async function rejectTrade() {
    if (!ticket || !organizationId) return;
    setBusy("decline");
    setActionError(null);
    try {
      await declineTicketApi(ticket.id, organizationId);
      window.location.href = `/trade-tickets/rejected?ticketId=${encodeURIComponent(
        ticket.id
      )}`;
    } catch (rejectError) {
      setActionError(
        rejectError instanceof Error
          ? rejectError.message
          : "Could not reject this trade ticket."
      );
      setBusy(null);
    }
  }

  async function acceptTrade() {
    if (!ticket || !organizationId) return;
    setBusy("accept");
    setActionError(null);
    try {
      await acceptTicketApi(ticket.id, organizationId);
      window.location.href = `/trade-tickets/accepted?ticketId=${encodeURIComponent(
        ticket.id
      )}`;
    } catch (acceptError) {
      setActionError(
        acceptError instanceof Error
          ? acceptError.message
          : "Could not accept this trade ticket."
      );
      setBusy(null);
    }
  }

  async function submitTrade() {
    if (!ticket) return;
    setBusy("submit");
    setActionError(null);
    try {
      const updated = await submitTicketApi(ticket.id);
      setTicket(updated);
      setBusy(null);
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit this trade ticket."
      );
      setBusy(null);
    }
  }

  async function cancelTrade() {
    if (!ticket) return;
    if (!confirm("Are you sure you want to cancel this ticket?")) return;
    setBusy("cancel");
    setActionError(null);
    try {
      const updated = await cancelTicketApi(ticket.id);
      setTicket(updated);
      setBusy(null);
    } catch (cancelError) {
      setActionError(
        cancelError instanceof Error
          ? cancelError.message
          : "Could not cancel this trade ticket."
      );
      setBusy(null);
    }
  }

  async function fundTrade() {
    if (!ticket) return;
    setBusy("fund");
    setActionError(null);
    try {
      const result = await startTicketPaymentApi(ticket.id);
      setTicket(result.ticket);
      setPayment(result);
      const authorizationUrl = result.charge?.authorizationUrl;
      if (authorizationUrl) {
        sessionStorage.setItem(PENDING_TICKET_KEY, ticket.id);
        window.location.href = authorizationUrl;
        return;
      }
      if (result.charge?.status === "SUCCESS") {
        window.location.href = `/trade-tickets/accepted?ticketId=${encodeURIComponent(
          ticket.id
        )}`;
        return;
      }
      setActionError(
        result.blockedReason ||
        result.charge?.failureReason ||
        "Funding could not be started yet."
      );
    } catch (fundError) {
      setActionError(
        fundError instanceof Error
          ? fundError.message
          : "Could not start funding for this trade ticket."
      );
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    if (!ticket) return;
    setBusy("pdf");
    setActionError(null);
    try {
      const result = await downloadTicketPdfApi(ticket.id);
      window.open(result.download.url, "_blank", "noopener,noreferrer");
    } catch (pdfError) {
      setActionError(
        pdfError instanceof Error
          ? pdfError.message
          : "Could not generate the PDF."
      );
    } finally {
      setBusy(null);
    }
  }

  async function shareTicket() {
    if (!ticket) return;
    setBusy("share");
    setActionError(null);
    setShareNotice(null);
    try {
      const result = await createTicketShareLinkApi(ticket.id);
      try {
        await navigator.clipboard.writeText(result.url);
        setShareNotice("Share link copied to clipboard.");
      } catch {
        setShareNotice(result.url);
      }
    } catch (shareError) {
      setActionError(
        shareError instanceof Error
          ? shareError.message
          : "Could not create a share link."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <WorkspaceFrame>
      <section
        className="ticket-flow-intro"
        aria-labelledby="ticket-review-title"
      >
        <p className="workspace-eyebrow">Shared trade ticket</p>
        <h1 id="ticket-review-title">Review trade ticket</h1>
        <p className="workspace-description">
          Review the agreed terms before accepting or rejecting this ticket.
        </p>
      </section>

      <section className="ticket-review-card" aria-label="Trade ticket details">
        <p className="ticket-preview-label">
          {ticket.reference} · {formatStatusBadge(ticket.status)}
        </p>
        <h2>{ticket.title || ticket.commodity}</h2>

        <div className="ticket-details-actions">
          <button
            className="ticket-details-action"
            type="button"
            onClick={() => void downloadPdf()}
            disabled={busy !== null}
          >
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
              <path
                d="M12 4v10m0 0 4-4m-4 4-4-4M5 16.5v1.75A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V16.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{busy === "pdf" ? "Preparing..." : "Download PDF"}</span>
          </button>
          <button
            className="ticket-details-action"
            type="button"
            onClick={() => void shareTicket()}
            disabled={busy !== null}
          >
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
              <path
                d="M9 7H6.75A1.75 1.75 0 0 0 5 8.75v9.5A1.75 1.75 0 0 0 6.75 20h9.5A1.75 1.75 0 0 0 18 18.25V16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 5h6v6M19 5l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{busy === "share" ? "Creating link..." : "Share ticket"}</span>
          </button>
        </div>

        <TicketDetails ticket={ticket} me={me} />

        {ticket.milestones && ticket.milestones.length > 0 && ticket.status === "FUNDED" && (
          <section className="milestone-management-section" aria-labelledby="milestones-title">
            <h2 id="milestones-title">Milestone Management</h2>
            <MilestoneList
              milestones={ticket.milestones}
              ticketId={ticket.id}
              ticketStatus={ticket.status}
              userRole={isBuyer ? "BUYER" : isSupplier ? "SUPPLIER" : undefined}
              onMilestoneUpdate={() => {
                // Refresh ticket data when milestone is updated
                getTicketApi(ticket.id).then(setTicket).catch(console.error);
              }}
            />
          </section>
        )}

        {actionError && <StatusNotice tone="error">{actionError}</StatusNotice>}
        {shareNotice && <StatusNotice>{shareNotice}</StatusNotice>}

        {ticket.status === "AWAITING_ACCEPTANCE" && (
          <StatusNotice>
            {canDecide
              ? "Accept or reject this ticket. The buyer will be notified by email."
              : myParty?.status === "ACCEPTED"
                ? "You have accepted this ticket. Waiting for the buyer to fund the trade."
                : "Waiting for the counterparty to respond."}
          </StatusNotice>
        )}
        {ticket.status === "ACTIVE" && (
          <StatusNotice>
            {isBuyer
              ? "This trade ticket is accepted. Fund the trade to move it forward."
              : "This trade ticket is accepted. The buyer has been notified and will fund the trade."}
          </StatusNotice>
        )}
        {ticket.status === "FUNDED" && (
          <StatusNotice>This trade is funded and ready to progress.</StatusNotice>
        )}
        {ticket.status === "DRAFT" && (
          <StatusNotice>
            This ticket is still a draft. Submit it to the counterparty when the
            terms are ready.
          </StatusNotice>
        )}
        {payment?.charge?.status === "PENDING" &&
          payment.charge.authorizationUrl &&
          isBuyer && (
            <StatusNotice>
              A payment is waiting to be completed for this ticket.
            </StatusNotice>
          )}
      </section>

      <div className="ticket-decision-actions">
        {canSubmit && (
          <button
            className="ticket-accept-action"
            type="button"
            onClick={() => void submitTrade()}
            disabled={busy !== null}
          >
            {busy === "submit" ? "Submitting..." : "Submit for acceptance"}
          </button>
        )}

        {(canDecide || (isBuyer && ["DRAFT", "AWAITING_ACCEPTANCE"].includes(ticket.status))) && (
          <button
            className="ticket-reject-action"
            type="button"
            onClick={() => {
              if (canDecide) {
                void rejectTrade();
              } else {
                void cancelTrade();
              }
            }}
            disabled={busy !== null}
          >
            {busy === "decline"
              ? "Rejecting..."
              : busy === "cancel"
                ? "Cancelling..."
                : canDecide
                  ? "Reject trade"
                  : "Cancel ticket"}
          </button>
        )}

        {canDecide && (
          <button
            className="ticket-accept-action"
            type="button"
            onClick={() => void acceptTrade()}
            disabled={busy !== null}
          >
            {busy === "accept" ? "Accepting..." : "Accept trade"}
          </button>
        )}

        {canFund && (
          <button
            className="ticket-accept-action"
            type="button"
            onClick={() => void fundTrade()}
            disabled={busy !== null}
          >
            {busy === "fund" ? "Starting payment..." : "Fund trade"}
          </button>
        )}
      </div>

      <p className="ticket-flow-disclaimer">
        Accepting or rejecting updates the trade ticket and notifies the buyer
        by email. Funding only begins when the buyer chooses to fund the trade.
      </p>
    </WorkspaceFrame>
  );
}

function ResultActions({
  ticketId,
  ticket,
  isBuyer,
  onFund,
  funding,
}: {
  ticketId: string;
  ticket: Ticket | null;
  isBuyer: boolean;
  onFund: () => void;
  funding: boolean;
}) {
  return (
    <div className="ticket-decision-actions ticket-result-actions">
      <a
        className="ticket-reject-action"
        href={`/trade-tickets/review?ticketId=${encodeURIComponent(ticketId)}`}
      >
        View ticket
      </a>
      {isBuyer && ticket?.status === "ACTIVE" && (
        <button
          className="ticket-accept-action"
          type="button"
          onClick={onFund}
          disabled={funding}
        >
          {funding ? "Starting payment..." : "Fund trade"}
        </button>
      )}
      <a className="ticket-accept-action" href="/trade-tickets">
        View trade tickets
      </a>
    </div>
  );
}

export function TradeDecisionResultPage({
  decision,
  ticketId,
}: {
  decision: TicketDecision;
  ticketId: string;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [me, setMe] = useState<UserMeResponse | null>(null);
  const [payment, setPayment] = useState<TicketPaymentResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(ticketId));
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!ticketId) {
        setLoading(false);
        return;
      }
      try {
        const [ticketData, meData] = await Promise.all([
          getTicketApi(ticketId),
          getMeApi(),
        ]);
        if (!active) return;
        setTicket(ticketData);
        setMe(meData);
        try {
          const paymentData = await getTicketPaymentApi(ticketId);
          if (active) setPayment(paymentData);
        } catch {
          // Payment details are optional.
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load this trade ticket."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [ticketId]);

  if (!ticketId) {
    return (
      <WorkspaceFrame>
        <MissingTicketState />
      </WorkspaceFrame>
    );
  }

  if (loading) {
    return (
      <WorkspaceFrame>
        <LoadingState />
      </WorkspaceFrame>
    );
  }

  if (error) {
    return (
      <WorkspaceFrame>
        <section className="ticket-result-card" aria-labelledby="result-error">
          <p className="workspace-eyebrow">Trade ticket</p>
          <h1 id="result-error">Unable to open ticket</h1>
          <p className="workspace-description">{error}</p>
          <a className="ticket-accept-action" href="/trade-tickets">
            View trade tickets
          </a>
        </section>
      </WorkspaceFrame>
    );
  }

  const membership = ticket ? findMembership(me, ticket) : null;
  const isBuyer = membership?.organization.id === ticket?.buyerOrgId;
  const accepted = decision === "accepted";
  const funded =
    ticket?.status === "FUNDED" || payment?.charge?.status === "SUCCESS";

  async function fundTrade() {
    if (!ticket) return;
    setFunding(true);
    setActionError(null);
    try {
      const result = await startTicketPaymentApi(ticket.id);
      setTicket(result.ticket);
      setPayment(result);
      const authorizationUrl = result.charge?.authorizationUrl;
      if (authorizationUrl) {
        sessionStorage.setItem(PENDING_TICKET_KEY, ticket.id);
        window.location.href = authorizationUrl;
        return;
      }
      if (result.charge?.status === "SUCCESS") {
        setTicket((current) =>
          current ? { ...current, status: "FUNDED" } : current
        );
        return;
      }
      setActionError(
        result.blockedReason ||
        result.charge?.failureReason ||
        "Funding could not be started yet."
      );
    } catch (fundError) {
      setActionError(
        fundError instanceof Error
          ? fundError.message
          : "Could not start funding for this trade ticket."
      );
    } finally {
      setFunding(false);
    }
  }

  let title = accepted ? "Trade ticket accepted" : "Trade ticket rejected";
  let description = accepted
    ? "The seller accepted this trade ticket. The buyer has been notified."
    : "The seller rejected this trade ticket. The buyer has been notified.";

  if (accepted && funded) {
    title = "Trade ticket funded";
    description = "This trade is funded and ready to progress.";
  } else if (accepted && ticket?.status === "AWAITING_ACCEPTANCE") {
    title = "Acceptance recorded";
    description = "Waiting for the counterparty to respond to this trade ticket.";
  } else if (accepted && ticket?.status === "ACTIVE" && !isBuyer) {
    description =
      "You accepted this trade ticket. The buyer has been notified and will fund the trade.";
  } else if (accepted && ticket?.status === "ACTIVE" && isBuyer) {
    description =
      "This trade ticket is accepted. Fund the trade when you are ready.";
  }

  return (
    <WorkspaceFrame>
      <section
        className="ticket-result-card"
        aria-labelledby="ticket-result-title"
      >
        <div
          className={`ticket-result-icon${accepted ? " is-accepted" : " is-rejected"}`}
          aria-hidden="true"
        >
          {accepted ? "✓" : "×"}
        </div>
        <p className="workspace-eyebrow">
          {ticket ? ticket.reference : "Trade ticket"}
        </p>
        <h1 id="ticket-result-title">{title}</h1>
        <p className="workspace-description">{description}</p>
        {actionError && <StatusNotice tone="error">{actionError}</StatusNotice>}
        <ResultActions
          ticketId={ticketId}
          ticket={ticket}
          isBuyer={Boolean(isBuyer)}
          onFund={() => void fundTrade()}
          funding={funding}
        />
      </section>
    </WorkspaceFrame>
  );
}

export function PaymentCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pendingTicketId = sessionStorage.getItem(PENDING_TICKET_KEY);
    if (!pendingTicketId) {
      setError("No pending payment was found for this callback.");
      return;
    }

    let active = true;
    verifyTicketPaymentApi(pendingTicketId)
      .then(() => {
        if (!active) return;
        sessionStorage.removeItem(PENDING_TICKET_KEY);
        window.location.replace(
          `/trade-tickets/accepted?ticketId=${encodeURIComponent(
            pendingTicketId
          )}`
        );
      })
      .catch((verifyError: unknown) => {
        if (!active) return;
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : "Could not verify this payment."
        );
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <WorkspaceFrame>
      <section className="ticket-result-card" aria-labelledby="callback-title">
        <p className="workspace-eyebrow">Payment</p>
        <h1 id="callback-title">
          {error ? "Payment verification failed" : "Verifying payment..."}
        </h1>
        {error ? (
          <>
            <p className="workspace-description">{error}</p>
            <a className="ticket-accept-action" href="/trade-tickets">
              View trade tickets
            </a>
          </>
        ) : (
          <p className="workspace-description">
            Please wait while we confirm your trade ticket funding.
          </p>
        )}
      </section>
    </WorkspaceFrame>
  );
}
