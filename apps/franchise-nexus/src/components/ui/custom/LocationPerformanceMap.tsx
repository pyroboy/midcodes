
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  performance: "exceeding" | "meeting" | "below" | "critical";
  revenue: number;
  change: number;
}

interface LocationPerformanceMapProps {
  locations?: Location[];
  isLoading?: boolean;
  className?: string;
  onSelectLocation?: (locationId: string) => void;
}

const LocationPerformanceMap = ({
  locations = [],
  isLoading = false,
  className,
  onSelectLocation,
}: LocationPerformanceMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // In a real app, this would use a mapping library like Google Maps, Mapbox, or Leaflet
  // This is a simplified placeholder that shows dots representing locations on a grid
  
  const handleLocationClick = (locationId: string) => {
    setSelectedLocation(locationId);
    if (onSelectLocation) {
      onSelectLocation(locationId);
    }
  };

  const getPerformanceColor = (performance: Location["performance"]) => {
    switch (performance) {
      case "exceeding":
        return "bg-alert-success";
      case "meeting":
        return "bg-alert-info";
      case "below":
        return "bg-alert-warning";
      case "critical":
        return "bg-alert-error";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Location Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div>
            <div
              ref={mapRef}
              className="relative bg-muted/30 border rounded-md h-[300px]"
            >
              <div className="absolute inset-0 p-4 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Map visualization will be implemented with a mapping library
                </p>
              </div>
              
              {/* This is a placeholder for location markers */}
              <div className="absolute inset-0">
                {locations.map((location, index) => {
                  // Create a pseudo-random position based on index
                  const left = `${10 + (index * 15) % 80}%`;
                  const top = `${20 + (index * 23) % 60}%`;
                  
                  return (
                    <div
                      key={location.id}
                      className={cn(
                        "absolute w-4 h-4 rounded-full cursor-pointer transform transition-all duration-200",
                        getPerformanceColor(location.performance),
                        selectedLocation === location.id ? "ring-2 ring-primary scale-125" : ""
                      )}
                      style={{ left, top }}
                      onClick={() => handleLocationClick(location.id)}
                      title={location.name}
                    />
                  );
                })}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {["exceeding", "meeting", "below", "critical"].map((status) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <div className={cn("w-3 h-3 rounded-full", getPerformanceColor(status as Location["performance"]))} />
                  <span className="capitalize">
                    {status === "exceeding" ? "Exceeding Goals" : 
                     status === "meeting" ? "Meeting Goals" : 
                     status === "below" ? "Below Target" : 
                     "Critical Performance"}
                  </span>
                </div>
              ))}
            </div>
            
            {selectedLocation && (
              <div className="mt-4 p-3 bg-muted/30 rounded-md">
                {locations
                  .filter((loc) => loc.id === selectedLocation)
                  .map((location) => (
                    <div key={location.id} className="flex flex-col gap-1">
                      <h4 className="font-medium">{location.name}</h4>
                      <div className="flex justify-between text-sm">
                        <span>Revenue: ${location.revenue.toLocaleString()}</span>
                        <Badge className={location.change >= 0 ? "bg-alert-success" : "bg-alert-error"}>
                          {location.change >= 0 ? "+" : ""}{location.change}%
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationPerformanceMap;
