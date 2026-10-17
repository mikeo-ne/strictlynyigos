import { redirect } from "next/navigation";
import { AuthForm } from "@/components/admin/AuthForm";
import { Logo } from "@/components/Logo";
import { userCount } from "@/lib/auth";
import { setupAction } from "../auth-actions";

export const metadata = { title: "Set up", robots: { index: false } };

export default function Setup() {
  if (userCount() > 0) redirect("/admin/login");
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center"><Logo /><p className="mt-3 text-white/60">Welcome! Create the first organiser (admin) account.</p></div>
        <div className="card p-6"><AuthForm action={setupAction} setup /></div>
      </div>
    </div>
  );
}
