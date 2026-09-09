"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GenerateConsole from "@/components/session/GenerateConsole";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";

export default function DeployPage() {
  return (
    <div className="flex min-h-screen animate-rise flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <Container size="narrow" className="mb-8 text-center">
          <PageHeader
            kicker="Deploy"
            title="Deploy your bot"
            titleClassName="text-2xl sm:text-3xl"
            description={
              <>
                Fill in your details and generate a ready-to-run{" "}
                <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">
                  index.js
                </code>
                . Pair your device and the session details will be sent to
                your WhatsApp DM.
              </>
            }
          />
        </Container>
        <GenerateConsole />
      </main>
      <Footer />
    </div>
  );
}
