
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Edit, 
  AlertTriangle, 
  BarChart3, 
  MapPin, 
  User 
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string;
  performance: "exceeding" | "meeting" | "below" | "critical";
  revenue: number;
  change: number;
  healthScore: number;
  status: string;
  manager: string;
}

interface LocationCardsProps {
  locations: Location[];
  selectedLocations: string[];
  onSelectLocation: (locationId: string) => void;
  onEdit: (locationId: string) => void;
  onHealthCheck: (locationId: string) => void;
  onPerformanceAnalysis: (locationId: string) => void;
}

const LocationCards = ({
  locations,
  selectedLocations,
  onSelectLocation,
  onEdit,
  onHealthCheck,
  onPerformanceAnalysis,
}: LocationCardsProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getPerformanceBadge = (performance: Location["performance"]) => {
    switch (performance) {
      case "exceeding":
        return <Badge className="bg-green-500 hover:bg-green-600">Exceeding</Badge>;
      case "meeting":
        return <Badge variant="default">Meeting</Badge>;
      case "below":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Below</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map((location) => (
        <Card key={location.id} className="overflow-hidden">
          <div className="relative">
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={selectedLocations.includes(location.id)}
                onCheckedChange={() => onSelectLocation(location.id)}
                className="bg-white border-gray-300"
              />
            </div>
            
            <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary/50" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-base">{location.name}</h3>
              {getStatusBadge(location.status)}
            </div>
            
            <p className="text-xs text-muted-foreground mb-4 flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> {location.address}
            </p>
            
            <div className="grid grid-cols-2 gap-4 my-3">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-medium">${location.revenue.toLocaleString()}</p>
                <span className={`text-xs ${location.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {location.change >= 0 ? "+" : ""}{location.change}%
                </span>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Health Score</p>
                <p className={`font-medium ${getHealthScoreColor(location.healthScore)}`}>
                  {location.healthScore}/100
                </p>
                <div className="mt-1">{getPerformanceBadge(location.performance)}</div>
              </div>
            </div>
            
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <User className="h-3 w-3 mr-1" /> Manager: {location.manager}
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted/30 p-3 flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => onEdit(location.id)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onHealthCheck(location.id)}>
                <AlertTriangle className="h-4 w-4" />
                <span className="sr-only">Health Check</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onPerformanceAnalysis(location.id)}>
                <BarChart3 className="h-4 w-4" />
                <span className="sr-only">Performance</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default LocationCards;
