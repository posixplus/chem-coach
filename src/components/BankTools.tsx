"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BankTools({ topics, selected }: { topics: { id: string; name: string; count: number }[]; selected: string }) {
  const router = useRouter();
  const [topic, setTopic] = useState(selected);
  const [n, setN] = useState(8);
  const [difficulty, setDifficulty] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topicId: topic, n, difficulty: difficulty || undefined }) });
      const j = await r.json();
      setMsg(r.ok ? `Added ${j.inserted} questions.` : `Failed: ${j.error}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="block text-xs text-stone-500">Topic</span>
        <select
          className="input"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            router.push(`/parent/bank?topic=${encodeURIComponent(e.target.value)}`);
          }}
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.count})
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="block text-xs text-stone-500">How many</span>
        <input className="input w-20" type="number" min={1} max={15} value={n} onChange={(e) => setN(Number(e.target.value))} />
      </label>
      <label className="text-sm">
        <span className="block text-xs text-stone-500">Difficulty</span>
        <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">Mixed</option>
          <option value="1">1 easy</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4 hard</option>
        </select>
      </label>
      <button className="btn-primary" onClick={generate} disabled={busy}>
        {busy ? "Generating (20 to 40 s)…" : "Generate with Claude"}
      </button>
      {msg && <p className="text-sm text-stone-600">{msg}</p>}
    </div>
  );
}
