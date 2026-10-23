"use client";
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkInAction, undoCheckInAction, type CheckInResult } from "@/app/admin/actions";

type Ev = { id: number; title: string; issued: number; checked: number; people: number; peopleIn: number };

const LABEL: Record<CheckInResult["status"], { title: string; cls: string }> = {
  ok: { title: "✓ VALID — LET IN", cls: "bg-jam text-black" },
  used: { title: "✕ ALREADY USED", cls: "bg-red-600 text-white" },
  invalid: { title: "✕ INVALID CODE", cls: "bg-red-600 text-white" },
  wrong_event: { title: "⚠ WRONG EVENT", cls: "bg-orange-500 text-black" },
  void: { title: "✕ REFUNDED / CANCELLED", cls: "bg-red-600 text-white" },
};

export function CheckInScanner({ events, defaultEventId }: { events: Ev[]; defaultEventId: number | null }) {
  const [eventId, setEventId] = useState<number | null>(defaultEventId);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [log, setLog] = useState<(CheckInResult & { at: Date })[]>([]);
  const [camera, setCamera] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [stats, setStats] = useState(() => Object.fromEntries(events.map((e) => [e.id, { checked: e.checked, peopleIn: e.peopleIn }])));
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);
  const lastScan = useRef({ code: "", at: 0 });

  const submit = useCallback(
    async (raw: string) => {
      const c = raw.trim();
      if (!c || busy.current) return;
      busy.current = true;
      try {
        const r = await checkInAction(c, eventId);
        setResult(r);
        setLog((l) => [{ ...r, at: new Date() }, ...l].slice(0, 30));
        if (r.status === "ok" && eventId)
          setStats((s) => ({ ...s, [eventId]: { checked: (s[eventId]?.checked ?? 0) + 1, peopleIn: (s[eventId]?.peopleIn ?? 0) + (r.admits ?? 1) } }));
        if (navigator.vibrate) navigator.vibrate(r.status === "ok" ? 80 : [200, 80, 200]);
        setCode("");
      } finally {
        busy.current = false;
      }
    },
    [eventId],
  );

  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const tick = () => {
          const cv = canvas.current;
          if (cv && v.readyState === v.HAVE_ENOUGH_DATA) {
            cv.width = v.videoWidth;
            cv.height = v.videoHeight;
            const ctx = cv.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(v, 0, 0, cv.width, cv.height);
            const img = ctx.getImageData(0, 0, cv.width, cv.height);
            const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (qr?.data) {
              const now = Date.now();
              if (qr.data !== lastScan.current.code || now - lastScan.current.at > 4000) {
                lastScan.current = { code: qr.data, at: now };
                submit(qr.data);
              }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setCamErr("Couldn't open the camera. Allow camera access (HTTPS required) or type codes manually.");
        setCamera(false);
      }
    })();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera, submit]);

  const ev = events.find((e) => e.id === eventId);
  const st = eventId ? stats[eventId] : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={eventId ?? ""} onChange={(e) => setEventId(Number(e.target.value) || null)} className="input max-w-sm">
            <option value="">Any event</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <button onClick={() => { setCamErr(""); setCamera((c) => !c); }} className={`btn ${camera ? "btn-ghost" : "btn-gold"}`}>
            {camera ? "Stop camera" : "📷 Scan with camera"}
          </button>
        </div>
        {camErr && <p className="text-sm text-red-400">{camErr}</p>}
        {camera && (
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-black">
            <video ref={video} playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-gold/80" />
            <canvas ref={canvas} className="hidden" />
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); submit(code); }} className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Type ticket code…" className="input !py-3 font-mono text-lg tracking-widest" autoFocus autoCapitalize="characters" autoComplete="off" />
          <button className="btn btn-gold !px-6">Check</button>
        </form>
        {result && (
          <div className={`rounded-2xl p-6 ${LABEL[result.status].cls}`} role="status" aria-live="assertive">
            <p className="font-display text-4xl">{LABEL[result.status].title}</p>
            <p className="mt-1 font-mono text-lg">{result.code}</p>
            {result.name && (
              <p className="mt-2 text-lg font-bold">
                {result.name} · {result.ticket} · admits {result.admits}
              </p>
            )}
            {result.status === "wrong_event" && <p className="font-semibold">This ticket is for: {result.event}</p>}
            {result.usedAt && <p className="font-semibold">Scanned at {new Date(result.usedAt).toLocaleTimeString()}</p>}
            {result.status === "ok" && (
              <button
                onClick={async () => {
                  await undoCheckInAction(result.code);
                  if (eventId) setStats((s) => ({ ...s, [eventId]: { checked: s[eventId].checked - 1, peopleIn: s[eventId].peopleIn - (result.admits ?? 1) } }));
                  setResult(null);
                }}
                className="mt-3 text-sm font-bold underline"
              >
                Undo this check-in
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {ev && st && (
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-white/45">{ev.title}</p>
            <p className="mt-2 font-display text-4xl">{st.peopleIn} <span className="text-lg text-white/50">/ {ev.people} people in</span></p>
            <p className="text-sm text-white/55">{st.checked} of {ev.issued} tickets scanned</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-jam" style={{ width: `${(st.checked / Math.max(1, ev.issued)) * 100}%` }} /></div>
          </div>
        )}
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Recent scans</p>
          <ul className="mt-3 space-y-2 text-sm">
            {log.map((l, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="font-mono">{l.code}</span>
                <span className={l.status === "ok" ? "text-jam" : "text-red-400"}>{l.status === "ok" ? "✓ in" : l.status.replace("_", " ")}</span>
                <span className="text-white/40">{l.at.toLocaleTimeString()}</span>
              </li>
            ))}
            {!log.length && <li className="text-white/40">Nothing scanned yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
