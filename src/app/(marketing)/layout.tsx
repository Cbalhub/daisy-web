import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { EventPopup } from "@/components/marketing/EventPopup";
import { getActiveEvents } from "@/lib/events";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const events = await getActiveEvents();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      {events.length > 0 && <EventPopup events={events} />}
    </>
  );
}
