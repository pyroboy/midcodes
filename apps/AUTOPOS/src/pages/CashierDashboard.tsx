import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Receipt, 
  Clock, 
  BarChart3,
  Package,
  Users,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

// Helper function to determine status classes
const getStatusClass = (status: string) => {
  switch(status) {
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
  }
};

const CashierDashboard = () => {
  const [userRole, setUserRole] = useState<string | null>("cashier");
  const params = useParams();
  const navigate = useNavigate();
  
  const [dailyStats, setDailyStats] = useState({
    totalSales: formatCurrency(2854.25),
    totalSalesTrend: "+15% vs last period",
    ordersProcessed: "12",
    pendingOrders: "4 pending approval",
    ordersTrend: "+8% vs last period",
    lowStockItems: "24",
    criticalItems: "6 critical",
    stockTrend: "-12% vs last period",
    activeCustomers: "47",
    customersTrend: "+5% vs last period"
  });
  
  const recentOrders = [
    {
      id: "ORD-5632",
      customer: "John Smith",
      time: "10:23 AM",
      status: "Completed",
      total: formatCurrency(345.00)
    },
    {
      id: "ORD-5631",
      customer: "Sarah Johnson",
      time: "9:41 AM",
      status: "In Progress",
      total: formatCurrency(182.50)
    }
  ];

  useEffect(() => {
    if (!params.tab) {
      navigate("/cashier/checkout", { replace: true });
    }
  }, [params.tab, navigate]);

  const handleLogin = (role: string) => {
    setUserRole(role);
    toast.success(`Logged in as ${role}`);
  };

  const handleLogout = () => {
    setUserRole(null);
    toast.success("Logged out successfully");
  };

  return (
    <AppLayout userRole={userRole} onLogin={handleLogin} onLogout={handleLogout}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cashier Dashboard</h1>
          <p className="text-muted-foreground">Monitor daily transactions and performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm bg-secondary/50 px-3 py-1.5 rounded-md">
            <Clock className="h-4 w-4 text-primary" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          title="Today's Sales" 
          value={dailyStats.totalSales}
          description={dailyStats.totalSalesTrend}
          trend={{ value: "15%", positive: true }}
          icon={<CreditCard className="h-5 w-5 text-primary" />}
          className="bg-white dark:bg-card hover:shadow-md transition-all duration-200"
        />
        
        <StatCard 
          title="New Orders" 
          value={dailyStats.ordersProcessed}
          description={dailyStats.pendingOrders}
          trend={{ value: "8%", positive: true }}
          icon={<Package className="h-5 w-5 text-primary" />}
          className="bg-white dark:bg-card hover:shadow-md transition-all duration-200"
        />
        
        <StatCard 
          title="Low Stock Items" 
          value={dailyStats.lowStockItems}
          description={dailyStats.criticalItems}
          trend={{ value: "12%", positive: false }}
          icon={<Package className="h-5 w-5 text-primary" />}
          className="bg-white dark:bg-card hover:shadow-md transition-all duration-200"
        />
        
        <StatCard 
          title="Active Customers" 
          value={dailyStats.activeCustomers}
          trend={{ value: "5%", positive: true }}
          icon={<Users className="h-5 w-5 text-primary" />}
          className="bg-white dark:bg-card hover:shadow-md transition-all duration-200"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-border/30 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Recent Orders</CardTitle>
            <CardDescription>Overview of the latest customer orders</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      {order.customer}
                    </TableCell>
                    <TableCell>{order.time}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusClass(order.status))}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{order.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="border-border/30 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Performance</CardTitle>
            <CardDescription>Weekly revenue overview</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-6">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <BarChart3 className="h-12 w-12 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CashierDashboard;
