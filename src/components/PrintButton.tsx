"use client";

export default function PrintButton() {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()} title="Print, or choose Save as PDF in the print dialog">
      Print / Save as PDF
    </button>
  );
}
