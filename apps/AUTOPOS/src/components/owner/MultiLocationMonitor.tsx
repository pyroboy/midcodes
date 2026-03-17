
import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { LocationHeader } from "./locations/LocationHeader";
import { LocationCards } from "./locations/LocationCards";
import { SalesComparisonChart } from "./locations/SalesComparisonChart";
import { InventoryComparisonChart } from "./locations/InventoryComparisonChart";
import { PerformanceRadarChart } from "./locations/PerformanceRadarChart";
import { EfficiencyMetricsTable } from "./locations/EfficiencyMetricsTable";

export const MultiLocationMonitor = () => {
  const [viewType, setViewType] = useState("sales");
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <div className="space-y-6">
      <LocationHeader 
        viewType={viewType} 
        setViewType={setViewType} 
        timeRange={timeRange} 
        setTimeRange={setTimeRange} 
      />
      
      {/* Location Overview Cards */}
      <LocationCards />
      
      {/* Chart Views based on tab selection */}
      <div className="mt-6">
        <TabsContent value="sales" className={viewType === "sales" ? "block" : "hidden"}>
          <SalesComparisonChart />
        </TabsContent>
        
        <TabsContent value="inventory" className={viewType === "inventory" ? "block" : "hidden"}>
          <InventoryComparisonChart />
        </TabsContent>
        
        <TabsContent value="performance" className={viewType === "performance" ? "block" : "hidden"}>
          <PerformanceRadarChart />
        </TabsContent>
      </div>
      
      {/* Efficiency Metrics Table */}
      <EfficiencyMetricsTable />
    </div>
  );
};
