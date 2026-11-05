import { useState, type ReactNode } from "react";
import { WorkspaceHeader, WorkspaceNavigation } from "./TradeTicketsPage";

type TicketDecision = "accepted" | "rejected";

function WorkspaceFrame({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState("");

  return (
    <div className="workspace-page">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <WorkspaceHeader
        onSignOut={() =>
          setNotice(
            "There is no signed-in account in this preview. Use the GreenWallet logo to return home.",
          )
        }
      />
      <div className="workspace-layout">
        <WorkspaceNavigation
          onProfile={() =>
            setNotice(
              "Profile management is not connected in this preview. No account details are available.",
            )
          }
        />
        <main className="workspace-main ticket-flow-main" id="workspace-main">
          {children}
          {notice && (
            <p className="workspace-notice" role="status" aria-live="polite">
              {notice}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

function TicketSummary() {
  return (
    <dl className="ticket-summary">
      <div>
        <dt>Ticket name</dt>
        <dd>Maize supply to Lagos</dd>
      </div>
      <div>
        <dt>Your role</dt>
        <dd>Buyer</dd>
      </div>
      <div>
        <dt>Counterparty role</dt>
        <dd>Seller</dd>
      </div>
      <div>
        <dt>Commodity</dt>
        <dd>Maize</dd>
      </div>
      <div>
        <dt>Quantity</dt>
        <dd>25 tonnes</dd>
      </div>
      <div>
        <dt>Delivery location</dt>
        <dd>Lagos</dd>
      </div>
    </dl>
  );
}

export function ReviewTradeTicketPage() {
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
        <p className="ticket-preview-label">Example ticket · Preview only</p>
        <h2>Maize supply to Lagos</h2>
        <TicketSummary />
        <p className="ticket-flow-disclaimer">
          This sample ticket is for preview only. No participant has shared it
          with you.
        </p>
      </section>
      <div className="ticket-decision-actions">
        <a className="ticket-reject-action" href="/trade-tickets/rejected">
          Reject trade
        </a>
        <a className="ticket-accept-action" href="/trade-tickets/accepted">
          Accept trade
        </a>
      </div>
      <p className="ticket-flow-disclaimer">
        Accepting or rejecting is not connected to a trade service and will not
        update a ticket or notify participants.
      </p>
    </WorkspaceFrame>
  );
}

export function TradeDecisionResultPage({
  decision,
}: {
  decision: TicketDecision;
}) {
  const accepted = decision === "accepted";

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
        <p className="workspace-eyebrow">Trade ticket preview</p>
        <h1 id="ticket-result-title">
          {accepted ? "Trade ticket accepted" : "Trade ticket rejected"}
        </h1>
        <p className="workspace-description">
          {accepted
            ? "You accepted the example trade ticket."
            : "You rejected the example trade ticket."}
        </p>
        <p className="ticket-flow-disclaimer">
          This is a preview result only. No ticket was changed and no
          participants were notified.
        </p>
        <a className="ticket-accept-action" href="/trade-tickets">
          View trade tickets
        </a>
      </section>
    </WorkspaceFrame>
  );
}
