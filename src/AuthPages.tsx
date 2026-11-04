import { useState, type FormEvent, type ReactNode } from "react";

type AuthPageMode = "sign-in" | "sign-up";

const authCopy = {
  "sign-up": {
    logo: "auth-logo-signup.svg",
    eyebrow: "One account for a shared trade record",
    description:
      "Join the workspace to create tickets or view records where a participant has authorized your account",
    title: "Create an account",
    subtitle: "Create an account to access GreenWallet trade records",
    action: "Create account",
    alternate: "Already have an account?",
    alternateAction: "Sign in",
    alternateHref: "/sign-in",
  },
  "sign-in": {
    logo: "auth-logo-signin.svg",
    eyebrow: "Bring the trade into focus",
    description:
      "Open shared agricultural transaction records with the account named on each ticket",
    title: "Welcome back",
    subtitle: "Sign in to your participant account",
    action: "Sign in",
    alternate: "Don’t have an account?",
    alternateAction: "Create one",
    alternateHref: "/sign-up",
  },
} as const;

function AuthHeader({ mode }: { mode: AuthPageMode }) {
  const isSignUp = mode === "sign-up";

  return (
    <header className="auth-header">
      <a className="auth-brand" href="/" aria-label="GreenWallet home">
        <img src={`/assets/${authCopy[mode].logo}`} width="36" height="36" alt="" />
        <span>GreenWallet</span>
      </a>
      <nav className="auth-nav" aria-label="Account navigation">
        <a
          className={`auth-nav-link${isSignUp ? "" : " is-active"}`}
          href="/sign-in"
          aria-current={isSignUp ? undefined : "page"}
        >
          Sign in
        </a>
        <a
          className={`auth-nav-link${isSignUp ? " is-active" : ""}`}
          href="/sign-up"
          aria-current={isSignUp ? "page" : undefined}
        >
          Sign up
        </a>
      </nav>
    </header>
  );
}

function AuthenticationForm({ mode }: { mode: AuthPageMode }) {
  const copy = authCopy[mode];
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(
      "Authentication isn’t connected in this preview. Your information was not sent or stored.",
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "sign-up" && (
        <label className="auth-field">
          <span>Name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            maxLength={100}
            required
          />
        </label>
      )}
      <label className="auth-field">
        <span>Email address</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>
      <label className="auth-field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autoComplete={
            mode === "sign-up" ? "new-password" : "current-password"
          }
          minLength={mode === "sign-up" ? 8 : undefined}
          maxLength={128}
          required
        />
        {mode === "sign-up" && (
          <span className="auth-field-hint">
            Use at least 8 characters.
          </span>
        )}
      </label>
      <button className="auth-submit" type="submit">
        {copy.action}
      </button>
      {notice && (
        <p className="auth-notice" role="status" aria-live="polite">
          {notice}
        </p>
      )}
      {mode === "sign-up" && (
        <a className="auth-preview-link" href="/verify-email">
          Preview email verification
        </a>
      )}
    </form>
  );
}

function AuthenticationPage({ mode }: { mode: AuthPageMode }) {
  const copy = authCopy[mode];

  return (
    <main className="auth-page" data-auth-page={mode}>
      <AuthHeader mode={mode} />
      <div className={`auth-layout auth-layout-${mode}`}>
        <section className="auth-introduction" aria-labelledby="auth-headline">
          <h1 id="auth-headline">{copy.eyebrow}</h1>
          <p>{copy.description}</p>
          <a className="auth-back-link" href="/">
            Back to GreenWallet
          </a>
        </section>
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-heading">
            <h2 id="auth-title">{copy.title}</h2>
            <p>{copy.subtitle}</p>
          </div>
          <AuthenticationForm mode={mode} />
          <p className="auth-alternate">
            {copy.alternate}{" "}
            <a href={copy.alternateHref}>{copy.alternateAction}</a>
          </p>
        </section>
      </div>
    </main>
  );
}

function VerificationHeader() {
  return (
    <header className="verification-header">
      <a href="/" className="verification-brand" aria-label="GreenWallet home">
        <img
          src="/assets/auth-logo-verification.svg"
          width="36"
          height="36"
          alt=""
        />
        <span>GreenWallet</span>
      </a>
      <a className="verification-sign-in" href="/sign-in">
        Back to sign in
      </a>
    </header>
  );
}

function EmailVerificationPage() {
  const [notice, setNotice] = useState("");

  function handleResend() {
    setNotice(
      "Email verification isn’t connected in this preview. No email was sent.",
    );
  }

  return (
    <main className="verification-page">
      <VerificationHeader />
      <div className="verification-content">
        <section className="verification-profile" aria-label="Account details">
          <div className="verification-avatar" aria-hidden="true">
            G
          </div>
          <h1>Your GreenWallet account</h1>
          <p>Email address from your account</p>
        </section>
        <section className="verification-card" aria-labelledby="verify-title">
          <h2 id="verify-title">Verify your email</h2>
          <p>
            Confirm your account email using a verification link. If you haven’t
            received an email, request one below.
          </p>
          <button
            className="verification-resend"
            type="button"
            onClick={handleResend}
          >
            Resend verification link
          </button>
          {notice && (
            <p className="verification-notice" role="status" aria-live="polite">
              {notice}
            </p>
          )}
          <a className="verification-return" href="/sign-up">
            Return to create an account
          </a>
        </section>
      </div>
    </main>
  );
}

export function AuthPage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  let page: ReactNode;

  switch (path) {
    case "/sign-in":
    case "/signin":
      page = <AuthenticationPage mode="sign-in" />;
      break;
    case "/sign-up":
    case "/signup":
      page = <AuthenticationPage mode="sign-up" />;
      break;
    case "/verify-email":
      page = <EmailVerificationPage />;
      break;
    default:
      return null;
  }

  return page;
}

export function isAuthPath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return [
    "/sign-in",
    "/signin",
    "/sign-up",
    "/signup",
    "/verify-email",
  ].includes(path);
}
