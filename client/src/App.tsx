import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { useEffect, lazy, Suspense } from "react";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { ChatWidget } from "@/components/chat-widget";

// Lazy-load all pages except homepage for faster initial load
const PricingPage = lazy(() => import("@/pages/pricing"));
const HowItWorksPage = lazy(() => import("@/pages/how-it-works"));
const HighRiskPage = lazy(() => import("@/pages/high-risk"));
const ContactPage = lazy(() => import("@/pages/contact"));
const ConnectPage = lazy(() => import("@/pages/connect"));
const FaqPage = lazy(() => import("@/pages/services-faq"));
const LeadMagnetPage = lazy(() => import("@/pages/lead-magnet"));
const FreeGuidesPage = lazy(() => import("@/pages/free-guides"));
const AiConfigPage = lazy(() => import("@/pages/ai-config"));
const StatementReviewPage = lazy(() => import("@/pages/statement-review"));
const PartnerAgreementPage = lazy(() => import("@/pages/partner-agreement"));
const ReferralPage = lazy(() => import("@/pages/referral"));
const ApplyPage = lazy(() => import("@/pages/apply"));
const EquipmentPage = lazy(() => import("@/pages/equipment"));
const PartnerProgramPage = lazy(() => import("@/pages/partner-program"));
const IndustryPage = lazy(() => import("@/pages/industry"));
const IslandPage = lazy(() => import("@/pages/island"));

const isAdminSubdomain = window.location.hostname.startsWith("admin.");
const isProgramSubdomain = window.location.hostname.startsWith("program.");

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);

  return null;
}

function MainRouter() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/how-it-works" component={HowItWorksPage} />
          <Route path="/high-risk" component={HighRiskPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/connect" component={ConnectPage} />
          <Route path="/free-guides" component={FreeGuidesPage} />
          <Route path="/free/:slug" component={LeadMagnetPage} />
          <Route path="/statement-review" component={StatementReviewPage} />
          <Route path="/partner-agreement" component={PartnerAgreementPage} />
          <Route path="/refer" component={ReferralPage} />
          <Route path="/apply" component={ApplyPage} />
          <Route path="/equipment" component={EquipmentPage} />
          <Route path="/industries/:industry" component={IndustryPage} />
          <Route path="/locations/:island" component={IslandPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function AdminRouter() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/" component={AiConfigPage} />
        <Route component={AiConfigPage} />
      </Switch>
    </Suspense>
  );
}

function ProgramRouter() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/" component={PartnerProgramPage} />
        <Route component={PartnerProgramPage} />
      </Switch>
    </Suspense>
  );
}

function App() {
  if (isAdminSubdomain) {
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <AdminRouter />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  if (isProgramSubdomain) {
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <ProgramRouter />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <MainRouter />
          <ChatWidget />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
