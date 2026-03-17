import { useState, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Create proper icon setup for Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  performance: "exceeding" | "meeting" | "below" | "critical";
  revenue: number;
  change: number;
  status: string;
}

interface LocationsMapProps {
  locations: Location[];
}

// Bohol, Philippines center coordinates
const BOHOL_CENTER = { lat: 9.8500, lng: 124.1614 };

// Generate random locations around Bohol
const generateRandomLocations = (count: number): Location[] => {
  const randomLocations: Location[] = [];
  const performanceOptions: Location["performance"][] = ["exceeding", "meeting", "below", "critical"];
  
  for (let i = 0; i < count; i++) {
    // Random offset from center (-0.2 to 0.2 degrees)
    const latOffset = (Math.random() - 0.5) * 0.4;
    const lngOffset = (Math.random() - 0.5) * 0.4;
    
    randomLocations.push({
      id: `random-${i}`,
      name: `Random Location ${i + 1}`,
      lat: BOHOL_CENTER.lat + latOffset,
      lng: BOHOL_CENTER.lng + lngOffset,
      performance: performanceOptions[Math.floor(Math.random() * performanceOptions.length)],
      revenue: Math.floor(Math.random() * 400000) + 50000,
      change: Math.floor(Math.random() * 40) - 20,
      status: Math.random() > 0.7 ? "warning" : "active"
    });
  }
  
  return randomLocations;
};

// Generate 8 random locations
const randomLocations = generateRandomLocations(8);

// Custom component to center the map when selected location changes
function MapCenter({ position, zoom }: { position: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, zoom);
  }, [map, position, zoom]);
  return null;
}

// Extend MarkerProps interface to include icon prop
declare module 'react-leaflet' {
  interface MarkerProps {
    icon?: L.Icon | L.DivIcon;
  }

  interface MapContainerProps {
    center?: [number, number];
    zoom?: number;
    scrollWheelZoom?: boolean;
    whenCreated?: (map: L.Map) => void;
  }

  interface TileLayerProps {
    attribution?: string;
  }
}

// Custom marker component for different performance types
const CustomMarker = ({ location, isSelected, onClick }: { 
  location: Location; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const getMarkerColor = (performance: Location["performance"]) => {
    switch (performance) {
      case "exceeding": return "#22c55e"; // green-500
      case "meeting": return "#3b82f6"; // blue-500 
      case "below": return "#eab308"; // yellow-500
      case "critical": return "#ef4444"; // red-500
      default: return "#6b7280"; // gray-500
    }
  };

  // Create custom icon with SVG, explicitly typed as L.DivIcon
  const createCustomIcon = (): L.DivIcon => {
    const color = getMarkerColor(location.performance);
    const size = isSelected ? 36 : 28;
    const strokeWidth = isSelected ? 3 : 2;
    
    // Create SVG icon as a string
    const svgIcon = encodeURI(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${isSelected ? color : 'white'}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    `).replace('#', '%23');
    
    return new L.DivIcon({
      html: `<img src="data:image/svg+xml;utf8,${svgIcon}" style="pointer-events: none;" />`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    });
  };

  return (
    <Marker 
      position={[location.lat, location.lng]} 
      icon={createCustomIcon()}
      eventHandlers={{ click: onClick }}
    />
  );
};

const LocationsMap = ({ locations }: LocationsMapProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  
  // Combine provided locations with random locations
  const allLocations = [...locations, ...randomLocations];
  
  // Find the selected location data
  const selectedLocationData = selectedLocation 
    ? allLocations.find(loc => loc.id === selectedLocation) 
    : null;

  const handleLocationClick = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const getPerformanceColor = (performance: Location["performance"]) => {
    switch (performance) {
      case "exceeding":
        return "text-green-500";
      case "meeting":
        return "text-blue-500";
      case "below":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  // Setting up a map loaded state with useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Give map a second to load

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="w-full">
      <div className="relative border rounded-md h-[400px] w-full overflow-hidden">
        <MapContainer
          center={[BOHOL_CENTER.lat, BOHOL_CENTER.lng]} 
          zoom={10} 
          style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
          scrollWheelZoom={false}
          whenCreated={(map: L.Map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Place markers for all locations */}
          {allLocations.map((location) => (
            <CustomMarker
              key={location.id}
              location={location}
              isSelected={selectedLocation === location.id}
              onClick={() => handleLocationClick(location.id)}
            />
          ))}
          
          {/* Center the map on selected location */}
          {selectedLocationData && (
            <MapCenter 
              position={[selectedLocationData.lat, selectedLocationData.lng]} 
              zoom={14} 
            />
          )}
          
          {/* Display popup for selected location */}
          {selectedLocationData && (
            <Popup
              position={[selectedLocationData.lat, selectedLocationData.lng]}
              eventHandlers={{
                close: () => setSelectedLocation(null)
              }}
            >
              <div className="p-2 min-w-[150px]">
                <h4 className="font-medium">{selectedLocationData.name}</h4>
                <div className="flex flex-col gap-1 text-sm">
                  <span>Revenue: ${selectedLocationData.revenue.toLocaleString()}</span>
                  <div className="flex items-center">
                    <span>Change: </span>
                    <Badge variant={selectedLocationData.change >= 0 ? "default" : "destructive"} className={cn(
                      selectedLocationData.change >= 0 ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                    )}>
                      {selectedLocationData.change >= 0 ? "+" : ""}{selectedLocationData.change}%
                    </Badge>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </MapContainer>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {["exceeding", "meeting", "below", "critical"].map((status) => (
          <div key={status} className="flex items-center gap-2 text-xs">
            <MapPin className={cn("w-4 h-4", getPerformanceColor(status as Location["performance"]))} />
            <span className="capitalize">
              {status === "exceeding" ? "Exceeding Goals" : 
               status === "meeting" ? "Meeting Goals" : 
               status === "below" ? "Below Target" : 
               "Critical Performance"}
            </span>
          </div>
        ))}
      </div>
      
      {selectedLocation && !selectedLocationData && (
        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          {allLocations
            .filter((loc) => loc.id === selectedLocation)
            .map((location) => (
              <div key={location.id} className="flex flex-col gap-1">
                <h4 className="font-medium">{location.name}</h4>
                <div className="flex justify-between text-sm">
                  <span>Revenue: ${location.revenue.toLocaleString()}</span>
                  <Badge variant={location.change >= 0 ? "default" : "destructive"} className={cn(
                    location.change >= 0 ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                  )}>
                    {location.change >= 0 ? "+" : ""}{location.change}%
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default LocationsMap;