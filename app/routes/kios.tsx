import { useState } from "react";
import { api, toApiError, unwrap } from "../lib/api";
import type { Route } from "./+types/kios";
import type { TicketPublic } from "../lib/api";
import { Button } from "../components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Kios Antrian" }];
}

type Done = { ticket: TicketPublic; position: number };

export default function Kios() {
  const [loading, setLoading] = useState<1 | 2 | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function take(loket: 1 | 2) {
    setLoading(loket);
    setError(null);
    try {
      const res = await api().api.tickets.post({ loket });
      setDone(unwrap<Done>(res, "ticket", "Gagal mengambil nomor"));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : toApiError(e, "Gagal").message
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="container mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Ambil Nomor Antrian</h1>
        <p className="text-muted-foreground mt-1">Pilih loket tujuan</p>
      </div>

      {done ? (
        <div className="w-full rounded-2xl border p-8 text-center">
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Loket {done.ticket.loket} — nomor Anda
          </p>
          <p className="my-4 text-7xl font-bold tracking-tight tabular-nums">
            {done.ticket.code}
          </p>
          <p className="text-muted-foreground">
            Antrian ke-{done.position} di loket ini
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => setDone(null)}
          >
            Ambil Nomor Lain
          </Button>
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-4">
          {([1, 2] as const).map((loket) => (
            <Button
              key={loket}
              className="h-40 flex-col gap-1 text-2xl font-bold"
              disabled={loading !== null}
              onClick={() => void take(loket)}
            >
              Loket {loket}
              <span className="text-sm font-normal opacity-70">
                {loading === loket ? "Memproses…" : "Ambil nomor"}
              </span>
            </Button>
          ))}
        </div>
      )}

      {error && (
        <div className="w-full rounded-xl border border-red-300 bg-red-50 p-4 text-center text-red-700">
          {error}
        </div>
      )}
    </main>
  );
}
