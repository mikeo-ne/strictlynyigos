"use client";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export function AuthForm({ action, setup = false, offerStarter = false }: { action: (s: FormState, fd: FormData) => Promise<FormState>; setup?: boolean; offerStarter?: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  return (
    <form action={formAction} className="space-y-4">
      {setup && (
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" className="input" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required minLength={setup ? 8 : undefined} autoComplete={setup ? "new-password" : "current-password"} />
      </div>
      {setup && (
        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <input type="checkbox" name="starter" defaultChecked={offerStarter} className="mt-1 accent-[#FED100]" />
          <span>
            <b className="text-white">Load starter content</b>
            <span className="block text-white/60">Past Strictly Nyigos editions, a sample upcoming event with tickets, and a few articles. You can edit or delete it all later.</span>
          </span>
        </label>
      )}
      {state?.error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">{state.error}</p>}
      <button className="btn btn-gold w-full !py-3" disabled={pending}>{pending ? "Please wait…" : setup ? "Create admin account" : "Log in"}</button>
    </form>
  );
}
