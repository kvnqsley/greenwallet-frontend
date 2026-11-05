import { useState } from "react";

type WorkspaceNotice = "profile" | "sign-out" | null;

const noticeCopy: Record<Exclude<WorkspaceNotice, null>, string> = {
  profile:
    "Profile management is not connected in this preview. No account details are available.",
  "sign-out":
    "There is no signed-in account in this preview. Use the GreenWallet logo to return to the home page.",
};

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

export function TradeTicketsPage() {
  const [notice, setNotice] = useState<WorkspaceNotice>(null);

  return (
    <div className="workspace-page">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <WorkspaceHeader onSignOut={() => setNotice("sign-out")} />
      <div className="workspace-layout">
        <WorkspaceNavigation onProfile={() => setNotice("profile")} />
        <main className="workspace-main" id="workspace-main">
          <section className="workspace-intro" aria-labelledby="workspace-title">
            <p className="workspace-eyebrow">Agricultural trade Nigeria</p>
            <h1 id="workspace-title">Your trade, clearly recorded</h1>
            <p className="workspace-description">
              Welcome to GreenWallet. Bring the people, terms, milestones, and
              instructions for a trade into one shared record.
            </p>
            <a
              className="workspace-primary-action"
              href="/record-trade"
            >
              Open trade tickets
            </a>
          </section>

          <section className="workspace-cards" aria-label="Workspace information">
            <article className="workspace-info-card">
              <h2>Trade tickets</h2>
              <p>Create a record or reopen a ticket shared with you</p>
            </article>
            <article className="workspace-info-card">
              <h2>Account access is not identity verification</h2>
              <p>
                No GreenWallet participant identity-verification process is
                connected to this workspace.
              </p>
            </article>
          </section>

          <p className="workspace-preview-note">
            Preview only. Sign-in, profile management, identity verification,
            and trade ticket services are not connected. Nothing is submitted
            or saved.
          </p>
          {notice && (
            <p className="workspace-notice" role="status" aria-live="polite">
              {noticeCopy[notice]}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
