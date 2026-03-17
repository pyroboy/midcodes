
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OrderQueue } from "@/components/transactions/OrderQueue";
import { CheckoutProcess } from "@/components/transactions/CheckoutProcess";
import { ReceiptGenerator } from "@/components/transactions/ReceiptGenerator";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

const Orders = () => {
  const [userRole, setUserRole] = useState<string | null>("cashier");
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the active tab from the URL or default to "queue"
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || "queue";
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  const handleLogin = (role: string) => {
    setUserRole(role);
    toast.success(`Logged in as ${role}`);
  };

  const handleLogout = () => {
    setUserRole(null);
    toast.success("Logged out successfully");
  };

  const handleRefresh = () => {
    toast.info("Orders refreshed!", {
      description: "Latest order data has been loaded."
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL with the active tab
    navigate({
      pathname: location.pathname,
      search: `?tab=${value}`
    });
  };
  
  const handleProcessOrder = (orderId: string) => {
    toast.success(`Order ${orderId} moved to checkout`);
    // Switch to checkout tab when processing an order
    handleTabChange("checkout");
  };
  
  const handleOrderComplete = (orderId: string) => {
    toast.success(`Order ${orderId} completed`);
    // Switch to receipt tab when order is completed
    handleTabChange("receipt");
  };

  return (
    <AppLayout userRole={userRole} onLogin={handleLogin} onLogout={handleLogout}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and process customer orders</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => {}}
          >
            <Search className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <Tabs defaultValue="queue" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue">Order Queue</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
            <TabsTrigger value="receipt">Receipt Generator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="mt-6 px-4 pb-4">
            <OrderQueue onProcessOrder={handleProcessOrder} />
          </TabsContent>
          
          <TabsContent value="checkout" className="mt-6 px-4 pb-4">
            <CheckoutProcess onOrderComplete={handleOrderComplete} />
          </TabsContent>
          
          <TabsContent value="receipt" className="mt-6 px-4 pb-4">
            <ReceiptGenerator onReceiptGenerated={(orderId) => {
              toast.success(`Receipt generated for order ${orderId}`);
            }} />
          </TabsContent>
        </Tabs>
      </Card>
    </AppLayout>
  );
};

export default Orders;
