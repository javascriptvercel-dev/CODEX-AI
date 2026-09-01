"use client";
import { Github } from "lucide-react";
import Modal from "./Modal";
const REPO_URL = "https://github.com/codexverified/CODEX-AI";
export default function RepositoryModal({ onClose }) {
  return (
    <Modal
      title="Repository"
      icon={<Github size={18} className="text-azure-500" />}
      onClose={onClose}
    >

      <p className="mb-5 text-sm text-muted">

        Explore the project, review updates, report issues, or contribute
        improvements.
      </p>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-edge bg-surface2 py-3 text-sm font-semibold transition hover:border-azure-500/60"
      >

        <Github size={17} /> View on GitHub
      </a>
    </Modal>
  );
}
