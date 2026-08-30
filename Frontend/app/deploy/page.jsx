"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GenerateConsole from "@/components/session/GenerateConsole";
export default function DeployPage() {
  return (
    <div className="flex min-h-screen animate-rise flex-col">
      
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-5 py-16">
        
        <div className="mb-8 max-w-md text-center">
          
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-azure-500">
            Deploy
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            
            Turn your session into a bot
          </h1>
          <p className="mt-3 text-sm text-muted">
            
            Fill in your details and generate a ready-to-run
            <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">
              index.js
            </code>
            . Don&apos;t have a session ID yet? Pair a device on the
            <span className="text-fg">Session</span> page first.
          </p>
        </div>
        <GenerateConsole />
      </main>
      <Footer />
    </div>
  );
}
