import { useCallback, useState } from "react";
import { useQueueStream } from "../hooks/useQueueStream";
import { ensureAudio, playCall } from "../lib/sound";
import { formatTime } from "../lib/format";
import { Button } from "../components/ui/button";
import type { Route } from "./+types/display";
import type { LoketSnapshot } from "../lib/api";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Display Antrian" }];
}

function LoketPanel({
  loket,
  data,
}: {
  loket: number;
  data: LoketSnapshot;
}) {
  return (
    <section className="flex flex-1 flex-col rounded-2xl bg-neutral-900 p-6">
      <h2 className="text-2xl font-semibold text-neutral-400">
        Loket {loket}
      </h2>
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <span className="text-sm tracking-widest text-neutral-500 uppercase">
          Sedang dilayani
        </span>
        <span className="mt-2 text-8xl font-bold tracking-tight tabular-nums">
          {data.current ? data.current.code : "—"}
        </span>
        {data.current && (
          <span className="mt-2 text-neutral-400">
            dipanggil {formatTime(data.current.called_at)}
          </span>
        )}
      </div>
      <div className="border-t border-neutral-800 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm tracking-widest text-neutral-500 uppercase">
            Menunggu
          </span>
          <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm font-semibold tabular-nums">
            {data.waiting_count}
          </span>
        </div>
        {data.waiting.length === 0 ? (
          <p className="text-neutral-600">Kosong</p>
        ) : (
          <ol className="flex flex-wrap gap-2">
            {data.waiting.slice(0, 8).map((t) => (
              <li
                key={t.uuid}
                className="rounded-lg bg-neutral-800 px-3 py-1.5 text-lg font-semibold tabular-nums"
              >
                {t.code}
              </li>
            ))}
            {data.waiting.length > 8 && (
              <li className="px-2 py-1.5 text-neutral-500">
                +{data.waiting.length - 8} lagi
              </li>
            )}
          </ol>
        )}
      </div>
    </section>
  );
}

export default function Display() {
  const [soundOn, setSoundOn] = useState(true);

  const onCalled = useCallback(
    () => {
      if (soundOn) playCall();
    },
    [soundOn]
  );

  const { snapshot, connected, lastCall, error } = useQueueStream({
    onCalled,
  });

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-neutral-950 p-4 text-white">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Antrian</h1>
          {snapshot && (
            <p className="text-neutral-400 tabular-nums">
              {snapshot.date}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              connected
                ? "bg-green-900 text-green-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {connected ? "Live" : "Terputus"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800 hover:text-white"
            onClick={() => {
              ensureAudio();
              setSoundOn((v) => !v);
            }}
          >
            Suara: {soundOn ? "Nyala" : "Mati"}
          </Button>
        </div>
      </header>

      {lastCall && (
        <div
          key={`${lastCall.ticket.uuid}-${lastCall.at}`}
          className="rounded-2xl bg-amber-400 p-4 text-center text-neutral-950"
        >
          <p className="text-lg font-semibold">
            Panggilan{lastCall.recalled ? " ulang" : ""} — Loket{" "}
            {lastCall.loket}
          </p>
          <p className="text-5xl font-bold tabular-nums">
            {lastCall.ticket.code}
          </p>
        </div>
      )}

      {error && !snapshot && (
        <div className="rounded-2xl bg-red-950 p-6 text-center text-red-300">
          {error}
        </div>
      )}

      {snapshot ? (
        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <LoketPanel loket={1} data={snapshot.loket1} />
          <LoketPanel loket={2} data={snapshot.loket2} />
        </div>
      ) : (
        !error && (
          <div className="flex flex-1 items-center justify-center text-neutral-500">
            Memuat…
          </div>
        )
      )}
    </main>
  );
}
