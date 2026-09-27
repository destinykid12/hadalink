import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ListingBrowser } from "@/features/listings/ListingBrowser";

export const metadata = {
  title: "Find services: HadaLink",
  description: "Search and compare mechanization services: ploughing, planting, harvesting, and more.",
};

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-line bg-white">
          <div className="page-shell py-8">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Find services
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Ploughing, planting, harvesting, irrigation installation, haulage, processing, and
              operator services. Priced per hectare, per day, per job, or fixed so you can compare
              clearly.
            </p>
          </div>
        </div>
        <div className="page-shell py-8">
          <ListingBrowser
            lockType="SERVICE"
            emptyMessage="There are no service listings matching your search. Try a different category or location."
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
