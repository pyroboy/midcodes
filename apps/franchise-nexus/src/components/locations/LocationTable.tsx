
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  AlertTriangle, 
  BarChart3, 
  MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface LocationTableProps {
  locations: Location[];
  selectedLocations: string[];
  onSelectLocation: (locationId: string) => void;
  onEdit: (locationId: string) => void;
  onHealthCheck: (locationId: string) => void;
  onPerformanceAnalysis: (locationId: string) => void;
}

const LocationTable = ({
  locations,
  selectedLocations,
  onSelectLocation,
  onEdit,
  onHealthCheck,
  onPerformanceAnalysis,
}: LocationTableProps) => {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <span className="sr-only">Select</span>
          </TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Performance</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-center">Health Score</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.map((location) => (
          <TableRow key={location.id}>
            <TableCell>
              <Checkbox
                checked={selectedLocations.includes(location.id)}
                onCheckedChange={() => onSelectLocation(location.id)}
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{location.name}</span>
                <span className="text-xs text-muted-foreground">{location.address}</span>
              </div>
            </TableCell>
            <TableCell>{location.manager}</TableCell>
            <TableCell>{getStatusBadge(location.status)}</TableCell>
            <TableCell>{getPerformanceBadge(location.performance)}</TableCell>
            <TableCell className="text-right">
              <div className="flex flex-col items-end">
                <span>${location.revenue.toLocaleString()}</span>
                <span className={`text-xs ${location.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {location.change >= 0 ? "+" : ""}{location.change}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <span className={`font-medium ${getHealthScoreColor(location.healthScore)}`}>
                {location.healthScore}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(location.id)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onHealthCheck(location.id)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Health Check
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPerformanceAnalysis(location.id)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Performance Analysis
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default LocationTable;
