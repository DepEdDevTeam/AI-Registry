import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LandingLayout from "./components/LandingLayout";
import RouteLoader from "./components/RouteLoader";
import Home from "./pages/Home";

const AITechnology = lazy(() => import("./pages/AITechnology"));
const AITechDetail = lazy(() => import("./pages/AITechDetail"));
const AIPartners = lazy(() => import("./pages/AIPartners"));
const Governance = lazy(() => import("./pages/Governance"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Partners = lazy(() => import("./pages/Partners"));
const Proposals = lazy(() => import("./pages/Proposals"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const PartnerOnboardingLandingPage = lazy(() => import("./pages/partner/PartnerOnboardingLandingPage"));
const PartnerInitiationPage = lazy(() => import("./pages/partner/PartnerInitiationPage"));
const PartnerAccountSetupPage = lazy(() => import("./pages/partner/PartnerAccountSetupPage"));
const ProviderProfilePage = lazy(() => import("./pages/partner/ProviderProfilePage"));
const PartnerStatusPage = lazy(() => import("./pages/partner/PartnerStatusPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route element={<LandingLayout />}>
              <Route path="/" element={<Home />} />
            </Route>
            <Route element={<Layout />}>
              <Route path="/ai-technology" element={<AITechnology />} />
              <Route path="/ai-technology/:id" element={<AITechDetail />} />
              <Route path="/ai-partners" element={<AIPartners />} />
              <Route path="/partners/:partnerKey" element={<Partners />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/partner/status" element={<PartnerStatusPage />} />
            </Route>
            <Route path="/partner/onboarding" element={<PartnerOnboardingLandingPage />} />
            <Route path="/partner/initiation" element={<PartnerInitiationPage />} />
            <Route path="/partner/account-setup" element={<PartnerAccountSetupPage />} />
            <Route path="/partner/provider-profile" element={<ProviderProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
