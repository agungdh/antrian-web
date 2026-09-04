import { useState } from "react";
import { api, toApiError, unwrap } from "../lib/api";
import { formatTime, todayLocal } from "../lib/format";
import { Button } from "../components/ui/button";
import type { Route } from "./+types/arsip";
import type { TicketPublic } from "../lib/api";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Arsip Antrian" }];
}

type Archive = { date: string; tickets: TicketPublic[]; total: number };

const statusLabel: Record<string, string> = {
  WAITING: "Menunggu",
  SERVING: "Dilayani",
  DONE: "Selesai",
  SKIPPED: "Dilewati",
};

export default function Arsip() {
  const [date, setDate] = useState(todayLocal());
  const [loket, setLoket] = useState<"all" | "1" | "2">("all");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Archive | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const query: { date?: string; loket?: string } = {};
      if (date) query.date = date;
      if (loket !== "all") query.loket = loket;
      const res = await api().api.archive.get({ query });
      setData(unwrap<Archive>(res, "tickets", "Gagal memuat arsip"));
    } catch (e) {
      setError(e instanceof Error ? e.message : toApiError(e, "Gagal").message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Arsip</h1>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Tanggal
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Loket
          <select
            value={loket}
            onChange={(e) => setLoket(e.target.value as "all" | "1" | "2")}
            className="rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="all">Semua</option>
            <option value="1">Loket 1</option>
            <option value="2">Loket 2</option>
          </select>
        </label>
        <Button onClick={() => void load()} disabled={loading}>
          {loading ? "…" : "Tampilkan"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div>
          <p className="text-muted-foreground mb-2 text-sm tabular-nums">
            {data.date} — {data.total} tiket
          </p>
          {data.tickets.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada data.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm tabular-nums">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="p-2">Kode</th>
                    <th className="p-2">Loket</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Dibuat</th>
                    <th className="p-2">Dipanggil</th>
                    <th className="p-2">Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tickets.map((t) => (
                    <tr key={t.uuid} className="border-t">
                      <td className="p-2 font-semibold">{t.code}</td>
                      <td className="p-2">{t.loket}</td>
                      <td className="p-2">
                        {statusLabel[t.status] ?? t.status}
                      </td>
                      <td className="p-2">{formatTime(t.created_at)}</td>
                      <td className="p-2">{formatTime(t.called_at)}</td>
                      <td className="p-2">{formatTime(t.finished_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
