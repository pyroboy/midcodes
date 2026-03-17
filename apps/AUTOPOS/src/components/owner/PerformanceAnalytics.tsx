
import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/dashboard/StatCard";
import { StaggeredChildren } from "@/components/ui/motion/Transitions";
import { Download, RefreshCw, PlusCircle, CreditCard, TrendingUp, Users, ShoppingCart } from "lucide-react";

export const PerformanceAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [dataView, setDataView] = useState("sales");
  
  // Mock data for different metrics
  const kpiStats = [
    {
      title: "Total Revenue",
      value: "$125,430.20",
      trend: { value: "8.2%", positive: true },
      icon: <CreditCard className="h-5 w-5 text-primary" />,
    },
    {
      title: "Gross Profit",
      value: "$42,813.40",
      trend: { value: "5.1%", positive: true },
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
    },
    {
      title: "Customer Count",
      value: "1,248",
      trend: { value: "12.6%", positive: true },
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      title: "Average Order",
      value: "$102.40",
      trend: { value: "3.5%", positive: false },
      icon: <ShoppingCart className="h-5 w-5 text-primary" />,
    },
  ];
  
  const salesData = [
    { name: 'Mon', sales: 4000, profit: 2400, target: 4500 },
    { name: 'Tue', sales: 3000, profit: 1800, target: 4500 },
    { name: 'Wed', sales: 5000, profit: 3000, target: 4500 },
    { name: 'Thu', sales: 6000, profit: 3600, target: 4500 },
    { name: 'Fri', sales: 5500, profit: 3200, target: 4500 },
    { name: 'Sat', sales: 7500, profit: 4500, target: 4500 },
    { name: 'Sun', sales: 4200, profit: 2500, target: 4500 },
  ];

  const categoryData = [
    { name: 'Brakes', value: 28 },
    { name: 'Engine', value: 22 },
    { name: 'Electrical', value: 17 },
    { name: 'Suspension', value: 15 },
    { name: 'Body Parts', value: 10 },
    { name: 'Others', value: 8 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const staffPerformance = [
    { name: 'John', sales: 28500, target: 30000, commission: 1425 },
    { name: 'Sarah', sales: 42000, target: 35000, commission: 2100 },
    { name: 'Mike', sales: 19800, target: 25000, commission: 990 },
    { name: 'Lisa', sales: 31200, target: 30000, commission: 1560 },
    { name: 'Robert', sales: 36400, target: 35000, commission: 1820 },
  ];

  // Widget library - these would be configurable in a real system
  const activeWidgets = ['revenue', 'categories', 'staff'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          <p className="text-muted-foreground">Comprehensive view of business performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last quarter</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggeredChildren>
          {kpiStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </StaggeredChildren>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        {activeWidgets.includes('revenue') && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
                <CardDescription>Daily sales and profit analysis</CardDescription>
              </div>
              <Tabs defaultValue="bar" className="w-[160px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                  <TabsTrigger value="line">Line</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                    <Line type="monotone" dataKey="target" stroke="#ff7300" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Category Distribution */}
        {activeWidgets.includes('categories') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Category Distribution</CardTitle>
              <CardDescription>Sales by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Staff Performance */}
      {activeWidgets.includes('staff') && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium">Staff Performance</CardTitle>
                <CardDescription>Sales achievement vs targets</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Widget
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={staffPerformance}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Actual Sales" />
                  <Bar dataKey="target" fill="#82ca9d" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
