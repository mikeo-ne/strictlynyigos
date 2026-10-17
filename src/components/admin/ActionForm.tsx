"use client";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

/** Wraps a server action form and shows its error/success message. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  return (
    <form action={formAction} className={className} key={resetOnSuccess && state?.ok ? state.message : undefined}>
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {state?.error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">{state.error}</p>}
      {state?.ok && state.message && <p className="mt-3 rounded-lg bg-jam/10 px-3 py-2 text-sm font-semibold text-jam">{state.message}</p>}
    </form>
  );
}

export function SubmitButton({ children, className = "btn btn-gold", name, value, confirm: confirmMsg }: { children: React.ReactNode; className?: string; name?: string; value?: string; confirm?: string }) {
  return (
    <button
      className={className}
      name={name}
      value={value}
      onClick={(e) => {
        if (confirmMsg && !window.confirm(confirmMsg)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
