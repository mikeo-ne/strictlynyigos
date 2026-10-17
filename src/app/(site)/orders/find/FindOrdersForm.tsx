"use client";
import { useActionState } from "react";
import { resendOrdersAction } from "./actions";
import type { FormState } from "@/app/actions";

export function FindOrdersForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(resendOrdersAction, null);
  if (state?.ok) return <p className="rounded-xl border border-jam/40 bg-jam/10 p-4 font-semibold text-jam">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <input name="email" type="email" required placeholder="you@email.com" className="input flex-1" />
      <button className="btn btn-gold" disabled={pending}>{pending ? "Sending…" : "Send my tickets"}</button>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
