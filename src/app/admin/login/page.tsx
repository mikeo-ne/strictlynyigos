import { redirect } from "next/navigation";
import { AuthForm } from "@/components/admin/AuthForm";
import { Logo } from "@/components/Logo";
import { currentUser, userCount } from "@/lib/auth";
import { loginAction } from "../auth-actions";

export const metadata = { title: "Organiser login", robots: { index: false } };

export default async function Login() {
  if (await userCount() === 0) redirect("/admin/setup");
  if (await currentUser()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#1a2a10,_#0a0a0a_60%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center"><Logo /><p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-white/40">Organiser portal</p></div>
        <div className="card p-6"><AuthForm action={loginAction} /></div>
      </div>
    </div>
  );
}
