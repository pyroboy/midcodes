
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { ScaleIn } from "../ui/motion/Transitions";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) => {
  return (
    <ScaleIn>
      <Card className={cn("overflow-hidden border-border/30", className)}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold tracking-tight mb-1">{value}</h3>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend && (
                <div className="flex items-center mt-1">
                  <span
                    className={cn(
                      "text-xs font-medium flex items-center",
                      trend.positive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                    )}
                  >
                    {trend.positive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {trend.value}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">vs last period</span>
                </div>
              )}
            </div>
            {icon && (
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ScaleIn>
  );
};
