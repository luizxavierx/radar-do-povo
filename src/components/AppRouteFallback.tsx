import { Activity, BarChart3, Search, Users } from "lucide-react";

const AppRouteFallback = () => {
  return (
    <div className="min-h-screen bg-grid-pattern">
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-full lg:w-72 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-[linear-gradient(180deg,#f7fbfd_0%,#ffffff_18%,#f9fbfc_100%)]">
        <div className="border-b border-sidebar-border/80 px-5 py-5">
          <div className="h-12 w-28 animate-pulse rounded-2xl bg-muted" />
          <div className="mt-4 overflow-hidden rounded-[24px] border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-cyan-50 p-4">
            <div className="h-3 w-28 animate-pulse rounded-full bg-primary/15" />
            <div className="mt-3 h-4 w-44 animate-pulse rounded-full bg-muted" />
            <div className="mt-2 h-4 w-36 animate-pulse rounded-full bg-muted" />
          </div>
        </div>

        <div className="space-y-6 px-3 py-5">
          <div>
            <div className="mb-3 h-3 w-24 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              {[Users, Activity, BarChart3].map((Icon, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/70 px-4 py-3"
                >
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
                    <div className="h-2.5 w-20 animate-pulse rounded-full bg-muted/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-20 sm:px-6 sm:pt-24 lg:pt-10">
          <section className="animate-fade-up relative overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,248,255,0.9),rgba(255,249,239,0.84))] px-7 py-8 shadow-elevated sm:px-10 sm:py-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="animate-float-wide absolute -right-8 top-6 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="animate-float-slow absolute left-[18%] top-[12%] h-32 w-32 rounded-full border border-primary/10" />
              <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div>
                <div className="h-7 w-40 animate-pulse rounded-full bg-primary/10" />
                <div className="mt-4 h-12 w-[28rem] max-w-full animate-pulse rounded-[1.25rem] bg-muted" />
                <div className="mt-3 h-5 w-[32rem] max-w-full animate-pulse rounded-full bg-muted/90" />
              </div>

              <div className="space-y-3 xl:justify-self-end">
                <div className="h-10 w-32 animate-pulse rounded-2xl bg-white/80 shadow-card" />
                <div className="h-10 w-28 animate-pulse rounded-2xl bg-white/80 shadow-card" />
              </div>
            </div>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
              {[Search, Activity, Users].map((Icon, index) => (
                <div
                  key={index}
                  className="rounded-[1.4rem] border border-white/80 bg-white/65 px-4 py-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <div className="h-3 w-20 animate-pulse rounded-full bg-primary/10" />
                  </div>
                  <div className="mt-3 h-5 w-28 animate-pulse rounded-full bg-muted" />
                  <div className="mt-2 h-3 w-32 animate-pulse rounded-full bg-muted/80" />
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 animate-fade-up rounded-3xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(255,255,255,0.98))] px-5 py-5 shadow-card">
            <div className="h-7 w-36 animate-pulse rounded-full bg-amber-100/80" />
            <div className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,rgba(14,112,118,0.98),rgba(18,140,146,0.95))] px-4 py-8">
              <div className="mx-auto flex max-w-max gap-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="h-12 w-8 animate-pulse rounded-xl bg-slate-950/40 sm:h-14 sm:w-9" />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AppRouteFallback;
