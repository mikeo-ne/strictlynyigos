"use client";

import { useActionState } from "react";
import { subscribeAction, type FormState } from "@/app/actions";

export function NewsletterForm({ source = "website", compact = false }: { source?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeAction, null);
  if (state?.ok)
    return (
      <p role="status" className="rounded-xl border border-jam/40 bg-jam/10 px-4 py-3 font-semibold text-jam">
        {state.message}
      </p>
    );
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="source" value={source} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className={`flex w-full flex-col gap-2 ${compact ? "" : "sm:flex-row"}`}>
        {!compact && (
          <input name="name" placeholder="First name" aria-label="First name" className="input sm:max-w-[11rem]" autoComplete="given-name" />
        )}
        <input name="email" type="email" required placeholder="you@email.com" aria-label="Email address" className="input flex-1" autoComplete="email" />
        <button className="btn btn-gold" disabled={pending}>
          {pending ? "Joining…" : "Join the list"}
        </button>
      </div>
      {state?.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
