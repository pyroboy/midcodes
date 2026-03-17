
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Location {
  id: string;
  name: string;
  performance: string;
  revenue: number;
  change: number;
}

interface PerformanceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
}

const PerformanceAnalysisModal = ({ isOpen, onClose, location }: PerformanceAnalysisModalProps) => {
  const [timeRange, setTimeRange] = useState("90days");

  if (!location) return null;

  // Mock KPI data
  const kpiData = [
    {
      name: "Total Revenue",
      value: `$${location.revenue.toLocaleString()}`,
      change: location.change,
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      name: "Average Transaction",
      value: "$28.73",
      change: 3.2,
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      name: "Customer Count",
      value: "15,487",
      change: -1.8,
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: "Items Per Transaction",
      value: "4.2",
      change: 0.5,
      icon: <ShoppingCart className="h-4 w-4" />,
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Analysis
          </DialogTitle>
          <DialogDescription>
            Detailed performance metrics for {location.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{location.name}</h3>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" title="Export Data">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpiData.map((kpi) => (
              <div key={kpi.name} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{kpi.name}</span>
                  {kpi.icon}
                </div>
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className={`flex items-center text-xs ${kpi.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {kpi.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {kpi.change >= 0 ? "+" : ""}{kpi.change}%
                </div>
              </div>
            ))}
          </div>
          
          <Tabs defaultValue="revenue">
            <TabsList className="w-full">
              <TabsTrigger value="revenue" className="flex-1">Revenue</TabsTrigger>
              <TabsTrigger value="customers" className="flex-1">Customers</TabsTrigger>
              <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
              <TabsTrigger value="staff" className="flex-1">Staff</TabsTrigger>
            </TabsList>
            
            <TabsContent value="revenue" className="space-y-4 pt-4">
              <div className="border rounded-md p-4 h-[200px] flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Revenue trend chart would be displayed here
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Revenue Breakdown</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="border rounded-md p-3">
                    <span className="text-xs text-muted-foreground">By Category</span>
                    <div className="h-[100px] flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Pie chart here</p>
                    </div>
                  </div>
                  <div className="border rounded-md p-3">
                    <span className="text-xs text-muted-foreground">By Day of Week</span>
                    <div className="h-[100px] flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Bar chart here</p>
                    </div>
                  </div>
                  <div className="border rounded-md p-3">
                    <span className="text-xs text-muted-foreground">By Time of Day</span>
                    <div className="h-[100px] flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Line chart here</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="customers" className="pt-4">
              <div className="border rounded-md p-4 h-[300px] flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Customer analysis would be displayed here
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="pt-4">
              <div className="border rounded-md p-4 h-[300px] flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Product analysis would be displayed here
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="staff" className="pt-4">
              <div className="border rounded-md p-4 h-[300px] flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Staff performance would be displayed here
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2 sm:ml-auto">
            <Calendar className="h-4 w-4" />
            Schedule Report
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PerformanceAnalysisModal;
