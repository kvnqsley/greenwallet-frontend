import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { WorkspaceHeader, WorkspaceNavigation } from "./TradeTicketsPage";
import {
  createTicketApi,
  createMilestoneApi,
  searchOrganizationsApi,
  getMeApi,
  type OrganizationSummary,
  type UserMeResponse,
} from "./api/tickets";
import { authStorage } from "./api/auth";

type Milestone = {
  id: number;
  title: string;
  targetDate: string;
  details: string;
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

export function RecordTradePage() {
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 0, title: "", targetDate: "", details: "" },
  ]);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User and organization state
  const [me, setMe] = useState<UserMeResponse | null>(null);

  // Trade parties state
  const [ticketName, setTicketName] = useState("");
  const [counterpartySearch, setCounterpartySearch] = useState("");
  const [searchResults, setSearchResults] = useState<OrganizationSummary[]>([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState<OrganizationSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form inputs
  const [commodity, setCommodity] = useState("");
  const [quantity, setQuantity] = useState("");
  const [weightUnit, setWeightUnit] = useState("tonnes");
  const [currency, setCurrency] = useState("NGN");
  const [totalValue, setTotalValue] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    getMeApi()
      .then((data) => {
        setMe(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Search counterparties with debounce
  useEffect(() => {
    if (!counterpartySearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchOrganizationsApi(counterpartySearch);
        // Exclude current user's organization from counterparty choices
        const currentOrgId = me?.memberships[0]?.organization?.id;
        setSearchResults(results.filter((o) => o.id !== currentOrgId));
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [counterpartySearch, me]);

  function addMilestone() {
    setMilestones((current) => [
      ...current,
      {
        id: Math.max(-1, ...current.map(({ id }) => id)) + 1,
        title: "",
        targetDate: "",
        details: "",
      },
    ]);
  }

  function removeMilestone(id: number) {
    setMilestones((current) =>
      current.filter((milestone) => milestone.id !== id),
    );
  }

  function updateMilestone(id: number, field: keyof Milestone, value: string) {
    setMilestones((current) =>
      current.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    const myOrgId = me?.memberships[0]?.organization?.id;
    if (!myOrgId) {
      setNotice("You must belong to an organization to record a trade. Please ensure your account has an organization setup.");
      return;
    }

    if (!selectedCounterparty) {
      setNotice("Please search and select a counterparty organization.");
      return;
    }

    if (!commodity.trim()) {
      setNotice("Please specify the commodity name.");
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setNotice("Please enter a valid positive quantity.");
      return;
    }

    const totalNum = parseFloat(totalValue);
    if (isNaN(totalNum) || totalNum <= 0) {
      setNotice("Please enter a valid total trade value.");
      return;
    }

    setSubmitting(true);

    try {
      // Backend expects unitPriceMinor as a string representation of minor units (e.g. kobo/cents)
      const unitPrice = totalNum / qtyNum;
      const unitPriceMinor = Math.round(unitPrice * 100).toString();

      // Creator is unconditionally the BUYER; Counterparty is unconditionally the SUPPLIER
      const buyerOrgId = myOrgId;
      const supplierOrgId = selectedCounterparty.id;

      const created = await createTicketApi({
        title: ticketName.trim() || null,
        buyerOrgId,
        supplierOrgId,
        commodity: commodity.trim(),
        quantity: quantity.toString(),
        unit: weightUnit,
        unitPriceMinor,
        currency,
        deliveryLocation: deliveryLocation.trim() || null,
        terms: terms.trim() || null,
      });

      // If milestones were defined with titles, add them to the ticket
      const validMilestones = milestones.filter((m) => m.title.trim().length > 0);
      if (validMilestones.length > 0) {
        const bpPerMilestone = Math.floor(10000 / validMilestones.length);
        for (let i = 0; i < validMilestones.length; i++) {
          const m = validMilestones[i];
          const releaseBp =
            i === validMilestones.length - 1
              ? 10000 - bpPerMilestone * (validMilestones.length - 1)
              : bpPerMilestone;

          await createMilestoneApi(created.id, {
            title: m.title.trim(),
            description: m.details.trim() || null,
            dueDate: m.targetDate || null,
            releaseBp,
          });
        }
      }

      setNotice(`Trade ticket ${created.reference} created successfully! Redirecting...`);
      setTimeout(() => {
        window.location.href = "/trade-tickets";
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setNotice(err.message);
      } else {
        setNotice("Failed to save trade ticket.");
      }
    } finally {
      setSubmitting(false);
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
                ? `Signed in as: ${me.user.name} (${me.user.email})\nOrganization: ${
                    me.memberships[0]?.organization?.name || "None"
                  }`
                : "No profile loaded."
            )
          }
        />
        <main className="workspace-main record-trade-main" id="workspace-main">
          <section className="record-trade-intro" aria-labelledby="record-trade-title">
            <p className="workspace-eyebrow">Trade record Nigeria</p>
            <h1 id="record-trade-title">Record a trade</h1>
            <p className="workspace-description">
              Enter the terms agreed by the trade parties. New records start as drafts.
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
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                  />
                </RecordTradeField>
              </div>

              <div className="record-trade-counterparty">
                <RecordTradeField
                  label="Counterparty account"
                  hint="Type 1 or more letters to search registered accounts"
                >
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      name="counterparty"
                      autoComplete="off"
                      maxLength={254}
                      placeholder="Search by name"
                      value={counterpartySearch}
                      onChange={(e) => {
                        setCounterpartySearch(e.target.value);
                        if (selectedCounterparty && e.target.value !== selectedCounterparty.name) {
                          setSelectedCounterparty(null);
                        }
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowDropdown(true);
                      }}
                    />
                    {isSearching && (
                      <span style={{ fontSize: "12px", color: "#666", marginTop: "4px", display: "block" }}>
                        Searching...
                      </span>
                    )}

                    {showDropdown && searchResults.length > 0 && (
                      <ul className="autocomplete-dropdown">
                        {searchResults.map((org) => (
                          <li
                            key={org.id}
                            className="autocomplete-item"
                            onClick={() => {
                              setSelectedCounterparty(org);
                              setCounterpartySearch(org.name);
                              setShowDropdown(false);
                            }}
                          >
                            <strong>{org.name}</strong>
                            <span>Type: {org.type || "BUSINESS"} | Country: {org.country || "NG"}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selectedCounterparty && (
                    <div className="selected-counterparty-badge">
                      <span>
                        Selected: <strong>{selectedCounterparty.name}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCounterparty(null);
                          setCounterpartySearch("");
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
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
                    required
                    maxLength={120}
                    placeholder="E.g. Maize"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                  />
                </RecordTradeField>
                <RecordTradeField label="Quantity">
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="E.g. 25"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </RecordTradeField>
                <RecordTradeField label="Weight">
                  <select
                    name="weightUnit"
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                  >
                    <option value="tonnes">tonnes</option>
                    <option value="kg">kg</option>
                  </select>
                </RecordTradeField>
              </div>

              <div className="record-trade-value-grid">
                <div className="record-trade-value-field">
                  <span className="record-trade-field-label">Agreed total value</span>
                  <div className="record-trade-money-fields">
                    <label className="visually-hidden" htmlFor="trade-currency">
                      Currency
                    </label>
                    <select
                      id="trade-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </select>
                    <label className="visually-hidden" htmlFor="trade-total-value">
                      Total value
                    </label>
                    <input
                      id="trade-total-value"
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="E.g. 1200000"
                      value={totalValue}
                      onChange={(e) => setTotalValue(e.target.value)}
                    />
                  </div>
                </div>
                <RecordTradeField label="Delivery location">
                  <input
                    type="text"
                    maxLength={160}
                    placeholder="E.g. Lagos"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                  />
                </RecordTradeField>
              </div>

              <RecordTradeField label="Terms and specifications">
                <textarea
                  className="record-trade-terms-textarea"
                  maxLength={2000}
                  placeholder="Record grade, packaging, delivery, terms, inspection arrangements, and other details agreed for this transaction"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
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
                  <div className="record-trade-milestone" key={milestone.id}>
                    <div className="record-trade-milestone-fields">
                      <RecordTradeField label={`Step ${index + 1}`}>
                        <input
                          type="text"
                          maxLength={120}
                          placeholder="E.g. Quality inspection"
                          value={milestone.title}
                          onChange={(e) =>
                            updateMilestone(milestone.id, "title", e.target.value)
                          }
                        />
                      </RecordTradeField>
                      <RecordTradeField label={`Target date for step ${index + 1}`}>
                        <input
                          type="date"
                          value={milestone.targetDate}
                          onChange={(e) =>
                            updateMilestone(milestone.id, "targetDate", e.target.value)
                          }
                        />
                      </RecordTradeField>
                    </div>
                    <RecordTradeField label={`Details for step ${index + 1} (optional)`}>
                      <textarea
                        maxLength={1000}
                        placeholder="Details the parties agreed on"
                        value={milestone.details}
                        onChange={(e) =>
                          updateMilestone(milestone.id, "details", e.target.value)
                        }
                      />
                    </RecordTradeField>
                    {milestones.length > 1 && (
                      <button
                        className="record-trade-remove-milestone"
                        type="button"
                        onClick={() => removeMilestone(milestone.id)}
                      >
                        Remove step {index + 1}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </RecordTradeSection>

            <p className="record-trade-preview-note">
              Records are saved directly to your GreenWallet workspace.
            </p>
            {notice && (
              <p
                className="record-trade-notice"
                role="status"
                aria-live="polite"
                style={{
                  color: notice.includes("successfully") ? "var(--green)" : "#dc2626",
                  fontWeight: 500,
                }}
              >
                {notice}
              </p>
            )}

            <div className="record-trade-actions">
              <a className="record-trade-cancel" href="/trade-tickets">
                Cancel
              </a>
              <button
                className="record-trade-save"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save draft"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
