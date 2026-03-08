import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-grid-pattern px-4">
      <section className="w-full max-w-md rounded-3xl border border-white/60 bg-card/85 p-8 text-center shadow-elevated backdrop-blur-sm">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
          <Compass className="h-3.5 w-3.5 text-primary" />
          rota nao encontrada
        </span>
        <h1 className="mt-4 text-5xl font-extrabold text-gradient-primary">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A pagina <strong className="text-foreground">{location.pathname}</strong> nao existe neste projeto.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-hero px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          Voltar para a Home
        </Link>
      </section>
    </main>
  );
};

export default NotFound;
