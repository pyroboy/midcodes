
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Location {
  id: string;
  name: string;
  performance: string;
  revenue: number;
  change: number;
  healthScore: number;
}

interface LocationMetricsProps {
  locations: Location[];
}

const LocationMetrics = ({ locations }: LocationMetricsProps) => {
  // Calculate summary metrics
  const totalRevenue = locations.reduce((sum, loc) => sum + loc.revenue, 0);
  
  const avgHealthScore = locations.length > 0
    ? Math.round(locations.reduce((sum, loc) => sum + loc.healthScore, 0) / locations.length)
    : 0;
  
  const exceeding = locations.filter(loc => loc.performance === "exceeding").length;
  const meeting = locations.filter(loc => loc.performance === "meeting").length;
  const below = locations.filter(loc => loc.performance === "below").length;
  const critical = locations.filter(loc => loc.performance === "critical").length;
  
  const avgChange = locations.length > 0
    ? Math.round(locations.reduce((sum, loc) => sum + loc.change, 0) / locations.length)
    : 0;

  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="revenue">Revenue</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-2 px-4">
              <CardDescription>Total Locations</CardDescription>
              <CardTitle className="text-2xl">{locations.length}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  Active: {exceeding + meeting}
                </span>
                <span className="inline-flex items-center text-red-600 ml-2">
                  At Risk: {below + critical}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2 px-4">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl">${totalRevenue.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-xs text-muted-foreground flex items-center">
                {avgChange >= 0 ? (
                  <span className="inline-flex items-center text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" /> {avgChange}% growth
                  </span>
                ) : (
                  <span className="inline-flex items-center text-red-600">
                    <ArrowDown className="h-3 w-3 mr-1" /> {Math.abs(avgChange)}% decrease
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2 px-4">
              <CardDescription>Avg Health Score</CardDescription>
              <CardTitle className="text-2xl">{avgHealthScore}/100</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-xs text-muted-foreground">
                {avgHealthScore >= 85 ? (
                  <span className="text-green-600">Good condition</span>
                ) : avgHealthScore >= 70 ? (
                  <span className="text-yellow-600">Needs attention</span>
                ) : (
                  <span className="text-red-600">Requires action</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-2 px-4">
              <CardDescription>Performance Distribution</CardDescription>
              <CardTitle className="text-2xl">
                {Math.round(((exceeding + meeting) / locations.length) * 100)}% on target
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="flex h-2 mb-1 rounded overflow-hidden">
                <div className="bg-green-500" style={{ width: `${(exceeding / locations.length) * 100}%` }}></div>
                <div className="bg-blue-500" style={{ width: `${(meeting / locations.length) * 100}%` }}></div>
                <div className="bg-yellow-500" style={{ width: `${(below / locations.length) * 100}%` }}></div>
                <div className="bg-red-500" style={{ width: `${(critical / locations.length) * 100}%` }}></div>
              </div>
              <div className="text-[10px] text-muted-foreground grid grid-cols-4">
                <span>{exceeding}</span>
                <span>{meeting}</span>
                <span>{below}</span>
                <span>{critical}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Locations</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              {locations
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 3)
                .map((location) => (
                  <div key={location.id} className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-xs text-muted-foreground">${location.revenue.toLocaleString()} revenue</p>
                    </div>
                    <div className="flex items-center">
                      <div className={`text-sm ${location.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {location.change >= 0 ? (
                          <span className="flex items-center">
                            <ArrowUp className="h-3 w-3 mr-1" /> {location.change}%
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ArrowDown className="h-3 w-3 mr-1" /> {Math.abs(location.change)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="performance">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Detailed metrics would be displayed here using charts and graphs
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Performance charts would be implemented here
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="revenue">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analysis</CardTitle>
            <CardDescription>
              Revenue details would be displayed here using charts and graphs
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Revenue charts would be implemented here
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default LocationMetrics;
