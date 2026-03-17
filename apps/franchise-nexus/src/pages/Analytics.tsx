import MainLayout from "@/components/layout/MainLayout";
import LineChart from "@/components/ui/custom/LineChart";
import StatCard from "@/components/ui/custom/StatCard";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useNavigate } from "react-router-dom";
import RoleBasedWrapper from "@/components/ui/custom/RoleBasedWrapper";

// Mock data
const mockSalesData = [
  { name: "Jan", Revenue: 24000, Orders: 1200, Customers: 850 },
  { name: "Feb", Revenue: 26000, Orders: 1350, Customers: 900 },
  { name: "Mar", Revenue: 32000, Orders: 1500, Customers: 950 },
  { name: "Apr", Revenue: 28000, Orders: 1400, Customers: 920 },
  { name: "May", Revenue: 30000, Orders: 1550, Customers: 980 },
  { name: "Jun", Revenue: 35000, Orders: 1700, Customers: 1050 },
  { name: "Jul", Revenue: 38000, Orders: 1800, Customers: 1100 },
];

const mockProductsData = [
  { name: "Chicken Sandwiches", value: 35 },
  { name: "Coffee & Beverages", value: 25 },
  { name: "Burgers", value: 20 },
  { name: "Sides", value: 15 },
  { name: "Desserts", value: 5 },
];

const mockTopProducts = [
  { 
    id: "1", 
    name: "Signature Chicken Sandwich", 
    category: "Food", 
    sales: 1250, 
    revenue: 8750, 
    growth: 12.5 
  },
  { 
    id: "2", 
    name: "Cold Brew Coffee", 
    category: "Beverage", 
    sales: 980, 
    revenue: 4900, 
    growth: 8.2 
  },
  { 
    id: "3", 
    name: "Nashville Hot Chicken", 
    category: "Food", 
    sales: 875, 
    revenue: 6125, 
    growth: 15.3 
  },
  { 
    id: "4", 
    name: "French Fries", 
    category: "Sides", 
    sales: 1500, 
    revenue: 4500, 
    growth: 5.8 
  },
  { 
    id: "5", 
    name: "Vanilla Latte", 
    category: "Beverage", 
    sales: 920, 
    revenue: 4140, 
    growth: -2.3 
  },
];

// Colors for pie chart
const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Analytics & Reporting</h1>
            <p className="text-muted-foreground mt-1">
              View performance metrics and insights across your franchise.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select defaultValue="30">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
            <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner']}>
              <Button className="whitespace-nowrap bg-brand-600 hover:bg-brand-500">
                <BarChart2 className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </RoleBasedWrapper>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value="₱213,245"
            description="vs. last period"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            title="Total Orders"
            value="9,872"
            description="vs. last period"
            icon={<ShoppingBag className="h-4 w-4" />}
            trend={{ value: 5.1, isPositive: true }}
          />
          <StatCard
            title="Average Order Value"
            value="₱21.60"
            description="vs. last period"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={{ value: 2.8, isPositive: true }}
          />
          <StatCard
            title="Customer Retention"
            value="68.4%"
            description="vs. last period"
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 1.2, isPositive: false }}
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>
                Monthly revenue performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    title=""
                    data={mockSalesData}
                    categories={[
                      { name: "Revenue", color: "#0ea5e9" },
                      { name: "Orders", color: "#8b5cf6" },
                      { name: "Customers", color: "#10b981" },
                    ]}
                    className="h-full"
                  />
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Product Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>
                Distribution of sales across product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockProductsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {mockProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value}%`, 'Percentage']} 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Best performing menu items by revenue and sales volume
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-sm">
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTopProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{product.sales.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₱{product.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <span className={cn(
                          "text-sm font-medium flex items-center",
                          product.growth > 0 ? "text-alert-success" : "text-alert-error"
                        )}>
                          {product.growth > 0 ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {product.growth > 0 ? "+" : ""}{product.growth}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Time-Based Analysis */}
        <RoleBasedWrapper allowedRoles={['admin', 'franchiseOwner', 'storeManager']}>
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales Distribution</CardTitle>
              <CardDescription>
                Analyze sales patterns throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    title=""
                    data={[
                      { name: "6AM", Sales: 220, Customers: 15 },
                      { name: "7AM", Sales: 782, Customers: 42 },
                      { name: "8AM", Sales: 1290, Customers: 85 },
                      { name: "9AM", Sales: 1408, Customers: 70 },
                      { name: "10AM", Sales: 890, Customers: 45 },
                      { name: "11AM", Sales: 1300, Customers: 65 },
                      { name: "12PM", Sales: 2100, Customers: 105 },
                      { name: "1PM", Sales: 2450, Customers: 120 },
                      { name: "2PM", Sales: 1500, Customers: 75 },
                      { name: "3PM", Sales: 1100, Customers: 55 },
                      { name: "4PM", Sales: 950, Customers: 48 },
                      { name: "5PM", Sales: 1800, Customers: 90 },
                      { name: "6PM", Sales: 2200, Customers: 110 },
                      { name: "7PM", Sales: 1950, Customers: 98 },
                      { name: "8PM", Sales: 1600, Customers: 80 },
                      { name: "9PM", Sales: 950, Customers: 48 },
                      { name: "10PM", Sales: 450, Customers: 22 },
                    ]}
                    categories={[
                      { name: "Sales", color: "#0ea5e9" },
                      { name: "Customers", color: "#8b5cf6" },
                    ]}
                    className="h-full"
                  />
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </RoleBasedWrapper>
      </div>
    </MainLayout>
  );
};

export default Analytics;
