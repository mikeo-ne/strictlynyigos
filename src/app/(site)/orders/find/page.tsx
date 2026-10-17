import { FindOrdersForm } from "./FindOrdersForm";

export const metadata = { title: "Find my tickets" };

export default function FindOrders() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-display text-5xl text-white">Find my tickets</h1>
      <p className="mt-3 text-white/60">Enter the email you used when buying. We&apos;ll re-send links to all your tickets.</p>
      <div className="mt-8"><FindOrdersForm /></div>
    </div>
  );
}
