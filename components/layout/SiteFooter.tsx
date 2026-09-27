import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="page-shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
              <Icon name="tractor" size={20} />
            </span>
            <span className="text-lg font-bold text-ink">
              Hada<span className="text-primary">Link</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Connecting farmers with agricultural equipment when they need it. HadaLink is an
            access layer for fragmented equipment and mechanization services.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Marketplace</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/equipment" className="hover:text-ink">
                Find equipment
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-ink">
                Find services
              </Link>
            </li>
            <li>
              <Link href="/signup?role=PROVIDER" className="hover:text-ink">
                List your equipment
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-ink">
                How HadaLink works
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Trust</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/how-it-works#verification" className="hover:text-ink">
                Provider verification
              </Link>
            </li>
            <li>
              <Link href="/how-it-works#pricing" className="hover:text-ink">
                Pricing and commission
              </Link>
            </li>
            <li>
              <Link href="/how-it-works#demo" className="hover:text-ink">
                About this demo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Prototype notice</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This is a functional prototype with demonstration data. Bookings, payments, and
            verification are simulated and stored in your browser. No real money moves and no
            physical equipment inspection takes place.
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>HadaLink prototype. Built for demonstration purposes.</p>
          <p>Demo data covers selected farming locations across Nigeria.</p>
        </div>
      </div>
    </footer>
  );
}
