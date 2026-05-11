import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Disclaimer from "@/components/Disclaimer";
import PulsingCircle from "@/components/ui/PulsingCircle";
import Index from "./pages/Index.tsx";

import Account from "./pages/Account.tsx";
import FireDashboard from "./pages/FireDashboard.tsx";
import FIREOnboardingPage from "./pages/FIREOnboardingPage.tsx";
import MoneyHealthPage from "./pages/MoneyHealthPage.tsx";
import TaxWizardPage from "./pages/TaxWizardPage.tsx";
import AiShalaPage from "./pages/AiShalaPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen relative">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />

                <Route path="/account" element={<Account />} />
                <Route path="/fire-onboarding" element={<FIREOnboardingPage />} />
                <Route path="/fire-dashboard" element={<FireDashboard />} />
                <Route path="/money-health" element={<MoneyHealthPage />} />
                <Route path="/tax-wizard" element={<TaxWizardPage />} />
                <Route path="/ai-shala" element={<AiShalaPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Disclaimer />
            
            {/* Global Component */}
            <PulsingCircle />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
