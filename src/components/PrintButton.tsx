"use client";
export function PrintButton() {
  return <button onClick={() => window.print()} className="btn btn-gold">Print / Save PDF</button>;
}
