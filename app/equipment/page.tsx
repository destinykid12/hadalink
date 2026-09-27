import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ListingBrowser } from "@/features/listings/ListingBrowser";

export const metadata = {
  title: "Find equipment: HadaLink",
  description: "Search and compare agricultural equipment available for hire across Nigeria.",
};

export default function EquipmentPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-line bg-white">
          <div className="page-shell py-8">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Find equipment
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Tractors, ploughs, planters, harvesters, irrigation systems, transport, and
              processing equipment from providers across our demo locations. Filter by location,
              price, availability, and verification status.
            </p>
          </div>
        </div>
        <div className="page-shell py-8">
          <ListingBrowser
            lockType="EQUIPMENT"
            emptyMessage="There are no equipment listings matching your search. Try widening the location or price range."
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
