import { Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import SalesInterface from "./pages/SalesInterface";
import Inventory from "./pages/Inventory";
import Transactions from "./pages/Transactions";
import Administration from "./pages/Administration";
import NotFound from "./pages/NotFound";
import { Toaster } from "sonner";
import CashierDashboard from "./pages/CashierDashboard";
import OwnerCommandCenter from "./pages/OwnerCommandCenter";
import Settings from "./pages/Settings";
import Orders from "./pages/Orders";
import { PartRecognitionProvider } from "./contexts/PartRecognitionContext";

function App() {
  return (
    <PartRecognitionProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/sales" element={<SalesInterface />} />
        <Route path="/sales/products" element={<SalesInterface />} />
        <Route path="/sales/customers" element={<SalesInterface />} />
        <Route path="/sales/returns" element={<SalesInterface />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/:tab" element={<Inventory />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:tab" element={<Transactions />} />
        <Route path="/cashier" element={<CashierDashboard />} />
        <Route path="/cashier/:tab" element={<CashierDashboard />} />
        <Route path="/admin" element={<Administration />} />
        <Route path="/admin/:tab" element={<Administration />} />
        <Route path="/owner" element={<OwnerCommandCenter />} />
        <Route path="/owner/:tab" element={<OwnerCommandCenter />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" />
    </PartRecognitionProvider>
  );
}

export default App;
