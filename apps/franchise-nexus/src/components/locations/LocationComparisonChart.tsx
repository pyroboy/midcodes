
import { useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Location {
  id: string;
  name: string;
  performance: string;
  revenue: number;
  change: number;
  healthScore: number;
}

interface LocationComparisonChartProps {
  locations: Location[];
}

const LocationComparisonChart = ({ locations }: LocationComparisonChartProps) => {
  const maxRevenue = Math.max(...locations.map(loc => loc.revenue));
  
  const getLocationColor = (index: number) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500"];
    return colors[index % colors.length];
  };
  
  const getTextColor = (index: number) => {
    const colors = ["text-blue-500", "text-green-500", "text-purple-500"];
    return colors[index % colors.length];
  };

  return (
    <Tabs defaultValue="revenue">
      <TabsList className="w-full mb-2">
        <TabsTrigger value="revenue" className="flex-1">Revenue</TabsTrigger>
        <TabsTrigger value="health" className="flex-1">Health Score</TabsTrigger>
        <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
      </TabsList>
      
      <TabsContent value="revenue">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            {locations.map((location, index) => (
              <Badge key={location.id} variant="outline" className={`${getTextColor(index)} border-2`}>
                {location.name}
              </Badge>
            ))}
          </div>
          
          {locations.map((location, index) => (
            <div key={location.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{location.name}</span>
                <span>${location.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted h-4 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getLocationColor(index)}`} 
                  style={{ width: `${(location.revenue / maxRevenue) * 100}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="health">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            {locations.map((location, index) => (
              <Badge key={location.id} variant="outline" className={`${getTextColor(index)} border-2`}>
                {location.name}
              </Badge>
            ))}
          </div>
          
          {locations.map((location, index) => (
            <div key={location.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{location.name}</span>
                <span>{location.healthScore}/100</span>
              </div>
              <div className="w-full bg-muted h-4 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getLocationColor(index)}`} 
                  style={{ width: `${location.healthScore}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="growth">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            {locations.map((location, index) => (
              <Badge key={location.id} variant="outline" className={`${getTextColor(index)} border-2`}>
                {location.name}
              </Badge>
            ))}
          </div>
          
          {locations.map((location, index) => (
            <div key={location.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{location.name}</span>
                <span className={location.change >= 0 ? "text-green-600" : "text-red-600"}>
                  {location.change >= 0 ? "+" : ""}{location.change}%
                </span>
              </div>
              <div className="w-full bg-muted h-4 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full absolute top-0 ${location.change >= 0 ? "left-1/2" : "right-1/2"} ${getLocationColor(index)}`} 
                  style={{ 
                    width: `${Math.abs(location.change) * 2}%`, 
                    maxWidth: "50%" 
                  }} 
                />
                <div className="absolute top-0 left-1/2 w-px h-full bg-white/50" />
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default LocationComparisonChart;
