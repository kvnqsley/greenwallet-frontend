import { useState, type FormEvent } from "react";
import {
  getAccountType,
  setIdentityVerified,
  type AccountType,
} from "./identity";
import { verifyIdentity } from "./kycApi";
import { WorkspaceHeader, WorkspaceNavigation } from "./TradeTicketsPage";

const signOutNotice =
  "There is no signed-in account in this preview. Use the GreenWallet logo to return home.";
const profileNotice =
  "Profile management is not connected in this preview. No account details are available.";

function formatNin(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function onlyDigits(value: string, maximumLength: number) {
  return value.replace(/\D/g, "").slice(0, maximumLength);
}

export function IdentityVerificationPage({
  returnTo = "/trade-tickets",
}: {
  returnTo?: string;
}) {
  const [accountType] = useState<AccountType>(() => getAccountType());
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isIndividual = accountType === "individual";

  function validateForm() {
    if (isIndividual) {
      if (bvn.length !== 11) return "Enter an 11-digit BVN.";
      if (nin.replace(/\s/g, "").length !== 11) {
        return "Enter an 11-digit National Identification Number (NIN).";
      }
      return "";
    }

    if (!/^[A-Za-z0-9-]{6,20}$/.test(cacNumber.trim())) {
      return "Enter a valid CAC Certificate number.";
    }
    if (businessAddress.trim().length < 5) {
      return "Enter the business address.";
    }
    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyIdentity(
        isIndividual
          ? { accountType: "individual", bvn, nin: nin.replace(/\s/g, "") }
          : { accountType: "business", cacNumber, businessAddress },
      );

      if (!result.verified) {
        setError(result.message);
        return;
      }

      setIdentityVerified();
      window.location.assign(returnTo);
    } catch {
      setError(
        "Verification could not be completed. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="workspace-page identity-page">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <WorkspaceHeader onSignOut={() => setNotice(signOutNotice)} />
      <div className="workspace-layout">
        <WorkspaceNavigation onProfile={() => setNotice(profileNotice)} />
        <main className="workspace-main identity-main" id="workspace-main">
          <div className="identity-layout">
            <section
              className="identity-intro"
              aria-labelledby="identity-title"
            >
              <p className="workspace-eyebrow">Agricultural trade Nigeria</p>
              <h1 id="identity-title">Verify your Identity</h1>
              <p className="workspace-description">
                Verify your Identity to open a trade
              </p>
            </section>

            <section
              className="identity-card"
              aria-label="Identity verification form"
            >
              <form className="identity-form" onSubmit={handleSubmit} noValidate>
                {isIndividual ? (
                  <>
                    <label className="identity-field">
                      <span>BVN</span>
                      <input
                        type="text"
                        name="bvn"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={11}
                        placeholder="1234567890"
                        value={bvn}
                        onChange={(event) =>
                          setBvn(onlyDigits(event.target.value, 11))
                        }
                        required
                        aria-invalid={Boolean(error) || undefined}
                      />
                    </label>
                    <label className="identity-field">
                      <span>National Identification Number (NIN)</span>
                      <input
                        type="text"
                        name="nin"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={14}
                        placeholder="0000 0000 0000"
                        value={nin}
                        onChange={(event) =>
                          setNin(formatNin(event.target.value))
                        }
                        required
                        aria-invalid={Boolean(error) || undefined}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="identity-field">
                      <span>CAC Certificate number</span>
                      <input
                        type="text"
                        name="cacNumber"
                        autoComplete="off"
                        maxLength={20}
                        placeholder="1234567890"
                        value={cacNumber}
                        onChange={(event) => setCacNumber(event.target.value)}
                        required
                        aria-invalid={Boolean(error) || undefined}
                      />
                    </label>
                    <label className="identity-field">
                      <span>Business address</span>
                      <input
                        type="text"
                        name="businessAddress"
                        autoComplete="street-address"
                        maxLength={160}
                        placeholder="E.g Ibrahim taiwo street"
                        value={businessAddress}
                        onChange={(event) =>
                          setBusinessAddress(event.target.value)
                        }
                        required
                        aria-invalid={Boolean(error) || undefined}
                      />
                    </label>
                  </>
                )}

                {error && (
                  <p className="identity-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="identity-actions">
                  <button
                    className="identity-submit"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verifying…" : "Verify"}
                  </button>
                </div>
              </form>
            </section>
          </div>

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
