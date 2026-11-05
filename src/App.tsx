import { useEffect, useRef, useState } from "react";
import { AuthPage, isAuthPath } from "./AuthPages";
import { RecordTradePage } from "./RecordTradePage";
import { TradeTicketsPage } from "./TradeTicketsPage";

const ASSETS = "/assets/";

const navigationLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#who-it-serves", label: "Who it serves" },
  { href: "#our-approach", label: "Our approach" },
] as const;

const benefits = [
  {
    number: "01",
    icon: "imgdatabase.svg",
    title: "One shared trade record",
    description:
      "Bring participants, agreed terms, milestones, and payment or redemption instructions into a single transaction record.",
  },
  {
    number: "02",
    icon: "imgcardsstack.svg",
    title: "Progress with context",
    description:
      "Keep milestone updates attached to the trade, so authorized partners can see what has happened and what comes next.",
  },
  {
    number: "03",
    icon: "imgreceipt.svg",
    title: "Clearer information for finance",
    description:
      "Give financial institutions a more structured view of a transaction as they consider financing and settlement through their arrangements.",
  },
] as const;

const audiences = [
  {
    number: "01",
    className: "art-exporters",
    image: "imgframe1.svg",
    width: 153,
    height: 212,
    name: "Exporters",
    description: "Structure the trade behind a shipment",
  },
  {
    number: "02",
    className: "art-buyers",
    image: "imgframe2.svg",
    width: 184,
    height: 184,
    name: "Commodity buyers",
    description: "Align partners around agreed terms",
  },
  {
    number: "03",
    className: "art-suppliers",
    image: "imgframe3.svg",
    width: 209,
    height: 229,
    name: "Suppliers and aggregators",
    description: "Coordinate each stage of a trade",
  },
  {
    number: "04",
    className: "art-finance",
    image: "imgframe4.svg",
    width: 174,
    height: 204,
    name: "Financial institutions",
    description: "Review clearer transaction information",
  },
] as const;

function ArrowIcon() {
  return (
    <img
      src={`${ASSETS}imgarrowrightalt.svg`}
      width="24"
      height="24"
      alt=""
    />
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="GreenWallet home">
        <img
          src={`${ASSETS}imgframe1618870115.svg`}
          width="36"
          height="36"
          alt=""
        />
        <span>GreenWallet</span>
      </a>
      <button
        ref={menuButtonRef}
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>
      <nav
        className={`navigation${menuOpen ? " is-open" : ""}`}
        id="primary-navigation"
        aria-label="Main navigation"
      >
        <div className="nav-links">
          {navigationLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          <a className="sign-in" href="/sign-in" onClick={closeMenu}>
            Sign in
          </a>
          <a className="sign-up" href="/sign-up" onClick={closeMenu}>
            Sign up
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-content">
        <h1 id="hero-title">
          Make every trade
          <br className="desktop-break" /> easier to trust
        </h1>
        <p>
          GreenWallet gives agricultural trade a clearer structure from the
          first agreement to the final transaction step.
        </p>
        <div className="hero-actions">
          <a className="button button-light" href="/trade-tickets">
            <span>Open trade workspace</span>
            <ArrowIcon />
          </a>
          <a className="button button-light" href="#how-it-works">
            <span>See how it works</span>
            <ArrowIcon />
          </a>
        </div>
      </div>

    </section>
  );
}

function BenefitCard({
  number,
  icon,
  title,
  description,
}: (typeof benefits)[number]) {
  return (
    <article className="benefit-card">
      <div className="card-meta">
        <span>{number}</span>
        <img src={`${ASSETS}${icon}`} width="18" height="18" alt="" />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

function TradeSection() {
  return (
    <section
      className="section trade-section"
      id="how-it-works"
      aria-labelledby="trade-title"
    >
      <div className="section-shell">
        <p className="eyebrow eyebrow-dark">The trade, made legible</p>
        <div className="trade-intro">
          <h2 id="trade-title">
            A good trade deserves a record as strong as it is.
          </h2>
          <p>
            Agricultural transactions bring many people and moving parts
            together. GreenWallet organizes the details around the trade, so its
            partners can coordinate with a shared point of reference.
          </p>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <BenefitCard key={benefit.number} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section
      className="section audience-section"
      id="who-it-serves"
      aria-labelledby="audience-title"
    >
      <div className="audience-shell">
        <p className="eyebrow eyebrow-light">Built for the trade network</p>
        <h2 id="audience-title">Different roles, one clear picture.</h2>
        <p className="audience-intro">
          Bring the people around a real agricultural transaction into the same
          structured workflow.
        </p>
        <div className="audience-grid">
          {audiences.map((audience) => (
            <article className="audience-card" key={audience.number}>
              <img
                className={`audience-art ${audience.className}`}
                src={`${ASSETS}${audience.image}`}
                width={audience.width}
                height={audience.height}
                alt=""
                aria-hidden="true"
              />
              <span className="card-number">{audience.number}</span>
              <div className="audience-copy">
                <h3>{audience.name}</h3>
                <p>{audience.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const partnerPoints = [
  "Participant accounts alone do not establish identity verification.",
  "Payment and redemption instructions stay connected to the relevant trade record.",
  "Fund handling and settlement remain with the appropriate financial partners.",
] as const;

function ApproachSection() {
  return (
    <section
      className="section approach-section"
      id="our-approach"
      aria-labelledby="approach-title"
    >
      <div className="section-shell">
        <div className="approach-intro">
          <div>
            <p className="eyebrow eyebrow-dark">A coordination layer</p>
            <h2 id="approach-title">
              Built to work with the right partners.
            </h2>
          </div>
          <p>
            GreenWallet structures the transaction information and coordinates
            workflows with appropriate financial partners.
          </p>
        </div>
        <div className="partner-panel">
          <div className="partner-statement">
            <img
              src={`${ASSETS}imgcable.svg`}
              width="48"
              height="48"
              alt=""
              aria-hidden="true"
            />
            <p>Connect the trade record to the financial workflow.</p>
            <img
              className="partner-art"
              src={`${ASSETS}imgframe5.svg`}
              width="135"
              height="148"
              alt=""
              aria-hidden="true"
            />
          </div>
          <ul className="partner-points">
            {partnerPoints.map((point) => (
              <li key={point}>
                <img
                  src={`${ASSETS}imgverified.svg`}
                  width="24"
                  height="24"
                  alt=""
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section
      className="contact-section"
      id="contact"
      aria-labelledby="contact-title"
    >
      <img
        className="contact-art contact-art-left"
        src={`${ASSETS}imgframe.svg`}
        width="381"
        height="417"
        alt=""
        aria-hidden="true"
      />
      <img
        className="contact-art contact-art-right"
        src={`${ASSETS}imgframe6.svg`}
        width="381"
        height="417"
        alt=""
        aria-hidden="true"
      />
      <div className="contact-content">
        <p className="eyebrow eyebrow-light">Let’s put the trade in focus</p>
        <h2 id="contact-title">
          Build more trust into the way trade moves.
        </h2>
        <p>
          Have an agricultural trade workflow in mind? Start a conversation with
          GreenWallet.
        </p>
        <a className="button button-light" href="#contact-note">
          <span>Contact GreenWallet</span>
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <a className="footer-brand" href="#home">
        GreenWallet
      </a>
      <span>Trade information, brought into focus.</span>
      <a href="#home">Back to top ↑</a>
    </footer>
  );
}

function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function updateNetworkStatus() {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);
    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  return (
    <div className="network-status" role="status" aria-live="polite" hidden={!isOffline}>
      You’re offline. This page is available from the saved offline copy.
    </div>
  );
}

export function App() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

    let active = true;

    function registerServiceWorker() {
      if (!active) return;
      void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.error("GreenWallet offline support could not be registered.", error);
      });
    }

    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, { once: true });
    }

    return () => {
      active = false;
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  if (isAuthPath(window.location.pathname)) {
    return (
      <>
        <AuthPage />
        <NetworkStatus />
      </>
    );
  }

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/record-trade") {
    return (
      <>
        <RecordTradePage />
        <NetworkStatus />
      </>
    );
  }

  if (path === "/trade-tickets") {
    return (
      <>
        <TradeTicketsPage />
        <NetworkStatus />
      </>
    );
  }

  return (
    <>
      <HomePage />
      <NetworkStatus />
    </>
  );
}

function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <TradeSection />
        <AudienceSection />
        <ApproachSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
