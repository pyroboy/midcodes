
import React from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Clock 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

export const SalesMetrics: React.FC = () => {
  // Mock data for sales metrics
  const metrics = [
    {
      title: "Today's Sales",
      value: formatCurrency(2854.25),
      trend: { value: "15%", positive: true },
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
    },
    {
      title: "Current Orders",
      value: "12",
      description: "4 pending shipment",
      trend: { value: "8%", positive: true },
      icon: <ShoppingCart className="h-4 w-4 text-primary" />,
    },
    {
      title: "Active Customers",
      value: "47",
      trend: { value: "5%", positive: true },
      icon: <Users className="h-4 w-4 text-primary" />,
    },
    {
      title: "Recent Activity",
      value: "10 min ago",
      description: "Last order completed",
      icon: <Clock className="h-4 w-4 text-primary" />,
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="overflow-hidden border-border/30 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <h3 className="text-xl font-bold tracking-tight mb-1">{metric.value}</h3>
                {metric.description && (
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                )}
                {metric.trend && (
                  <div className="flex items-center mt-1">
                    <span
                      className={cn(
                        "text-xs font-medium flex items-center",
                        metric.trend.positive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                      )}
                    >
                      {metric.trend.positive ? "↑" : "↓"} {metric.trend.value}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">vs yesterday</span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                {metric.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
