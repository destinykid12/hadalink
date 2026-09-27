import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { InlineNote } from "@/components/ui/States";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { HomeShowcase, HomeHeroStats } from "@/features/home/HomeShowcase";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="page-shell grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge tone="soft">Nigerian agricultural marketplace</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              HadaLink
            </h1>
            <p className="mt-3 text-xl font-medium leading-relaxed text-primary">
              Connecting farmers with agricultural equipment when they need it.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Equipment and mechanization services are scattered across owners, associations,
              contractors, and informal networks. HadaLink helps you discover what is available,
              compare your options, and coordinate access in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/equipment">
                <Button size="lg" icon="search">
                  Find Equipment
                </Button>
              </Link>
              <Link href="/signup?role=PROVIDER">
                <Button size="lg" variant="outline" icon="plus">
                  List Your Equipment
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
              <ClientOnly fallback={<span className="text-muted">Loading marketplace snapshot...</span>}>
                <HomeHeroStats />
              </ClientOnly>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-farm.jpg"
                alt="Nigerian farmer standing beside a tractor on farmland in northern Nigeria"
                className="h-[380px] w-full object-cover sm:h-[460px]"
              />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 rounded-lg border border-line bg-white p-4 shadow-pop sm:left-8 sm:right-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon name="shield" size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Access layer, not an equipment owner</p>
                  <p className="text-xs text-muted">
                    Discover, compare, and coordinate access to fragmented providers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="page-shell py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            The problem is not just missing equipment
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            Agricultural equipment exists across Nigeria, but it is fragmented. Farmers often
            struggle to discover suitable equipment, know who owns it, check availability, compare
            options, understand pricing, coordinate access, and judge whether a provider is
            trustworthy.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Discovery is hard",
              body: "Useful machines sit idle in one community while another community cannot find one to hire.",
            },
            {
              title: "Pricing is unclear",
              body: "Farmers cannot easily compare rates, pricing units, or what is included in a job.",
            },
            {
              title: "Coordination takes too long",
              body: "Booking usually means repeated phone calls, uncertain dates, and no record of the agreement.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-line bg-white p-5">
              <h3 className="text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-white">
        <div className="page-shell py-14">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            How HadaLink works
          </h2>
          <p className="mt-3 max-w-2xl text-base text-ink-soft">
            A straightforward marketplace loop built around how farming actually happens.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: "Find what you need", body: "Search equipment and services by category, location, and price." },
              { step: "2", title: "Compare options", body: "Review providers, pricing units, availability, and ratings side by side." },
              { step: "3", title: "Request access", body: "Send a booking request with your date and farm location details." },
              { step: "4", title: "Confirm and record", body: "The provider accepts, payment is simulated, and the transaction is recorded." },
            ].map((item) => (
              <li key={item.step} className="rounded-lg border border-line p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-3 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For farmers / For providers */}
      <section className="page-shell grid gap-6 py-14 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-primary-soft p-6">
          <h2 className="text-xl font-bold text-ink">For farmers</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            {[
              "Find the equipment you need, when you need it.",
              "Compare available providers, prices, and terms.",
              "See availability and book a date without long phone chains.",
              "Keep a record of bookings, payments, and receipts.",
              "Leave reviews after completed jobs to help other farmers.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary" />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/signup?role=FARMER" className="inline-block mt-5">
            <Button>Create a farmer account</Button>
          </Link>
        </div>
        <div className="rounded-lg border border-line bg-accent-soft p-6">
          <h2 className="text-xl font-bold text-ink">For equipment providers</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            {[
              "List your equipment and services where farmers can find them.",
              "Manage pricing, availability, and listing details yourself.",
              "Receive booking requests and respond in one place.",
              "Track your jobs, earnings, and reviews over time.",
              "Build a verified profile that farmers can trust.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
                {line}
              </li>
            ))}
          </ul>
          <Link href="/signup?role=PROVIDER" className="inline-block mt-5">
            <Button variant="secondary">List your equipment</Button>
          </Link>
        </div>
      </section>

      {/* Available equipment and services */}
      <section className="border-y border-line bg-white">
        <div className="page-shell py-14">
          <ClientOnly fallback={<p className="text-sm text-muted">Loading listings...</p>}>
            <HomeShowcase />
          </ClientOnly>
        </div>
      </section>

      {/* Trust and verification */}
      <section id="verification" className="page-shell py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Trust and verification
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              HadaLink reviews provider registration details and business information before a
              provider becomes verified. Verification status is shown on profiles and listings so
              you always know who you are dealing with.
            </p>
            <div className="mt-5">
              <InlineNote tone="info">
                Verification checks submitted documents and business details. It is not a physical
                inspection of equipment, and HadaLink does not guarantee equipment availability or
                the cheapest price.
              </InlineNote>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: "shield" as const, title: "Document review", body: "Business registration and identification details are reviewed by the HadaLink admin team." },
              { icon: "chart" as const, title: "Ratings from real jobs", body: "Ratings come from completed bookings on the platform, not self-reported claims." },
              { icon: "wallet" as const, title: "Clear pricing units", body: "Every listing shows how it is priced: per hour, per hectare, per day, per job, or fixed." },
              { icon: "message" as const, title: "Booking-based communication", body: "Messages are tied to bookings so both sides keep a record of the arrangement." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-line bg-white p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon name={item.icon} size={18} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace explanation */}
      <section className="border-y border-line bg-white">
        <div className="page-shell py-14">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            A simple marketplace, explained
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-line p-5">
              <h3 className="text-base font-semibold text-ink">HadaLink is an access layer</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We do not own the machines. We help farmers reach the many providers who do, and we
                keep a reliable record of every transaction arranged through the platform.
              </p>
            </div>
            <div className="rounded-lg border border-line p-5">
              <h3 className="text-base font-semibold text-ink">Pricing stays transparent</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Providers set their own prices and pricing units. HadaLink earns a small commission
                on completed transactions instead of marking up equipment rates.
              </p>
            </div>
            <div className="rounded-lg border border-line p-5">
              <h3 className="text-base font-semibold text-ink">Reputation is earned</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                After each completed job, farmers review providers. Over time, reliable providers
                build a rating history that helps them win more work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="page-shell py-16">
        <div className="rounded-lg border border-primary/25 bg-primary p-8 text-white sm:p-12">
          <h2 className="max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">
            Ready to find equipment for your next farm operation?
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90">
            Create a free account to search, compare, book, and keep records of every farm
            operation. Providers can list equipment in minutes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup?role=FARMER">
              <Button size="lg" variant="outline" className="border-white bg-white text-primary hover:bg-white/90">
                Find Equipment
              </Button>
            </Link>
            <Link href="/signup?role=PROVIDER">
              <Button
                size="lg"
                variant="outline"
                className="border-white/70 bg-transparent text-white hover:bg-white/10"
              >
                List Your Equipment
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
