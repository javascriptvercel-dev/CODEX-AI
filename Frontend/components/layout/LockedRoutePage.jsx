import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LockedModal from "@/components/modals/LockedModal";

export default function LockedRoutePage({ page }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="h-0 w-0" aria-hidden="true" />
      </main>
      <Footer />
      <LockedModal
        title={page.title}
        status={page.status}
        message={page.message}
      />
    </div>
  );
}
