import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2 } from "lucide-react";

export interface VarianceItem {
  id: string;
  name: string;
  expected: number;
  actual: number;
  unit: string;
  variance: number;
  variancePercent: number;
  cost: number;
  date: string;
  category: string;
  reviewed: boolean;
}

interface VarianceAnalysisProps {
  items?: VarianceItem[];
  isLoading?: boolean;
  className?: string;
  onReviewVariance?: (itemId: string) => void;
}

const VarianceAnalysis = ({
  items = [],
  isLoading = false,
  className,
  onReviewVariance,
}: VarianceAnalysisProps) => {
  // Calculate the top variance categories by absolute value
  const categoryVariances = items.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = { positive: 0, negative: 0 };
    }
    
    if (item.variance > 0) {
      acc[category].positive += item.cost;
    } else {
      acc[category].negative += Math.abs(item.cost);
    }
    
    return acc;
  }, {} as Record<string, { positive: number; negative: number }>);
  
  const categoryData = Object.entries(categoryVariances).map(
    ([category, { positive, negative }]) => ({
      name: category,
      positive,
      negative: -negative, // Negate for the chart
    })
  );

  // Sort items by variance amount (absolute value)
  const sortedItems = [...items].sort(
    (a, b) => Math.abs(b.variance) - Math.abs(a.variance)
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Variance Analysis</CardTitle>
        <CardDescription>
          Automated detection of inventory discrepancies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Detailed Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₱${Math.abs(value).toFixed(2)}`, value > 0 ? 'Surplus' : 'Shortage']}
                  />
                  <Bar dataKey="positive" name="Surplus" fill="#10b981" />
                  <Bar dataKey="negative" name="Shortage" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Variance</h4>
                    <p className="text-2xl font-bold">
                      ₱{Math.abs(items.reduce((sum, item) => sum + item.cost, 0)).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Shortage Cost</h4>
                    <p className="text-2xl font-bold text-alert-error">
                      ₱{Math.abs(items.filter(i => i.variance < 0).reduce((sum, item) => sum + item.cost, 0)).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Surplus Value</h4>
                    <p className="text-2xl font-bold text-alert-success">
                      ₱{Math.abs(items.filter(i => i.variance > 0).reduce((sum, item) => sum + item.cost, 0)).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="rounded-md border overflow-hidden">
              <div className="flex flex-col divide-y">
                {sortedItems.length > 0 ? (
                  sortedItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 hover:bg-muted/30 transition-colors",
                        item.reviewed ? "bg-muted/10" : ""
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.name}</h4>
                            <Badge 
                              className={cn(
                                item.variance < 0 
                                  ? "bg-alert-error text-white" 
                                  : "bg-alert-success text-white"
                              )}
                            >
                              {item.variance < 0 ? "Shortage" : "Surplus"}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>Category: {item.category}</span>
                            <span>Date: {item.date}</span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Expected:</span>
                              <span className="ml-1 font-medium">{item.expected} {item.unit}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Actual:</span>
                              <span className="ml-1 font-medium">{item.actual} {item.unit}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground">Variance:</span>
                              <span className={cn(
                                "ml-1 font-medium flex items-center",
                                item.variance < 0 ? "text-alert-error" : "text-alert-success"
                              )}>
                                {item.variance < 0 ? <ArrowDown className="mr-1 h-3 w-3" /> : <ArrowUp className="mr-1 h-3 w-3" />}
                                {Math.abs(item.variance)} {item.unit}
                                <span className="ml-1">({Math.abs(item.variancePercent)}%)</span>
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 text-sm">
                            <span className="text-muted-foreground">Cost Impact:</span>
                            <span className={cn(
                              "ml-1 font-medium",
                              item.variance < 0 ? "text-alert-error" : "text-alert-success"
                            )}>
                              ₱{Math.abs(item.cost).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {item.reviewed ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Reviewed
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReviewVariance && onReviewVariance(item.id)}
                            >
                              <AlertTriangle className="mr-1 h-4 w-4" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No variance data available.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default VarianceAnalysis;
