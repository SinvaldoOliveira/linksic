import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminKiwify from "./pages/admin/Kiwify";
import Affiliates from "./pages/admin/Affiliates";
import SuperAdmin from "./pages/SuperAdmin";
import UserPublicPage from "./pages/UserPublicPage";
import PublicPage from "./pages/PublicPage";
import NotFound from "./pages/NotFound";
import ClubMyLinksss from "./pages/ClubMyLinksss";
import AffiliateRegister from "./pages/AffiliateRegister";
import Register from "./pages/Register";
import Catalog from "./pages/Catalog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/super" element={<SuperAdmin />} />
            <Route path="/admin/kiwify" element={<AdminKiwify />} />
            <Route path="/admin/affiliates" element={<Affiliates />} />
            {/* Rota antiga mantida por compatibilidade se necessário, mas a nova é PublicPage */}
            <Route path="/u/:slug" element={<PublicPage />} />
            <Route path="/club-mylinksss" element={<ClubMyLinksss />} />
            <Route path="/cadastro/:slug" element={<AffiliateRegister />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
