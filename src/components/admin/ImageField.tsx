"use client";
import { useRef, useState } from "react";
import { uploadImage } from "./upload";

export function ImageField({ name, defaultValue = "", label = "Cover image" }: { name: string; defaultValue?: string; label?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      setUrl(await uploadImage(f));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <span className="label">{label}</span>
      <div
        className="relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/40 hover:border-gold/60"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
        <span className={`relative rounded-full px-3 py-1.5 text-xs font-bold ${url ? "bg-black/70" : "text-white/50"}`}>
          {busy ? "Uploading…" : url ? "Click or drop to replace" : "Click or drop an image"}
        </span>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="mt-2 flex gap-2">
        <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="input !py-1.5 text-xs" />
        {url && <button type="button" onClick={() => setUrl("")} className="btn btn-ghost !px-3 !py-1 text-xs">Clear</button>}
      </div>
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
    </div>
  );
}
