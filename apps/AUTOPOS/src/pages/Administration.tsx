
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, DollarSign, Truck, ClipboardList, BarChart3 } from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { PricingControl } from "@/components/admin/PricingControl";
import { SupplierDirectory } from "@/components/admin/SupplierDirectory";
import { PurchaseOrderCreator } from "@/components/admin/PurchaseOrderCreator";
import { ReportsDashboard } from "@/components/admin/ReportsDashboard";

const Administration = () => {
  const [userRole, setUserRole] = useState<string | null>("admin");
  const params = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(params.tab || "users");

  useEffect(() => {
    setActiveTab(params.tab || "users");
  }, [params.tab]);

  const handleLogin = (role: string) => {
    setUserRole(role);
    toast.success(`Logged in as ${role}`);
  };

  const handleLogout = () => {
    setUserRole(null);
    toast.success("Logged out successfully");
  };

  const handleTabChange = (value: string) => {
    navigate(`/admin/${value}`);
  };

  // Check if user has admin privileges
  useEffect(() => {
    if (userRole !== "admin" && userRole !== "owner") {
      toast.error("You don't have permission to access this page");
      navigate("/");
    }
  }, [userRole, navigate]);

  return (
    <AppLayout userRole={userRole} onLogin={handleLogin} onLogout={handleLogout}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Administration Console</h1>
        <p className="text-muted-foreground">Manage your system settings and configurations</p>
      </div>
      
      <Tabs value={activeTab as string} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="mr-2 h-4 w-4" />
            Pricing Control
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Truck className="mr-2 h-4 w-4" />
            Supplier Directory
          </TabsTrigger>
          <TabsTrigger value="purchase-orders">
            <ClipboardList className="mr-2 h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-0">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="pricing" className="mt-0">
          <PricingControl />
        </TabsContent>
        
        <TabsContent value="suppliers" className="mt-0">
          <SupplierDirectory />
        </TabsContent>
        
        <TabsContent value="purchase-orders" className="mt-0">
          <PurchaseOrderCreator />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-0">
          <ReportsDashboard />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Administration;
