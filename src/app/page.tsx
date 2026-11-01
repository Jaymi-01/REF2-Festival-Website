import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import DateVenue from "@/components/DateVenue";
import Activities from "@/components/Activities";
import BroughtToYou from "@/components/BroughtToYou";
import Lineup from "@/components/Lineup";
import Gallery from "@/components/Gallery";
import BrandStory from "@/components/BrandStory";
import Footer from "@/components/Footer";
import CursorTrail from "@/components/CursorTrail";
import MascotBuddy from "@/components/MascotBuddy";
import ScrollToTop from "@/components/ScrollToTop";
import FinalCta from "@/components/FinalCta";
import { CastellatedEdge, CheckerEdge, TornEdge } from "@/components/Dividers";
import { doodleUrl } from "@/lib/doodle";
import { FESTIVAL } from "@/lib/utils";

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Festival",
  name: "Real Essence Festival 2.0",
  startDate: "2026-11-07T10:00:00+01:00",
  endDate: "2026-11-08T20:00:00+01:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "Ikeja City Mall",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Obafemi Awolowo Way, Alausa",
      addressLocality: "Ikeja",
      addressRegion: "Lagos",
      addressCountry: "NG",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "Sedaap Supreme Noodles",
    email: "info@sedaapsupremenoodles.org",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "NGN",
    availability: "https://schema.org/InStock",
  },
  description:
    "Two days of food, music, games and culture from Sedaap Supreme Noodles, including a ₦1,000,000 cooking competition.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      <Nav />
      <CursorTrail />
      <MascotBuddy />
      <ScrollToTop />

      <main id="register" className="relative">
        {/* ── Yellow: hero + the primary action ─────────────────── */}
        <Hero />
        <CastellatedEdge topColor="#f5d551" bottomColor="#fff9ec" />

        {/* ── Cream: when & where ───────────────────────────────── */}
        <DateVenue />
        <TornEdge fill="#b10008" />

        {/* ── Red: the body of the festival ─────────────────────── */}
        <div
          className="relative isolate overflow-hidden bg-red"
          style={{ ["--doodle" as string]: doodleUrl("#5e0004", 0.55) }}
        >
          <div aria-hidden="true" className="doodle-bg pointer-events-none absolute inset-0 -z-10" />
          <Activities />
          <Lineup />
          <BroughtToYou />
          <Gallery />
        </div>

        <CheckerEdge topColor="#b10008" bottomColor="#0a4e24" />

        {/* ── Green: the brand ──────────────────────────────────── */}
        <BrandStory />

        {/* ── Last call ─────────────────────────────────────────── */}
        <FinalCta />
      </main>

      <Footer />

      {/* Plain-text fallback for crawlers and no-JS readers. */}
      <noscript>
        <div style={{ background: "#fff9ec", color: "#1a1207", padding: "24px" }}>
          <h2>Real Essence Festival 2.0</h2>
          <p>
            {FESTIVAL.dateLabel} · {FESTIVAL.venue}, {FESTIVAL.city} · from{" "}
            {FESTIVAL.doors}. Free entry. To register, email{" "}
            <a href="mailto:info@sedaapsupremenoodles.org">
              info@sedaapsupremenoodles.org
            </a>
            .
          </p>
        </div>
      </noscript>
    </>
  );
}
