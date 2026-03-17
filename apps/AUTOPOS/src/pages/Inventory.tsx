import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StockStatus } from "@/components/inventory/StockStatus";
import { ReturnsProcessing } from "@/components/inventory/ReturnsProcessing";
import { InventoryReceiving } from "@/components/inventory/InventoryReceiving";
import { ProductEntry } from "@/components/inventory/ProductEntry";
import { InventoryAdjustment } from "@/components/inventory/InventoryAdjustment";
import { StockFilters } from "@/components/inventory/StockStatusSidebar";
import { toast } from "sonner";
import { InventoryProvider } from "@/contexts/InventoryContext";

const Inventory = () => {
  const [userRole, setUserRole] = useState<string | null>("inventory");
  const [stockFilters, setStockFilters] = useState<StockFilters>({
    categories: [],
    manufacturers: [],
    priceRange: [0, 10000],
    stockStatus: [],
    locations: [],
    search: '',
    suppliers: [],
    partTypes: [],
    isAutoParts: false
  });
  const params = useParams();
  const navigate = useNavigate();
  const activeTab = params.tab || "stock";

  const handleLogin = (role: string) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
    toast.success("Logged out successfully");
  };

  const handleTabChange = (value: string) => {
    navigate(`/inventory/${value}`);
  };

  const handleStockFiltersChange = (newFilters: StockFilters) => {
    console.log("Inventory page received filter change:", newFilters);
    setStockFilters(newFilters);
  };

  useEffect(() => {
    console.log("Current stock filters in Inventory:", stockFilters);
  }, [stockFilters]);

  return (
    <InventoryProvider>
      <AppLayout 
        userRole={userRole} 
        onLogin={handleLogin} 
        onLogout={handleLogout}
        stockFilters={stockFilters}
        onStockFiltersChange={handleStockFiltersChange}
      >
        <h1 className="text-3xl font-bold mb-6">Inventory Control Center</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="stock">Stock Status</TabsTrigger>
            <TabsTrigger value="products">Product Entry</TabsTrigger>
            <TabsTrigger value="returns">Returns Processing</TabsTrigger>
            <TabsTrigger value="receiving">Receiving</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stock" className="mt-0">
            <StockStatus stockFilters={stockFilters} />
          </TabsContent>
          
          <TabsContent value="products" className="mt-0">
            <ProductEntry />
          </TabsContent>
          
          <TabsContent value="returns" className="mt-0">
            <ReturnsProcessing />
          </TabsContent>
          
          <TabsContent value="receiving" className="mt-0">
            <InventoryReceiving />
          </TabsContent>
          
          <TabsContent value="adjustments" className="mt-0">
            <InventoryAdjustment />
          </TabsContent>
        </Tabs>
      </AppLayout>
    </InventoryProvider>
  );
};

export default Inventory;
