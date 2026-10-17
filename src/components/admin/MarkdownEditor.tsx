"use client";
import { useRef, useState } from "react";
import { uploadImage } from "./upload";
import { previewMarkdownAction } from "@/app/admin/actions";

type Tool = { label: string; title: string; wrap?: [string, string]; line?: string; action?: "image" | "link" };
const TOOLS: Tool[] = [
  { label: "B", title: "Bold", wrap: ["**", "**"] },
  { label: "I", title: "Italic", wrap: ["_", "_"] },
  { label: "H2", title: "Heading", line: "## " },
  { label: "H3", title: "Sub-heading", line: "### " },
  { label: "❝", title: "Quote", line: "> " },
  { label: "•", title: "Bullet list", line: "- " },
  { label: "1.", title: "Numbered list", line: "1. " },
  { label: "🔗", title: "Link", action: "link" },
  { label: "🖼", title: "Upload image", action: "image" },
];

export function MarkdownEditor({ name, defaultValue = "", rows = 18, placeholder }: { name: string; defaultValue?: string; rows?: number; placeholder?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [html, setHtml] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function insert(fn: (sel: string) => string, selectInner = false) {
    const el = ta.current!;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e);
    const rep = fn(sel);
    const next = value.slice(0, s) + rep + value.slice(e);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = s + rep.length;
      el.setSelectionRange(selectInner ? s : pos, pos);
    });
  }

  function apply(t: Tool) {
    if (t.wrap) insert((sel) => t.wrap![0] + (sel || "text") + t.wrap![1]);
    else if (t.line) insert((sel) => (sel || "").split("\n").map((l) => t.line + l).join("\n") || t.line!);
    else if (t.action === "link") {
      const url = prompt("Link URL", "https://");
      if (url) insert((sel) => `[${sel || "link text"}](${url})`);
    } else if (t.action === "image") fileRef.current?.click();
  }

  async function onImage(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(f);
      insert(() => `\n![${f.name.replace(/\.[^.]+$/, "")}](${url})\n`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const words = value.split(/\s+/).filter(Boolean).length;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-black/40 p-1.5">
        <div className="mr-2 flex rounded-lg bg-white/5 p-0.5 text-xs font-bold">
          {(["write", "preview"] as const).map((x) => (
            <button key={x} type="button" onClick={async () => { if (x === "preview") { setHtml("<p style='opacity:.5'>Rendering…</p>"); setTab(x); setHtml(await previewMarkdownAction(value)); } else setTab(x); }} className={`rounded-md px-3 py-1 capitalize ${tab === x ? "bg-gold text-black" : "text-white/60"}`}>{x}</button>
          ))}
        </div>
        {tab === "write" &&
          TOOLS.map((t) => (
            <button key={t.title} type="button" title={t.title} onClick={() => apply(t)} className="min-w-8 rounded-md px-2 py-1 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white">{t.label}</button>
          ))}
        <span className="ml-auto pr-2 text-xs text-white/40">{busy ? "Uploading image…" : `${words} words`}</span>
      </div>
      <textarea
        ref={ta}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        placeholder={placeholder || "Write in Markdown… **bold**, _italic_, ## headings, - lists, [links](https://…). Paste YouTube embeds as <iframe> code."}
        onPaste={(e) => {
          const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
          if (f) {
            e.preventDefault();
            onImage(f);
          }
        }}
        className={`block w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-white/90 outline-none ${tab === "preview" ? "hidden" : ""}`}
      />
      {tab === "preview" && (
        <div className="prose-sn min-h-[300px] p-5" dangerouslySetInnerHTML={{ __html: html || "<p style='opacity:.5'>Nothing to preview yet.</p>" }} />
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
    </div>
  );
}
