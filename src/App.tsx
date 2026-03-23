import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShellLayout from "@/components/AppShellLayout";
import ScrollToTop from "@/components/ScrollToTop";
import MemberRouteGate from "@/components/members/MemberRouteGate";
import { MemberSessionProvider } from "@/contexts/MemberSessionContext";
import Index from "./pages/Index";
import PoliticoDetalhe from "./pages/PoliticoDetalhe";
import BuscaPage from "./pages/BuscaPage";
import ViagensPage from "./pages/ViagensPage";
import RankingsPage from "./pages/RankingsPage";
import MembrosPage from "./pages/MembrosPage";
import MembrosLoginPage from "./pages/MembrosLoginPage";
import MembrosDashboardPage from "./pages/MembrosDashboardPage";
import MembrosCheckoutPage from "./pages/MembrosCheckoutPage";
import MembrosDocsPage from "./pages/MembrosDocsPage";
import TermosPage from "./pages/TermosPage";
import MetodologiaPage from "./pages/MetodologiaPage";
import DiretrizesPage from "./pages/DiretrizesPage";
import ContatoPage from "./pages/ContatoPage";
import NotFound from "./pages/NotFound";

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
        </BrowserRouter>
      </MemberSessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
