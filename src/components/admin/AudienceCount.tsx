"use client";
import { useEffect, useState } from "react";
import { audienceCountAction } from "@/app/admin/actions";

export function AudienceCount() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const sel = document.getElementById("audience") as HTMLSelectElement | null;
    if (!sel) return;
    const update = () => audienceCountAction(sel.value).then(setN);
    update();
    sel.addEventListener("change", update);
    return () => sel.removeEventListener("change", update);
  }, []);
  return <p className="text-sm text-white/60">{n === null ? "Counting…" : <><b className="text-white">{n}</b> recipient{n === 1 ? "" : "s"}</>}</p>;
}
