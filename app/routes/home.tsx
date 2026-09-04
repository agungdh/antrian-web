import { Link } from "react-router";
import { Button } from "../components/ui/button";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Antrian" },
    { name: "description", content: "Sistem antrian loket" },
  ];
}

const menus = [
  {
    to: "/display",
    title: "Display",
    desc: "Layar TV: nomor dilayani & menunggu, live",
  },
  {
    to: "/kios",
    title: "Kios",
    desc: "Ambil nomor antrian baru",
  },
  {
    to: "/admin",
    title: "Admin",
    desc: "Kelola panggilan per loket",
  },
  {
    to: "/arsip",
    title: "Arsip",
    desc: "Riwayat tiket per tanggal",
  },
];

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Antrian</h1>
        <p className="text-muted-foreground mt-2">Pilih halaman</p>
      </div>
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {menus.map((m) => (
          <Button
            key={m.to}
            asChild
            variant="outline"
            className="h-auto flex-col items-start gap-1 p-6 text-left"
          >
            <Link to={m.to}>
              <span className="text-xl font-semibold">{m.title}</span>
              <span className="text-muted-foreground text-sm font-normal">
                {m.desc}
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </main>
  );
}
