import { useState } from "react";
import { useQueueStream } from "../hooks/useQueueStream";
import { api, toApiError, unwrap } from "../lib/api";
import { formatTime } from "../lib/format";
import { Button } from "../components/ui/button";
import type { Route } from "./+types/admin";
import type { LoketSnapshot } from "../lib/api";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Antrian" }];
}

type Action = "next" | "recall" | "skip" | "complete";

const actionLabel: Record<Action, string> = {
  next: "Panggil Berikutnya",
  recall: "Panggil Ulang",
  skip: "Lewati",
  complete: "Selesaikan",
};

function LoketAdmin({
  loket,
  data,
  busy,
  notice,
  onAction,
}: {
  loket: number;
  data: LoketSnapshot;
  busy: Action | null;
  notice: string | null;
  onAction: (loket: number, action: Action) => void;
}) {
  const actions: { id: Action; variant: "default" | "outline" | "secondary" | "destructive" }[] = [
    { id: "next", variant: "default" },
    { id: "recall", variant: "secondary" },
    { id: "skip", variant: "outline" },
    { id: "complete", variant: "outline" },
  ];
  return (
    <section className="rounded-2xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loket {loket}</h2>
        <span className="text-muted-foreground text-sm tabular-nums">
          {data.waiting_count} menunggu
        </span>
      </div>

      <div className="mb-4 rounded-xl bg-muted p-4 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          Sedang dilayani
        </p>
        <p className="text-5xl font-bold tabular-nums">
          {data.current ? data.current.code : "—"}
        </p>
        {data.current && (
          <p className="text-muted-foreground mt-1 text-sm">
            dipanggil {formatTime(data.current.called_at)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <Button
            key={a.id}
            variant={a.variant}
            disabled={busy !== null}
            onClick={() => onAction(loket, a.id)}
          >
            {busy === a.id ? "…" : actionLabel[a.id]}
          </Button>
        ))}
      </div>

      {notice && <p className="mt-3 text-sm text-amber-700">{notice}</p>}

      {data.waiting.length > 0 && (
        <div className="mt-4">
          <p className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
            Berikutnya
          </p>
          <ol className="flex flex-wrap gap-2">
            {data.waiting.slice(0, 6).map((t) => (
              <li
                key={t.uuid}
                className="rounded-lg bg-muted px-3 py-1.5 font-semibold tabular-nums"
              >
                {t.code}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

export default function Admin() {
  const { snapshot, connected, error } = useQueueStream();
  const [busy, setBusy] = useState<{ loket: number; action: Action } | null>(
    null
  );
  const [notice, setNotice] = useState<Record<number, string | null>>({
    1: null,
    2: null,
  });

  async function onAction(loket: number, action: Action) {
    setBusy({ loket, action });
    setNotice((n) => ({ ...n, [loket]: null }));
    try {
      const client = api().api.loket({ id: String(loket) });
      if (action === "next") unwrap(await client.next.post(), "current", "Gagal");
      else if (action === "recall")
        unwrap(await client.recall.post(), "current", "Gagal");
      else if (action === "skip")
        unwrap(await client.skip.post(), "skipped", "Gagal");
      else unwrap(await client.complete.post(), "done", "Gagal");
      // Snapshot terbaru ikut via SSE; ini fallback kalau SSE telat.
    } catch (e) {
      setNotice((n) => ({
        ...n,
        [loket]:
          e instanceof Error ? e.message : toApiError(e, "Gagal").message,
      }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="container mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            connected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {connected ? "Live" : "Terputus"}
        </span>
      </header>

      {error && !snapshot && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!snapshot ? (
        !error && <p className="text-muted-foreground">Memuat…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {([1, 2] as const).map((loket) => (
            <LoketAdmin
              key={loket}
              loket={loket}
              data={loket === 1 ? snapshot.loket1 : snapshot.loket2}
              busy={busy?.loket === loket ? busy.action : null}
              notice={notice[loket] ?? null}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </main>
  );
}
