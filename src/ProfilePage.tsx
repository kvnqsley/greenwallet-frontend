import { useEffect, useState, type FormEvent } from "react";
import { WorkspaceHeader, WorkspaceNavigation } from "./TradeTicketsPage";
import {
  getMeApi,
  updateMeApi,
  type UserMeResponse,
} from "./api/tickets";
import { authStorage } from "./api/auth";

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function roleLabel(role: string) {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "MEMBER":
      return "Member";
    case "BUYER":
      return "Buyer";
    case "SUPPLIER":
      return "Seller";
    case "EXPORTER":
      return "Exporter";
    default:
      return role;
  }
}

function verificationLabel(status: string) {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "PENDING":
      return "Pending review";
    case "REJECTED":
      return "Rejected";
    case "NOT_STARTED":
      return "Not started";
    default:
      return status;
  }
}

function verificationTone(status: string) {
  switch (status) {
    case "VERIFIED":
      return " is-verified";
    case "PENDING":
      return " is-pending";
    case "REJECTED":
      return " is-rejected";
    default:
      return "";
  }
}

export function ProfilePage() {
  const [me, setMe] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!authStorage.getAccessToken() && !authStorage.getRefreshToken()) {
      window.location.replace("/sign-in");
      return;
    }

    getMeApi()
      .then((data) => {
        if (!active) return;
        setMe(data);
        setName(data.user.name);
        setPhone(data.user.phone ?? "");
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your profile."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleSignOut() {
    authStorage.clearSession();
    window.location.href = "/sign-in";
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setNotice(null);

    if (!name.trim()) {
      setSaveError("Enter your name.");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && (trimmedPhone.length < 3 || trimmedPhone.length > 30)) {
      setSaveError("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateMeApi({
        name: name.trim(),
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      });
      setMe((current) =>
        current
          ? { ...current, user: { ...current.user, ...result.user } }
          : current
      );
      setNotice("Profile updated.");
    } catch (updateError) {
      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="workspace-page profile-page">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <WorkspaceHeader onSignOut={handleSignOut} />
      <div className="workspace-layout">
        <WorkspaceNavigation current="profile" />
        <main className="workspace-main profile-main" id="workspace-main">
          <section className="workspace-intro" aria-labelledby="profile-title">
            <p className="workspace-eyebrow">Account settings</p>
            <h1 id="profile-title">Your profile</h1>
            <p className="workspace-description">
              Review your account details and the organizations connected to
              this workspace.
            </p>
          </section>

          {loading && <div className="ticket-empty-state">Loading profile...</div>}

          {!loading && error && (
            <p className="identity-error profile-error" role="alert">
              {error}
            </p>
          )}

          {!loading && me && (
            <>
              <section
                className="profile-section"
                aria-labelledby="profile-account-title"
              >
                <div className="profile-section-header">
                  <h2 id="profile-account-title">Account details</h2>
                  <p>
                    Update how your name and phone number appear across
                    GreenWallet.
                  </p>
                </div>

                <form className="profile-form" onSubmit={handleSave} noValidate>
                  <div className="profile-field-grid">
                    <label className="record-trade-field">
                      <span>Full name</span>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        maxLength={120}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                      />
                    </label>
                    <label className="record-trade-field">
                      <span>Phone number</span>
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        maxLength={30}
                        placeholder="Add a phone number"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                    </label>
                    <label className="record-trade-field">
                      <span>Email address</span>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={me.user.email}
                        readOnly
                        disabled
                      />
                    </label>
                    <label className="record-trade-field">
                      <span>Platform role</span>
                      <input
                        type="text"
                        name="platformRole"
                        value={roleLabel(me.user.platformRole)}
                        readOnly
                        disabled
                      />
                    </label>
                  </div>

                  <dl className="profile-meta">
                    <div>
                      <dt>Email verification</dt>
                      <dd>
                        <span
                          className={`profile-badge${
                            me.user.emailVerifiedAt ? " is-verified" : " is-pending"
                          }`}
                        >
                          {me.user.emailVerifiedAt ? "Verified" : "Not verified"}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Member since</dt>
                      <dd>{formatDate(me.user.createdAt)}</dd>
                    </div>
                  </dl>

                  {saveError && (
                    <p className="identity-error" role="alert">
                      {saveError}
                    </p>
                  )}
                  {notice && (
                    <p className="workspace-notice" role="status">
                      {notice}
                    </p>
                  )}

                  <div className="profile-actions">
                    <button
                      className="identity-submit"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </section>

              <section
                className="profile-section"
                aria-labelledby="profile-organizations-title"
              >
                <div className="profile-section-header">
                  <h2 id="profile-organizations-title">Organizations</h2>
                  <p>Accounts you are a member of on GreenWallet.</p>
                </div>

                {me.memberships.length === 0 ? (
                  <p className="profile-empty">
                    No organization memberships found.
                  </p>
                ) : (
                  <div className="workspace-cards profile-org-grid">
                    {me.memberships.map((membership) => (
                      <article
                        className="workspace-info-card profile-org-card"
                        key={membership.id}
                      >
                        <div className="profile-org-heading">
                          <h3>{membership.organization.name}</h3>
                          <span
                            className={`profile-badge${verificationTone(
                              membership.organization.verification
                            )}`}
                          >
                            {verificationLabel(
                              membership.organization.verification
                            )}
                          </span>
                        </div>
                        <p className="profile-org-meta">
                          {membership.organization.type === "BUSINESS"
                            ? "Business account"
                            : "Individual account"}{" "}
                          · You are {roleLabel(membership.role)}
                        </p>
                        {membership.organization.roles.length > 0 && (
                          <ul
                            className="profile-role-list"
                            aria-label="Organization roles"
                          >
                            {membership.organization.roles.map((role) => (
                              <li key={role}>{roleLabel(role)}</li>
                            ))}
                          </ul>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
