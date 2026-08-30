"use client";
import { useState } from "react";
import SupportModal from "@/components/modals/SupportModal";
export default function SupportLink({ children = "CODEX AI Support" }) {
  const [open, setOpen] = useState(false);
  return (
    <>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring rounded text-azure-500 hover:underline"
      >

        {children}
      </button>
      {open && <SupportModal onClose={() => setOpen(false)} />}
    </>
  );
}
