import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="text-5xl font-bold text-primary">404</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Page not found</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The page you are looking for does not exist or may have been moved. Try the marketplace
            or go back to the homepage.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/">
              <Button>Go to homepage</Button>
            </Link>
            <Link href="/equipment">
              <Button variant="outline">Browse equipment</Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
