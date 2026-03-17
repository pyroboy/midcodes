import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrderQueue } from "@/components/transactions/OrderQueue";
import { OrderRetrieval } from "@/components/transactions/OrderRetrieval";
import { CheckoutProcess } from "@/components/transactions/CheckoutProcess";
import { ReceiptGenerator } from "@/components/transactions/ReceiptGenerator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

const Transactions = () => {
  const [userRole, setUserRole] = useState<string | null>("cashier");
  const params = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(params.tab || "queue");
  const [hasNotifications, setHasNotifications] = useState({
    queue: true,
    retrieval: false,
    editor: false,
    checkout: false,
    receipt: false
  });

  useEffect(() => {
    setActiveTab(params.tab || "queue");
  }, [params.tab]);

  const handleLogin = (role: string) => {
    setUserRole(role);
    toast("Logged in as " + role);
  };

  const handleLogout = () => {
    setUserRole(null);
    toast.success("Logged out successfully");
  };

  const handleTabChange = (value: string) => {
    navigate(`/transactions/${value}`);
    setHasNotifications(prev => ({...prev, [value]: false}));
  };

  const simulateNewOrder = () => {
    toast.info("New order received!", {
      description: "Order #1247 has been added to the queue."
    });
    setHasNotifications(prev => ({...prev, queue: true}));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      simulateNewOrder();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout userRole={userRole} onLogin={handleLogin} onLogout={handleLogout}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction Processing Hub</h1>
          <p className="text-muted-foreground">Manage customer orders and checkout process</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Today: {new Date().toLocaleDateString()}</span>
          <span className="mx-1">|</span>
          <Clock className="h-4 w-4" />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      <Tabs value={activeTab as string} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="queue" className="relative">
            Order Queue
            {hasNotifications.queue && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="retrieval">Order Retrieval</TabsTrigger>
          <TabsTrigger value="checkout" className="relative">
            Checkout Process
            {hasNotifications.checkout && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="receipt">Receipt Generator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="mt-0">
          <OrderQueue onProcessOrder={(orderId) => {
            toast.success(`Order ${orderId} moved to checkout`);
            setHasNotifications(prev => ({...prev, checkout: true}));
            setTimeout(() => navigate("/transactions/checkout"), 1000);
          }} />
        </TabsContent>
        
        <TabsContent value="retrieval" className="mt-0">
          <OrderRetrieval onOrderSelect={(orderId) => {
            toast.success(`Order #${orderId} selected for editing`);
            setTimeout(() => navigate("/transactions/editor"), 1000);
          }} />
        </TabsContent>
        
        <TabsContent value="checkout" className="mt-0">
          <CheckoutProcess onOrderComplete={(orderId) => {
            toast.success(`Order #${orderId} has been completed`);
            setHasNotifications(prev => ({...prev, receipt: true}));
            setTimeout(() => navigate("/transactions/receipt"), 1000);
          }} />
        </TabsContent>
        
        <TabsContent value="receipt" className="mt-0">
          <ReceiptGenerator onReceiptGenerated={(orderId) => {
            toast.success(`Receipt for order #${orderId} has been generated`);
          }} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Transactions;
