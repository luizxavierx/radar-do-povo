import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";

import SeoHead from "@/components/SeoHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-grid-pattern px-4">
      <SeoHead
        title="Página não encontrada | Radar do Povo"
        description="A rota solicitada não existe no Radar do Povo."
        path={location.pathname || "/404"}
        robots="noindex,nofollow"
      />
      <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 p-10 text-center shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[50px]" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-[50px]" />
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary shadow-sm backdrop-blur-md">
            <Compass className="h-4 w-4" />
            Rota não encontrada
          </span>
          <h1 className="mt-6 text-7xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">
            <span className="relative inline-block">
              <span className="absolute -inset-1 rounded-xl bg-primary/10 blur-xl"></span>
              <span className="relative bg-gradient-to-br from-primary via-primary/90 to-blue-600 bg-clip-text text-transparent">404</span>
            </span>
          </h1>
          <p className="mt-5 text-base font-medium leading-relaxed text-muted-foreground">
            A página <strong className="font-extrabold text-foreground">{location.pathname}</strong> não existe neste projeto ou pode ter sido movida.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform duration-300 hover:scale-105"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
