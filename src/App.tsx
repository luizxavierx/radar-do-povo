import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ApiRequestError } from "@/api/requestError";
import AppRouteFallback from "@/components/AppRouteFallback";
import AppShellLayout from "@/components/AppShellLayout";
import ScrollToTop from "@/components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const PoliticoDetalhe = lazy(() => import("./pages/PoliticoDetalhe"));
const BuscaPage = lazy(() => import("./pages/BuscaPage"));
const ViagensPage = lazy(() => import("./pages/ViagensPage"));
const RankingsPage = lazy(() => import("./pages/RankingsPage"));
const TermosPage = lazy(() => import("./pages/TermosPage"));
const MetodologiaPage = lazy(() => import("./pages/MetodologiaPage"));
const DiretrizesPage = lazy(() => import("./pages/DiretrizesPage"));
const ContatoPage = lazy(() => import("./pages/ContatoPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) {
    return false;
  }

  if (error instanceof ApiRequestError) {
    if (error.statusCode === 429) {
      return true;
    }

    if (typeof error.statusCode === "number" && error.statusCode >= 500) {
      return true;
    }
  }

  return error instanceof Error && error.message.startsWith("Timeout:");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60_000,
      gcTime: 60 * 60_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<AppRouteFallback />}>
          <Routes>
            <Route element={<AppShellLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/politico/:id" element={<PoliticoDetalhe />} />
              <Route path="/busca" element={<BuscaPage />} />
              <Route path="/viagens" element={<ViagensPage />} />
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/termos" element={<TermosPage />} />
              <Route path="/metodologia" element={<MetodologiaPage />} />
              <Route path="/diretrizes-editoriais" element={<DiretrizesPage />} />
              <Route path="/contato" element={<ContatoPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
