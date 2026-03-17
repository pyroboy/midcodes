import { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Search, 
  AlertTriangle, 
  Map, 
  Download, 
  BarChart, 
  Layers, 
  Table, 
  Grid2X2 
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import LocationPerformanceMap from "@/components/ui/custom/LocationPerformanceMap";
import LocationsMap from "@/components/locations/LocationsMap";
import LocationTable from "@/components/locations/LocationTable";
import LocationCards from "@/components/locations/LocationCards";
import LocationMetrics from "@/components/locations/LocationMetrics";
import LocationComparisonChart from "@/components/locations/LocationComparisonChart";
import AddLocationModal from "@/components/locations/modals/AddLocationModal";
import EditLocationModal from "@/components/locations/modals/EditLocationModal";
import LocationHealthModal from "@/components/locations/modals/LocationHealthModal";
import TerritoryPlanningModal from "@/components/locations/modals/TerritoryPlanningModal";
import PerformanceAnalysisModal from "@/components/locations/modals/PerformanceAnalysisModal";

const mockLocations = [
  {
    id: "1",
    name: "Downtown Flagship",
    address: "123 Main St, New York, NY",
    lat: 40.7128,
    lng: -74.006,
    performance: "exceeding" as const,
    revenue: 425000,
    change: 12,
    healthScore: 98,
    status: "active",
    manager: "John Smith"
  },
  {
    id: "2",
    name: "Westside Mall",
    address: "456 Park Ave, Los Angeles, CA",
    lat: 34.0522,
    lng: -118.2437,
    performance: "meeting" as const,
    revenue: 312000,
    change: 3,
    healthScore: 87,
    status: "active",
    manager: "Lisa Johnson"
  },
  {
    id: "3",
    name: "Suburban Outpost",
    address: "789 Oak Dr, Chicago, IL",
    lat: 41.8781,
    lng: -87.6298,
    performance: "below" as const,
    revenue: 186000,
    change: -5,
    healthScore: 72,
    status: "warning",
    manager: "Robert Davis"
  },
  {
    id: "4",
    name: "Airport Terminal",
    address: "101 Airport Way, Miami, FL",
    lat: 25.7617,
    lng: -80.1918,
    performance: "critical" as const,
    revenue: 95000,
    change: -18,
    healthScore: 45,
    status: "critical",
    manager: "Sarah Wilson"
  },
  {
    id: "5",
    name: "University Center",
    address: "555 College Blvd, Boston, MA",
    lat: 42.3601,
    lng: -71.0589,
    performance: "meeting" as const,
    revenue: 278000,
    change: 1,
    healthScore: 84,
    status: "active",
    manager: "Mike Anderson"
  },
  {
    id: "6",
    name: "Business District",
    address: "222 Commerce St, Houston, TX",
    lat: 29.7604,
    lng: -95.3698,
    performance: "exceeding" as const,
    revenue: 385000,
    change: 8,
    healthScore: 93,
    status: "active",
    manager: "Jennifer Brown"
  }
];

const Locations = () => {
  const [viewMode, setViewMode] = useState<"map" | "table" | "cards">("map");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLocations, setFilteredLocations] = useState(mockLocations);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm) {
      setFilteredLocations(
        mockLocations.filter((loc) =>
          loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loc.address.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredLocations(mockLocations);
    }
  }, [searchTerm]);

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  const getSelectedLocationData = () => {
    return selectedLocationId
      ? mockLocations.find((loc) => loc.id === selectedLocationId)
      : null;
  };

  const handleEditLocation = (locationId: string) => {
    setSelectedLocationId(locationId);
    setIsEditModalOpen(true);
  };

  const handleHealthCheck = (locationId: string) => {
    setSelectedLocationId(locationId);
    setIsHealthModalOpen(true);
  };

  const handlePerformanceAnalysis = (locationId: string) => {
    setSelectedLocationId(locationId);
    setIsPerformanceModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Locations Management</h2>
          <p className="text-muted-foreground">
            Manage your franchise locations, monitor performance, and analyze data.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 flex">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8"
                />
              </div>
            </div>
            <div className="md:col-span-5 flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Layers className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "map" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="rounded-r-none"
                >
                  <Map className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded-none"
                >
                  <Table className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="rounded-l-none"
                >
                  <Grid2X2 className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Card className="overflow-hidden">
                <CardHeader className="pb-0">
                  <CardTitle>Location Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {viewMode === "map" && (
                    <div className="p-6">
                      <LocationsMap locations={filteredLocations} />
                    </div>
                  )}
                  {viewMode === "table" && (
                    <LocationTable 
                      locations={filteredLocations}
                      selectedLocations={selectedLocations}
                      onSelectLocation={toggleLocationSelection}
                      onEdit={handleEditLocation}
                      onHealthCheck={handleHealthCheck}
                      onPerformanceAnalysis={handlePerformanceAnalysis}
                    />
                  )}
                  {viewMode === "cards" && (
                    <div className="p-6">
                      <LocationCards
                        locations={filteredLocations}
                        selectedLocations={selectedLocations}
                        onSelectLocation={toggleLocationSelection}
                        onEdit={handleEditLocation}
                        onHealthCheck={handleHealthCheck}
                        onPerformanceAnalysis={handlePerformanceAnalysis}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMetrics locations={filteredLocations} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Location Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="flex flex-col h-24 justify-center" onClick={() => setIsAddModalOpen(true)}>
                      <PlusCircle className="w-5 h-5 mb-1" />
                      <span>Add Location</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-24 justify-center" onClick={() => setIsTerritoryModalOpen(true)}>
                      <Map className="w-5 h-5 mb-1" />
                      <span>Territory Planning</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-24 justify-center" onClick={() => setIsHealthModalOpen(true)}>
                      <AlertTriangle className="w-5 h-5 mb-1" />
                      <span>Health Monitoring</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-24 justify-center" onClick={() => setIsPerformanceModalOpen(true)}>
                      <BarChart className="w-5 h-5 mb-1" />
                      <span>Performance</span>
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Quick Export</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Performance Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparison Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Select locations to compare (max 3)
                    </p>
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      {mockLocations.map((location) => (
                        <div key={location.id} className="flex items-center space-x-2 py-2">
                          <Checkbox
                            id={`location-${location.id}`}
                            checked={selectedLocations.includes(location.id)}
                            onCheckedChange={() => toggleLocationSelection(location.id)}
                            disabled={
                              selectedLocations.length >= 3 &&
                              !selectedLocations.includes(location.id)
                            }
                          />
                          <Label
                            htmlFor={`location-${location.id}`}
                            className="flex items-center justify-between w-full"
                          >
                            <span>{location.name}</span>
                            <Badge
                              variant={
                                location.performance === "exceeding"
                                  ? "default"
                                  : location.performance === "meeting"
                                  ? "default"
                                  : location.performance === "below"
                                  ? "default"
                                  : "destructive"
                              }
                              className={
                                location.performance === "exceeding"
                                  ? "bg-green-500 hover:bg-green-600"
                                  : location.performance === "meeting"
                                  ? ""
                                  : location.performance === "below"
                                  ? "bg-yellow-500 hover:bg-yellow-600"
                                  : ""
                              }
                            >
                              {location.performance}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  {selectedLocations.length > 0 ? (
                    <div className="space-y-4">
                      <LocationComparisonChart 
                        locations={mockLocations.filter(loc => 
                          selectedLocations.includes(loc.id)
                        )} 
                      />
                      <Button className="w-full">
                        Generate Detailed Comparison
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Select locations to compare performance metrics
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <AddLocationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      <EditLocationModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        location={getSelectedLocationData()} 
      />
      
      <LocationHealthModal 
        isOpen={isHealthModalOpen} 
        onClose={() => setIsHealthModalOpen(false)}
        location={getSelectedLocationData()} 
      />
      
      <TerritoryPlanningModal 
        isOpen={isTerritoryModalOpen} 
        onClose={() => setIsTerritoryModalOpen(false)}
        locations={mockLocations} 
      />
      
      <PerformanceAnalysisModal 
        isOpen={isPerformanceModalOpen} 
        onClose={() => setIsPerformanceModalOpen(false)}
        location={getSelectedLocationData()} 
      />
    </MainLayout>
  );
};

export default Locations;
