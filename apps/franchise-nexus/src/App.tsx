
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppSettingsProvider } from "@/context/AppSettingsContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Recipes from "./pages/Recipes";
import Analytics from "./pages/Analytics";
import POS from "./pages/POS";
import Franchise from "./pages/Franchise";
import Locations from "./pages/Locations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import RoleBasedWrapper from "./components/ui/custom/RoleBasedWrapper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager', 'kitchenStaff']} fallback={<Index />}>
                  <Dashboard />
                </RoleBasedWrapper>
              } />
              <Route path="/inventory" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager']} fallback={<Dashboard />}>
                  <Inventory />
                </RoleBasedWrapper>
              } />
              <Route path="/recipes" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager', 'kitchenStaff']} fallback={<Dashboard />}>
                  <Recipes />
                </RoleBasedWrapper>
              } />
              <Route path="/analytics" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager']} fallback={<Dashboard />}>
                  <Analytics />
                </RoleBasedWrapper>
              } />
              <Route path="/pos" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner']} fallback={<Dashboard />}>
                  <POS />
                </RoleBasedWrapper>
              } />
              <Route path="/franchise" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager']} fallback={<Dashboard />}>
                  <Franchise />
                </RoleBasedWrapper>
              } />
              <Route path="/locations" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager']} fallback={<Dashboard />}>
                  <Locations />
                </RoleBasedWrapper>
              } />
              <Route path="/settings" element={
                <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager']} fallback={<Dashboard />}>
                  <Settings />
                </RoleBasedWrapper>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
