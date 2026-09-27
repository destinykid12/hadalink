import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { InlineNote } from "@/components/ui/States";

const steps = [
  {
    title: "Farmers search",
    body: "Browse equipment and mechanization services by category, location, price, and availability. Filter by what matters: operator included, verified provider, price range.",
  },
  {
    title: "Farmers compare",
    body: "Select up to three listings and compare price, provider, location, availability, operator, rating, and verification side by side.",
  },
  {
    title: "Farmers request a booking",
    body: "Pick a date, confirm the service details and farm location, then send a booking request to the provider.",
  },
  {
    title: "Providers respond",
    body: "Providers accept or reject requests from their dashboard. Accepted bookings hold the date, which prevents double booking.",
  },
  {
    title: "Payment is simulated",
    body: "In this prototype, payment is simulated with successful, failed, and pending outcomes. Every record is stored locally and labelled as simulated.",
  },
  {
    title: "Service is completed and recorded",
    body: "Providers mark jobs completed. Transaction records are created with the 5% HadaLink commission shown as a clear breakdown.",
  },
  {
    title: "Farmers review providers",
    body: "Completed bookings unlock reviews. Ratings update provider and listing scores immediately.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-line bg-white">
          <div className="page-shell py-12">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              How HadaLink works
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
              HadaLink is an access layer that helps farmers discover, compare, and coordinate
              access to agricultural equipment and mechanization services. This page explains the
              marketplace loop, verification, and pricing.
            </p>
          </div>
        </section>

        <section className="page-shell py-12">
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-lg border border-line bg-white p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="verification" className="border-y border-line bg-white">
          <div className="page-shell py-12">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Trust and verification</h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-base leading-relaxed text-ink-soft">
                  Providers submit their business name, contact details, location, identification
                  or business registration information, and a summary of their equipment and
                  services. The HadaLink admin team reviews each request and can approve or reject
                  it with a note.
                </p>
                <div className="mt-4">
                  <InlineNote tone="warning">
                    Verification is based on submitted documents and business information. It is
                    not a physical inspection of equipment. HadaLink does not guarantee equipment
                    availability, the cheapest price, insurance coverage, or automatic dispute
                    resolution.
                  </InlineNote>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Verification status shows on provider profiles and listings.",
                  "Ratings come only from completed bookings on the platform.",
                  "Booking records, messages, and transactions are kept together.",
                  "Providers manage their own prices, terms, and availability.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="pricing" className="page-shell py-12">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Pricing and commission</h2>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-base leading-relaxed text-ink-soft">
                Providers set their own prices and choose the pricing unit that matches their
                work: fixed price, per hour, per hectare, per day, or per job. Listings always show
                the unit clearly so farmers can compare like with like.
              </p>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">
                HadaLink earns a commission on completed transactions. The example breakdown on a
                simulated transaction of ₦100,000 looks like this:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                <li className="flex justify-between rounded-md border border-line bg-white px-4 py-2.5">
                  <span>Transaction amount</span>
                  <span className="font-semibold">₦100,000</span>
                </li>
                <li className="flex justify-between rounded-md border border-line bg-white px-4 py-2.5">
                  <span>HadaLink commission (5%)</span>
                  <span className="font-semibold">₦5,000</span>
                </li>
                <li className="flex justify-between rounded-md border border-primary/25 bg-primary-soft px-4 py-2.5">
                  <span>Provider amount</span>
                  <span className="font-semibold">₦95,000</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-muted">
                This example describes a simulated transaction. There is no real payment gateway
                in this prototype.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white p-6">
              <h3 className="text-base font-semibold text-ink">What is simulated in this demo</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
                {[
                  "Authentication (stored in your browser, not a secure server).",
                  "Payments (successful, failed, and pending outcomes can all be simulated).",
                  "Provider verification (document review by the demo admin account).",
                  "Notifications and messaging (stored in localStorage).",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Icon name="info" size={15} className="mt-0.5 shrink-0 text-muted" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="demo" className="border-t border-line bg-white">
          <div className="page-shell py-12">
            <h2 className="text-2xl font-bold tracking-tight text-ink">About this demo</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
              HadaLink in its current form is a functional prototype with demonstration data
              covering selected farming locations in Nigeria. It is not a launched nationwide
              service. All bookings, payments, and records exist only in your browser.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg">Try the demo accounts</Button>
              </Link>
              <Link href="/equipment">
                <Button size="lg" variant="outline">
                  Browse listings
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
