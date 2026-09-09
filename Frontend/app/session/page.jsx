"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PairConsole from "@/components/session/PairConsole";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";

export default function SessionPage() {
  return (
    <div className="flex min-h-screen animate-rise flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <Container size="narrow" className="mb-8 text-center">
          <PageHeader
            kicker="Session"
            title="Pair your WhatsApp number"
            titleClassName="text-2xl sm:text-3xl"
            description={
              <>
                Choose a secure linking method to connect your number. Once
                linked, continue to{" "}
                <span className="text-fg">Deploy</span> to configure your
                workspace.
              </>
            }
          />
        </Container>
        <PairConsole />
      </main>
      <Footer />
    </div>
  );
}
