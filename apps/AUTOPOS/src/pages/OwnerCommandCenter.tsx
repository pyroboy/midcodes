
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart3, Package, ListChecks, Map, Settings } from "lucide-react";
import { PerformanceAnalytics } from "@/components/owner/PerformanceAnalytics";
import { InventoryStrategy } from "@/components/owner/InventoryStrategy";
import { ApprovalWorkflow } from "@/components/owner/ApprovalWorkflow";
import { MultiLocationMonitor } from "@/components/owner/MultiLocationMonitor";
import { SystemConfiguration } from "@/components/owner/SystemConfiguration";

const OwnerCommandCenter = () => {
  const [userRole, setUserRole] = useState<string | null>("owner");
  const params = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(params.tab || "performance");

  useEffect(() => {
    setActiveTab(params.tab || "performance");
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
    navigate(`/owner/${value}`);
  };

  // Check if user has owner privileges
  useEffect(() => {
    if (userRole !== "owner") {
      toast.error("You don't have permission to access this page");
      navigate("/");
    }
  }, [userRole, navigate]);

  return (
    <AppLayout userRole={userRole} onLogin={handleLogin} onLogout={handleLogout}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Owner Command Center</h1>
        <p className="text-muted-foreground">Complete oversight and control of your business</p>
      </div>
      
      <Tabs value={activeTab as string} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="performance">
            <BarChart3 className="mr-2 h-4 w-4" />
            Performance Analytics
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Inventory Strategy
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <ListChecks className="mr-2 h-4 w-4" />
            Approval Workflow
          </TabsTrigger>
          <TabsTrigger value="locations">
            <Map className="mr-2 h-4 w-4" />
            Multi-Location Monitor
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="mr-2 h-4 w-4" />
            System Configuration
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="mt-0">
          <PerformanceAnalytics />
        </TabsContent>
        
        <TabsContent value="inventory" className="mt-0">
          <InventoryStrategy />
        </TabsContent>
        
        <TabsContent value="approvals" className="mt-0">
          <ApprovalWorkflow />
        </TabsContent>
        
        <TabsContent value="locations" className="mt-0">
          <MultiLocationMonitor />
        </TabsContent>
        
        <TabsContent value="configuration" className="mt-0">
          <SystemConfiguration />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default OwnerCommandCenter;
