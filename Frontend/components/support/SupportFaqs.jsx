"use client";

import { useEffect, useState } from "react";
import { CircleHelp, MessageCircle } from "lucide-react";
import { robot } from "@/lib/robot";
import { SUPPORT_FAQS } from "@/lib/supportFaqs";
import { api } from "@/lib/api";

export default function SupportFaqs() {
  const [approvedFaqs, setApprovedFaqs] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .publishedAssistantFaqs()
      .then(({ faqs }) => {
        if (!cancelled) setApprovedFaqs(Array.isArray(faqs) ? faqs : []);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const seenQuestions = new Set(SUPPORT_FAQS.map((faq) => faq.question.toLowerCase()));
  const faqs = [
    ...SUPPORT_FAQS,
    ...approvedFaqs.filter((faq) => {
      const normalized = faq.question?.trim().toLowerCase();
      if (!normalized || seenQuestions.has(normalized)) return false;
      seenQuestions.add(normalized);
      return true;
    }),
  ];

  return (
    <div>
      {loadFailed ? (
        <p className="mb-2 text-xs text-muted">
          Additional answers could not be loaded. Please try again later.
        </p>
      ) : null}
      <div className="divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-surface">
        {faqs.map((faq) => (
          <details key={faq.id || faq.question} className="group p-4 sm:p-5">
            <summary className="focus-ring flex cursor-pointer list-none items-center gap-3 rounded-lg text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <CircleHelp
                size={16}
                className="flex-none text-azure-500"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                {faq.question}
              </span>
              <span
                className="text-lg leading-none text-muted transition group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <div className="mt-3 pl-7">
              <p className="text-sm leading-6 text-muted">{faq.answer}</p>
              <button
                type="button"
                onClick={() => robot.askAssistant(faq.question)}
                className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-azure-500 transition hover:text-azure-400"
              >
                <MessageCircle size={14} aria-hidden="true" />
                Ask assistant
              </button>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
