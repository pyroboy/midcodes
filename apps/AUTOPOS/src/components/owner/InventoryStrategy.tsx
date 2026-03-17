
import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingDown, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const InventoryStrategy = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [category, setCategory] = useState("all");
  
  // Mock inventory data
  const inventoryTrends = [
    { date: '2023-06', stock: 256, sales: 180, forecast: 190 },
    { date: '2023-07', stock: 248, sales: 200, forecast: 210 },
    { date: '2023-08', stock: 275, sales: 220, forecast: 230 },
    { date: '2023-09', stock: 302, sales: 190, forecast: 200 },
    { date: '2023-10', stock: 278, sales: 205, forecast: 215 },
    { date: '2023-11', stock: 295, sales: 230, forecast: 240 },
    { date: '2023-12', stock: 310, sales: 250, forecast: 260 },
  ];
  
  const criticalAlerts = [
    { id: 1, category: "Brakes", item: "Ceramic Brake Pads", stock: 2, reorderLevel: 10, trend: "decreasing", daysToStockout: 3 },
    { id: 2, category: "Engine", item: "Oil Filters Premium", stock: 5, reorderLevel: 15, trend: "stable", daysToStockout: 7 },
    { id: 3, category: "Electrical", item: "Alternator - Toyota", stock: 1, reorderLevel: 8, trend: "decreasing", daysToStockout: 2 },
    { id: 4, category: "Suspension", item: "Shock Absorbers", stock: 0, reorderLevel: 10, trend: "stockout", daysToStockout: 0 },
  ];
  
  const categoryPerformance = [
    { name: 'Brakes', turnover: 4.8, profit: 32, stock: 75 },
    { name: 'Engine', turnover: 3.2, profit: 28, stock: 68 },
    { name: 'Electrical', turnover: 5.1, profit: 25, stock: 82 },
    { name: 'Suspension', turnover: 2.9, profit: 30, stock: 45 },
    { name: 'Body Parts', turnover: 1.8, profit: 22, stock: 30 },
    { name: 'Fluids', turnover: 6.2, profit: 18, stock: 90 },
  ];
  
  const seasonalDemand = [
    { month: 'Jan', brakes: 65, engine: 80, electrical: 50 },
    { month: 'Feb', brakes: 70, engine: 75, electrical: 55 },
    { month: 'Mar', brakes: 85, engine: 70, electrical: 65 },
    { month: 'Apr', brakes: 90, engine: 65, electrical: 70 },
    { month: 'May', brakes: 95, engine: 60, electrical: 80 },
    { month: 'Jun', brakes: 100, engine: 70, electrical: 85 },
    { month: 'Jul', brakes: 90, engine: 85, electrical: 75 },
    { month: 'Aug', brakes: 85, engine: 90, electrical: 70 },
    { month: 'Sep', brakes: 80, engine: 85, electrical: 65 },
    { month: 'Oct', brakes: 75, engine: 75, electrical: 60 },
    { month: 'Nov', brakes: 85, engine: 80, electrical: 70 },
    { month: 'Dec', brakes: 95, engine: 90, electrical: 80 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory Strategy</h2>
          <p className="text-muted-foreground">Strategic inventory analysis and forecasting</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="brakes">Brakes</SelectItem>
              <SelectItem value="engine">Engine Parts</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="suspension">Suspension</SelectItem>
              <SelectItem value="body">Body Parts</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last quarter</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="forecast">With forecast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Inventory Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Inventory vs. Sales Trends</CardTitle>
          <CardDescription>Stock levels compared to sales volume with forecast</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inventoryTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="stock" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Stock Level" />
                <Area type="monotone" dataKey="sales" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Sales Volume" />
                <Line type="monotone" dataKey="forecast" stroke="#ff7300" name="Sales Forecast" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <Card className="lg:col-span-2 border-red-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <CardTitle className="text-lg font-medium">Critical Inventory Alerts</CardTitle>
              </div>
              <Badge variant="destructive">{criticalAlerts.length} Issues</Badge>
            </div>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-md p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-medium">{alert.item}</div>
                    <div className="text-sm text-muted-foreground">Category: {alert.category}</div>
                    <div className="flex items-center space-x-3 mt-2">
                      {alert.trend === "decreasing" && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {alert.trend === "stable" && <TrendingUp className="h-4 w-4 text-amber-500" />}
                      {alert.trend === "stockout" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      
                      <span className={`text-sm ${
                        alert.trend === "stockout" 
                          ? "text-red-600" 
                          : alert.daysToStockout <= 3 
                            ? "text-red-500" 
                            : "text-amber-500"
                      }`}>
                        {alert.trend === "stockout" 
                          ? "Currently out of stock" 
                          : `${alert.daysToStockout} days until stockout`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold">
                      {alert.stock} / {alert.reorderLevel}
                    </div>
                    <div className="w-24 mt-2">
                      <Progress value={(alert.stock / alert.reorderLevel) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button className="w-full">Generate Purchase Order for Critical Items</Button>
          </CardFooter>
        </Card>
        
        {/* Category Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Category Performance</CardTitle>
            <CardDescription>Turnover rate by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryPerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="turnover" fill="#8884d8" name="Turnover Rate" />
                  <Bar dataKey="profit" fill="#82ca9d" name="Profit Margin %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Seasonal Demand Patterns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Seasonal Demand Patterns</CardTitle>
          <CardDescription>Monthly demand trends for key categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seasonalDemand}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="brakes" stroke="#8884d8" name="Brakes" />
                <Line type="monotone" dataKey="engine" stroke="#82ca9d" name="Engine Parts" />
                <Line type="monotone" dataKey="electrical" stroke="#ffc658" name="Electrical" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
