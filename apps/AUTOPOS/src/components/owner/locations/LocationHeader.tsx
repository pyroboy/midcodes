
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Download, RefreshCw, BarChart3, PieChart, Radar as RadarIcon } from "lucide-react";

interface LocationHeaderProps {
  viewType: string;
  setViewType: (value: string) => void;
  timeRange: string;
  setTimeRange: (value: string) => void;
}

export const LocationHeader = ({ viewType, setViewType, timeRange, setTimeRange }: LocationHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Multi-Location Monitor</h2>
        <p className="text-muted-foreground">Compare performance across all store locations</p>
      </div>
      
      <div className="flex items-center gap-3">
        <Tabs value={viewType} onValueChange={setViewType} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales">
              <BarChart3 className="mr-2 h-4 w-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <PieChart className="mr-2 h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="performance">
              <RadarIcon className="mr-2 h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last quarter</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
};
