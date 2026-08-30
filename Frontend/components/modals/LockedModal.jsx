"use client";
import { Lock } from "lucide-react";
import Modal from "./Modal";
export default function LockedModal({ title, onClose }) {
  return (
    <Modal
      title={title}
      icon={<Lock size={18} className="text-azure-500" />}
      onClose={onClose}
    >
      
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        
        <span className="grid h-12 w-12 place-items-center rounded-full bg-azure-500/10 text-azure-500">
          
          <Lock size={20} />
        </span>
        <p className="text-sm text-muted">
          {title ? `${title} isn't open yet.` : "This feature isn't open yet."} We're still building it out — check back soon.
        </p>
      </div>
    </Modal>
  );
}
