
import { BarChart3, DollarSign, Package, ShoppingCart, Users, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "./StatCard";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { StaggeredChildren } from "../ui/motion/Transitions";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { SalesMetrics } from "../sales/SalesMetrics";

interface DashboardProps {
  userRole: string;
}

export const Dashboard = ({ userRole }: DashboardProps) => {
  const navigate = useNavigate();
  
  // Owner-specific stats
  const ownerStats = [
    {
      title: "Daily Revenue",
      value: "$5,824.75",
      trend: { value: "18%", positive: true },
      icon: <DollarSign className="h-5 w-5 text-primary" />,
    },
    {
      title: "Monthly Sales",
      value: "$148,320",
      description: "+12% from last month",
      trend: { value: "12%", positive: true },
      icon: <ShoppingCart className="h-5 w-5 text-primary" />,
    },
    {
      title: "Critical Inventory",
      value: "16",
      description: "8 need immediate action",
      trend: { value: "10%", positive: false },
      icon: <Package className="h-5 w-5 text-primary" />,
    },
    {
      title: "Staff Performance",
      value: "93%",
      trend: { value: "3%", positive: true },
      icon: <Users className="h-5 w-5 text-primary" />,
    },
  ];

  // Regular stats for other roles
  const regularStats = [
    {
      title: "Today's Sales",
      value: "$2,854.25",
      trend: { value: "15%", positive: true },
      icon: <DollarSign className="h-5 w-5 text-primary" />,
    },
    {
      title: "New Orders",
      value: "12",
      description: "4 pending approval",
      trend: { value: "8%", positive: true },
      icon: <ShoppingCart className="h-5 w-5 text-primary" />,
    },
    {
      title: "Low Stock Items",
      value: "24",
      description: "6 critical",
      trend: { value: "12%", positive: false },
      icon: <Package className="h-5 w-5 text-primary" />,
    },
    {
      title: "Active Customers",
      value: "47",
      trend: { value: "5%", positive: true },
      icon: <Users className="h-5 w-5 text-primary" />,
    },
  ];

  const stats = userRole === "owner" ? ownerStats : regularStats;

  // Owner action items
  const pendingActionItems = [
    { id: "PO-2023-0126", type: "purchase", title: "Large Inventory Restock", priority: "high", amount: "$12,500.00" },
    { id: "PR-2023-0089", type: "pricing", title: "Category Price Adjustment", priority: "medium", amount: "" },
    { id: "DI-2023-0034", type: "discount", title: "Commercial Client Discount", priority: "medium", amount: "" }
  ];

  // Recent orders - same for all roles
  const recentOrders = [
    { id: "ORD-5632", customer: "John Smith", time: "10:23 AM", status: "Completed", total: "$345.00" },
    { id: "ORD-5631", customer: "Sarah Johnson", time: "9:41 AM", status: "In Progress", total: "$182.50" },
    { id: "ORD-5630", customer: "Mike Williams", time: "Yesterday", status: "Pending", total: "$96.20" },
    { id: "ORD-5629", customer: "Emily Davis", time: "Yesterday", status: "Completed", total: "$213.75" },
    { id: "ORD-5628", customer: "Robert Brown", time: "Yesterday", status: "Completed", total: "$451.30" },
  ];

  // Sales associate dashboard
  if (userRole === "sales") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Associate Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your sales overview for today.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/sales")}
              className="bg-primary"
            >
              Go to Sales Interface
            </Button>
          </div>
        </div>

        {/* Use the SalesMetrics component we created earlier */}
        <SalesMetrics />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Recent Orders</CardTitle>
              <CardDescription>
                Overview of the latest customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Order</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Customer</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Time</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Status</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => (
                      <tr key={order.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{order.id}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.customer}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{order.time}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            order.status === "Completed" ? "bg-green-100 text-green-800" : 
                            order.status === "In Progress" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-blue-100 text-blue-800"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{order.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Performance</CardTitle>
              <CardDescription>
                Weekly revenue overview
              </CardDescription>
            </CardHeader>
            <CardContent className="grid place-items-center h-60 p-6">
              <div className="rounded-full h-40 w-40 bg-primary/10 grid place-items-center">
                <BarChart3 className="w-10 h-10 text-primary" />
                <p className="text-muted-foreground text-sm">Analytics chart will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Owner-specific dashboard vs standard dashboard
  if (userRole === "owner") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Owner Command Center</h1>
            <p className="text-muted-foreground">Welcome back! Here's your business overview for today.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/owner/performance")}
            >
              Full Analytics
            </Button>
            <Button 
              onClick={() => navigate("/owner/approvals")}
              className="bg-primary"
            >
              Pending Approvals
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggeredChildren>
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </StaggeredChildren>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Recent Orders</CardTitle>
              <CardDescription>
                Overview of the latest customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Order</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Customer</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Time</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Status</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => (
                      <tr key={order.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{order.id}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.customer}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{order.time}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            order.status === "Completed" ? "bg-green-100 text-green-800" : 
                            order.status === "In Progress" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-blue-100 text-blue-800"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{order.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Action Required
                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {pendingActionItems.length}
                </span>
              </CardTitle>
              <CardDescription>
                Items requiring your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActionItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-3">
                    <div className="flex gap-3">
                      {item.type === "purchase" && <Package className="h-5 w-5 text-blue-500" />}
                      {item.type === "pricing" && <DollarSign className="h-5 w-5 text-green-500" />}
                      {item.type === "discount" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      <div>
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.id}</p>
                        {item.amount && (
                          <p className="text-sm font-medium mt-1">{item.amount}</p>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      item.priority === "high" ? "bg-red-100 text-red-800" : 
                      "bg-amber-100 text-amber-800"
                    )}>
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate("/owner/approvals")}
                    className="text-sm"
                  >
                    View All Approvals
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular dashboard for non-owner roles
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggeredChildren>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </StaggeredChildren>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Orders</CardTitle>
            <CardDescription>
              Overview of the latest customer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Order</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Customer</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Time</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <tr key={order.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{order.id}</td>
                      <td className="whitespace-nowrap px-4 py-3">{order.customer}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{order.time}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          order.status === "Completed" ? "bg-green-100 text-green-800" : 
                          order.status === "In Progress" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-blue-100 text-blue-800"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Performance</CardTitle>
            <CardDescription>
              Weekly revenue overview
            </CardDescription>
          </CardHeader>
          <CardContent className="grid place-items-center h-60 p-6">
            <div className="rounded-full h-40 w-40 bg-primary/10 grid place-items-center">
              <BarChart3 className="w-10 h-10 text-primary" />
              <p className="text-muted-foreground text-sm">Analytics chart will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to conditionally join class names
function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
