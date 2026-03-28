import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShellLayout from "@/components/AppShellLayout";
import ScrollToTop from "@/components/ScrollToTop";
import MemberRouteGate from "@/components/members/MemberRouteGate";
import { MemberSessionProvider } from "@/contexts/MemberSessionContext";

const Index = lazy(() => import("./pages/Index"));
const PoliticoDetalhe = lazy(() => import("./pages/PoliticoDetalhe"));
const BuscaPage = lazy(() => import("./pages/BuscaPage"));
const ViagensPage = lazy(() => import("./pages/ViagensPage"));
const RankingsPage = lazy(() => import("./pages/RankingsPage"));
const MembrosPage = lazy(() => import("./pages/MembrosPage"));
const MembrosLoginPage = lazy(() => import("./pages/MembrosLoginPage"));
const MembrosDashboardPage = lazy(() => import("./pages/MembrosDashboardPage"));
const MembrosCheckoutPage = lazy(() => import("./pages/MembrosCheckoutPage"));
const MembrosDocsPage = lazy(() => import("./pages/MembrosDocsPage"));
const TermosPage = lazy(() => import("./pages/TermosPage"));
const MetodologiaPage = lazy(() => import("./pages/MetodologiaPage"));
const DiretrizesPage = lazy(() => import("./pages/DiretrizesPage"));
const ContatoPage = lazy(() => import("./pages/ContatoPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 30 * 60_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MemberSessionProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense
            fallback={
              <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 text-sm text-muted-foreground">
                Carregando pagina...
              </div>
            }
          >
            <Routes>
              <Route element={<AppShellLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/politico/:id" element={<PoliticoDetalhe />} />
                <Route path="/busca" element={<BuscaPage />} />
                <Route path="/viagens" element={<ViagensPage />} />
                <Route path="/rankings" element={<RankingsPage />} />
                <Route path="/membros" element={<MembrosPage />} />
                <Route path="/membros/login" element={<MembrosLoginPage />} />
                <Route
                  path="/membros/dashboard"
                  element={
                    <MemberRouteGate>
                      <MembrosDashboardPage />
                    </MemberRouteGate>
                  }
                />
                <Route
                  path="/membros/checkout"
                  element={
                    <MemberRouteGate>
                      <MembrosCheckoutPage />
                    </MemberRouteGate>
                  }
                />
                <Route
                  path="/membros/docs"
                  element={
                    <MemberRouteGate>
                      <MembrosDocsPage />
                    </MemberRouteGate>
                  }
                />
                <Route path="/termos" element={<TermosPage />} />
                <Route path="/metodologia" element={<MetodologiaPage />} />
                <Route path="/diretrizes-editoriais" element={<DiretrizesPage />} />
                <Route path="/contato" element={<ContatoPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </MemberSessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
