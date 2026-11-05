import { useState } from "react";
import { WorkspaceHeader, WorkspaceNavigation } from "./TradeTicketsPage";

const signOutNotice =
  "There is no signed-in account in this preview. Use the GreenWallet logo to return home.";
const profileNotice =
  "Profile management is not connected in this preview. No account details are available.";
const previewNotice =
  "This action is not connected in this preview. Nothing was downloaded, shared, or submitted.";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <path
        d="M12 4v10m0 0 4-4m-4 4-4-4M5 16.5v1.75A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
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
  );
}

type Participant = {
  role: string;
  name: string;
};

const participants: Participant[] = [
  { role: "Buyer", name: "ABC Commodities Ltd." },
  { role: "Seller", name: "Jos Agro Producers" },
];

const tradeFacts = [
  { label: "Commodity", value: "Maize" },
  { label: "Quantity", value: "500 Kg" },
  { label: "Unit price", value: "₦25,000" },
  { label: "Delivery date", value: "20th November 2026" },
];

export function TradeTicketDetailsPage() {
  const [notice, setNotice] = useState("");

  return (
    <div className="workspace-page trade-ticket-details-page">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <WorkspaceHeader onSignOut={() => setNotice(signOutNotice)} />
      <div className="workspace-layout">
        <WorkspaceNavigation onProfile={() => setNotice(profileNotice)} />
        <main className="workspace-main ticket-details-main" id="workspace-main">
          <section
            className="ticket-details-intro"
            aria-labelledby="ticket-details-title"
          >
            <p className="workspace-eyebrow">Trade tickets / Ticket details</p>
            <h1 id="ticket-details-title">Trade Ticket Details</h1>
            <p className="ticket-details-description">
              Enter the terms agreed by the trade parties.
              <br />
              New records start as drafts
            </p>
            <p className="ticket-details-meta">
              GW-2026-00124 · Created 05 Nov 2026
            </p>
          </section>

          <article className="ticket-details-card" aria-label="Trade ticket details">
            <div className="ticket-details-actions">
              <button
                className="ticket-details-action"
                type="button"
                onClick={() => setNotice(previewNotice)}
              >
                <DownloadIcon />
                <span>Download PDF</span>
              </button>
              <button
                className="ticket-details-action"
                type="button"
                onClick={() => setNotice(previewNotice)}
              >
                <ShareIcon />
                <span>Share ticket</span>
              </button>
            </div>

            <div className="ticket-details-content">
              <section
                className="ticket-details-section ticket-details-overview"
                aria-labelledby="trade-overview-title"
              >
                <h2 id="trade-overview-title">Trade Overview</h2>
                <p className="ticket-details-label">Total trade value</p>
                <p className="ticket-details-amount">₦225,000,000</p>
                <dl className="ticket-details-facts">
                  {tradeFacts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section
                className="ticket-details-section"
                aria-labelledby="participants-title"
              >
                <h2 id="participants-title">Participants</h2>
                <div className="ticket-details-participants">
                  {participants.map((participant) => (
                    <div
                      className="ticket-details-participant"
                      key={participant.role}
                    >
                      <div>
                        <p className="ticket-details-role">{participant.role}</p>
                        <p className="ticket-details-name">{participant.name}</p>
                      </div>
                      <span className="ticket-details-verified">Verified</span>
                    </div>
                  ))}
                </div>
              </section>

              <section
                className="ticket-details-section"
                aria-labelledby="payment-milestones-title"
              >
                <h2 id="payment-milestones-title">Payment Milestones</h2>
                <div className="ticket-details-progress-heading">
                  <span>Released</span>
                  <span>₦67,000</span>
                </div>
                <div
                  className="ticket-details-progress"
                  role="progressbar"
                  aria-label="Payment milestone progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={40}
                >
                  <span />
                </div>
              </section>

              <button
                className="ticket-details-payment-action"
                type="button"
                onClick={() => setNotice(previewNotice)}
              >
                View payment progress
              </button>
            </div>
          </article>

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
