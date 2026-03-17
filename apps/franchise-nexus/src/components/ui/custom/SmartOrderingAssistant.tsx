import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ShoppingCart, TrendingUp, AlertTriangle, ArrowRight, Check } from "lucide-react";

export interface OrderRecommendation {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  urgency: "critical" | "high" | "medium" | "low";
  reason: string;
  cost: number;
  supplier: string;
  leadTime: string;
  autoOrder?: boolean;
}

interface SmartOrderingAssistantProps {
  recommendations?: OrderRecommendation[];
  isLoading?: boolean;
  className?: string;
  onCreateOrder?: (items: OrderRecommendation[]) => void;
}

const SmartOrderingAssistant = ({
  recommendations = [],
  isLoading = false,
  className,
  onCreateOrder,
}: SmartOrderingAssistantProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === recommendations.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(recommendations.map((item) => item.id));
    }
  };

  const handleCreateOrder = () => {
    if (onCreateOrder) {
      const selectedRecommendations = recommendations.filter((item) =>
        selectedItems.includes(item.id)
      );
      onCreateOrder(selectedRecommendations);
    }
  };

  const getUrgencyDetails = (urgency: OrderRecommendation["urgency"]) => {
    switch (urgency) {
      case "critical":
        return { label: "Critical", color: "bg-alert-error text-white" };
      case "high":
        return { label: "High", color: "bg-alert-warning text-white" };
      case "medium":
        return { label: "Medium", color: "bg-alert-info text-white" };
      case "low":
        return { label: "Low", color: "bg-muted-foreground/30 text-foreground" };
      default:
        return { label: "Medium", color: "bg-alert-info text-white" };
    }
  };

  const totalCost = recommendations
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.cost, 0);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg font-semibold">Smart Ordering Assistant</CardTitle>
            <CardDescription>
              AI-generated order recommendations
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={handleSelectAll}
          >
            {selectedItems.length === recommendations.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col divide-y">
          {recommendations.length > 0 ? (
            recommendations.map((item) => {
              const urgencyDetails = getUrgencyDetails(item.urgency);
              const isSelected = selectedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "px-6 py-3 transition-colors",
                    isSelected ? "bg-muted/30" : "hover:bg-muted/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-medium">
                              {item.quantity} {item.unit}
                            </p>
                            <Badge className={urgencyDetails.color}>
                              {urgencyDetails.label}
                            </Badge>
                            {item.autoOrder && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Auto-order
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-medium">
                          ₱{item.cost.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.reason}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Supplier: {item.supplier}</span>
                        <span>Lead time: {item.leadTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No order recommendations at this time.</p>
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 mt-2 bg-muted/30">
            <div>
              <p className="text-sm font-medium">
                {selectedItems.length} of {recommendations.length} items selected
              </p>
              <p className="text-sm text-muted-foreground">
                Total: ₱{totalCost.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={handleCreateOrder}
              disabled={selectedItems.length === 0}
            >
              Create Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartOrderingAssistant;
