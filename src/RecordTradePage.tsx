import { useState, type FormEvent, type ReactNode } from "react";
import { WorkspaceHeader, WorkspaceNavigation } from "./TradeTicketsPage";

type Milestone = {
  id: number;
};

function RecordTradeField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="record-trade-field">
      <span>{label}</span>
      {children}
      {hint && <span className="record-trade-field-hint">{hint}</span>}
    </label>
  );
}

function RecordTradeSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const sectionId = title.toLowerCase().replace(/ /g, "-");
  const headingId = `record-trade-${sectionId}-title`;
  const descriptionId = `record-trade-${sectionId}-description`;

  return (
    <section
      className="record-trade-section"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <div className="record-trade-section-header">
        <div className="record-trade-section-heading">
          <h2 id={headingId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        {action && <div className="record-trade-section-action">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function MilestoneFields({
  milestone,
  index,
  canRemove,
  onRemove,
}: {
  milestone: Milestone;
  index: number;
  canRemove: boolean;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="record-trade-milestone" key={milestone.id}>
      <div className="record-trade-milestone-fields">
        <RecordTradeField label={`Step ${index + 1}`}>
          <input
            type="text"
            name={`milestones[${milestone.id}].step`}
            maxLength={120}
            placeholder="E.g. Quality inspection"
          />
        </RecordTradeField>
        <RecordTradeField label={`Target date for step ${index + 1}`}>
          <input
            type="date"
            name={`milestones[${milestone.id}].targetDate`}
          />
        </RecordTradeField>
      </div>
      <RecordTradeField label={`Details for step ${index + 1} (optional)`}>
        <textarea
          name={`milestones[${milestone.id}].details`}
          maxLength={1000}
          placeholder="Details the parties agreed on"
        />
      </RecordTradeField>
      {canRemove && (
        <button
          className="record-trade-remove-milestone"
          type="button"
          onClick={() => onRemove(milestone.id)}
        >
          Remove step {index + 1}
        </button>
      )}
    </div>
  );
}

export function RecordTradePage() {
  const [milestones, setMilestones] = useState<Milestone[]>([{ id: 0 }]);
  const [notice, setNotice] = useState("");

  function addMilestone() {
    setMilestones((current) => [
      ...current,
      { id: Math.max(-1, ...current.map(({ id }) => id)) + 1 },
    ]);
    setNotice("");
  }

  function removeMilestone(id: number) {
    setMilestones((current) =>
      current.filter((milestone) => milestone.id !== id),
    );
    setNotice("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(
      "Draft preview only. Nothing has been saved or shared. Trade services are not connected.",
    );
  }

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
        <main
          className="workspace-main record-trade-main"
          id="workspace-main"
        >
          <section
            className="record-trade-intro"
            aria-labelledby="record-trade-title"
          >
            <p className="workspace-eyebrow">Trade record Nigeria</p>
            <h1 id="record-trade-title">Record a trade</h1>
            <p className="workspace-description">
              Enter the terms agreed by the trade parties. New records start as
              drafts.
            </p>
          </section>

          <form className="record-trade-form" onSubmit={handleSubmit}>
            <RecordTradeSection
              title="Trade Parties"
              description="Name the counterparty who can view this ticket."
            >
              <div className="record-trade-parties-grid">
                <RecordTradeField label="Ticket name">
                  <input
                    type="text"
                    name="ticketName"
                    autoComplete="off"
                    maxLength={160}
                    placeholder="E.g. Maize supply to Lagos"
                  />
                </RecordTradeField>
                <RecordTradeField label="Your role">
                  <select name="role" defaultValue="buyer">
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="supplier">Supplier</option>
                    <option value="exporter">Exporter</option>
                    <option value="aggregator">Aggregator</option>
                  </select>
                </RecordTradeField>
              </div>
              <div className="record-trade-counterparty">
                <RecordTradeField
                  label="Counterparty account"
                  hint="Account search is not connected in this preview."
                >
                  <input
                    type="text"
                    name="counterparty"
                    autoComplete="off"
                    maxLength={254}
                    placeholder="Search by name"
                  />
                </RecordTradeField>
              </div>
            </RecordTradeSection>

            <RecordTradeSection
              title="Agreed trade terms"
              description="Use the values and delivery details agreed by both parties."
            >
              <div className="record-trade-terms-grid">
                <RecordTradeField label="Commodity">
                  <input
                    type="text"
                    name="commodity"
                    maxLength={120}
                    placeholder="E.g. Maize"
                  />
                </RecordTradeField>
                <RecordTradeField label="Quantity">
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    step="any"
                    placeholder="E.g. 25"
                  />
                </RecordTradeField>
                <RecordTradeField label="Weight">
                  <select name="weightUnit" defaultValue="">
                    <option value="" disabled>
                      Select unit
                    </option>
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                  </select>
                </RecordTradeField>
              </div>

              <div className="record-trade-value-grid">
                <div className="record-trade-value-field">
                  <span className="record-trade-field-label">
                    Agreed total value
                  </span>
                  <div className="record-trade-money-fields">
                    <label className="visually-hidden" htmlFor="trade-currency">
                      Currency
                    </label>
                    <select
                      id="trade-currency"
                      name="currency"
                      defaultValue="NGN"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </select>
                    <label
                      className="visually-hidden"
                      htmlFor="trade-total-value"
                    >
                      Total value
                    </label>
                    <input
                      id="trade-total-value"
                      type="number"
                      name="totalValue"
                      min="0"
                      step="any"
                      placeholder="E.g. 1200000"
                    />
                  </div>
                </div>
                <RecordTradeField label="Delivery location">
                  <input
                    type="text"
                    name="deliveryLocation"
                    maxLength={160}
                    placeholder="E.g. Lagos"
                  />
                </RecordTradeField>
              </div>

              <RecordTradeField label="Terms and specifications">
                <textarea
                  className="record-trade-terms-textarea"
                  name="terms"
                  maxLength={2000}
                  placeholder="Record grade, packaging, delivery, terms, inspection arrangements, and other details agreed for this transaction"
                />
              </RecordTradeField>
            </RecordTradeSection>

            <RecordTradeSection
              title="Milestones"
              description="Keep delivery and transaction steps tied to this record."
              action={
                <button
                  className="record-trade-add-milestone"
                  type="button"
                  onClick={addMilestone}
                >
                  Add milestone
                </button>
              }
            >
              <div className="record-trade-milestones">
                {milestones.map((milestone, index) => (
                  <MilestoneFields
                    key={milestone.id}
                    milestone={milestone}
                    index={index}
                    canRemove={milestones.length > 1}
                    onRemove={removeMilestone}
                  />
                ))}
              </div>
            </RecordTradeSection>

            <p className="record-trade-preview-note">
              Preview only. This draft is not saved or shared with participants.
            </p>
            {notice && (
              <p className="record-trade-notice" role="status" aria-live="polite">
                {notice}
              </p>
            )}
            <div className="record-trade-actions">
              <a className="record-trade-cancel" href="/trade-tickets">
                Cancel
              </a>
              <button className="record-trade-save" type="submit">
                Save draft
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
