
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export interface ForecastItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  daysRemaining: number;
  reorderPoint: number;
  reorderQuantity: number;
  forecast: {
    date: string;
    projected: number;
    actual?: number;
  }[];
  trend: "increasing" | "decreasing" | "stable";
  alert?: string;
}

interface PredictiveInventoryIntelligenceProps {
  items?: ForecastItem[];
  isLoading?: boolean;
  className?: string;
}

const PredictiveInventoryIntelligence = ({
  items = [],
  isLoading = false,
  className,
}: PredictiveInventoryIntelligenceProps) => {
  const colorMap = {
    projected: "#3b82f6", // blue-500
    actual: "#10b981", // emerald-500
  };

  const getTrendIcon = (trend: ForecastItem["trend"]) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-alert-success" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-alert-error" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Predictive Inventory Intelligence</CardTitle>
        <CardDescription>
          AI-driven demand forecasting for the next 14 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : (
          <Tabs defaultValue="forecast">
            <TabsList className="mb-4">
              <TabsTrigger value="forecast">Usage Forecast</TabsTrigger>
              <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="forecast" className="space-y-6">
              <div className="h-[300px] w-full">
                {items.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={items[0].forecast}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-md p-3 shadow-md">
                                <p className="text-sm font-medium">{label}</p>
                                <div className="mt-2 space-y-1">
                                  {payload.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span>{entry.name}: </span>
                                      <span className="font-medium">
                                        {entry.value} {items[0].unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        name="Projected Usage"
                        stroke={colorMap.projected}
                        strokeWidth={2}
                        dot={{ r: 0 }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual Usage"
                        stroke={colorMap.actual}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.slice(0, 3).map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium truncate">
                          {item.name}
                        </CardTitle>
                        {getTrendIcon(item.trend)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <p className="text-2xl font-bold">
                            {item.currentStock} <span className="text-sm font-normal">{item.unit}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.daysRemaining} days remaining
                          </p>
                        </div>
                        {item.alert && (
                          <div className="flex items-center gap-1 text-alert-warning">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs">{item.alert}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={items.slice(0, 6).map(item => ({
                      name: item.name,
                      current: item.currentStock,
                      reorder: item.reorderPoint
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" name="Current Stock" fill="#3b82f6" />
                    <Bar dataKey="reorder" name="Reorder Point" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveInventoryIntelligence;
