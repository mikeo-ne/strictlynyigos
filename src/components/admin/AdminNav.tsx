"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const items: { href: string; label: string; icon: string; roles: Role[] }[] = [
  { href: "/admin", label: "Dashboard", icon: "◎", roles: ["admin", "editor", "door"] },
  { href: "/admin/articles", label: "Articles", icon: "✎", roles: ["admin", "editor"] },
  { href: "/admin/events", label: "Events & tickets", icon: "★", roles: ["admin"] },
  { href: "/admin/orders", label: "Orders", icon: "₿", roles: ["admin"] },
  { href: "/admin/checkin", label: "Door check-in", icon: "▣", roles: ["admin", "door"] },
  { href: "/admin/subscribers", label: "Mailing list", icon: "@", roles: ["admin", "editor"] },
  { href: "/admin/campaigns", label: "Email campaigns", icon: "✉", roles: ["admin", "editor"] },
  { href: "/admin/outbox", label: "Email outbox", icon: "⇪", roles: ["admin", "editor"] },
  { href: "/admin/team", label: "Team", icon: "☺", roles: ["admin"] },
  { href: "/admin/settings", label: "Site settings", icon: "⚙", roles: ["admin"] },
];

export function AdminNav({ role }: { role: Role }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {items
        .filter((i) => i.roles.includes(role))
        .map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-gold text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
              <span className="w-4 text-center opacity-80">{i.icon}</span>
              {i.label}
            </Link>
          );
        })}
    </nav>
  );
}
