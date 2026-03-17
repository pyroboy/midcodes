
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Map, 
  Layers, 
  Save, 
  Target, 
  Circle, 
  MapPin 
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

interface TerritoryPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
}

const TerritoryPlanningModal = ({ isOpen, onClose, locations }: TerritoryPlanningModalProps) => {
  const [radius, setRadius] = useState([5]);
  const [showCompetitors, setShowCompetitors] = useState(true);
  const [showDemographics, setShowDemographics] = useState(true);

  const handleSave = () => {
    toast.success("Territory planning changes saved successfully");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Territory Planning
          </DialogTitle>
          <DialogDescription>
            Plan and analyze territories for your franchise locations
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="border rounded-md h-[300px] bg-muted/30 flex items-center justify-center relative">
                {/* This would be replaced with an actual map component */}
                <div className="absolute inset-0 p-4 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Interactive territory mapping would be implemented with a mapping library
                  </p>
                </div>
                <Map className="h-16 w-16 text-muted-foreground opacity-20" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Map Controls</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="radius">Radius (miles)</Label>
                      <span className="text-sm font-medium">{radius[0]}</span>
                    </div>
                    <Slider
                      id="radius"
                      min={1}
                      max={25}
                      step={1}
                      value={radius}
                      onValueChange={setRadius}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-competitors" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Show Competitors
                      </Label>
                      <Switch
                        id="show-competitors"
                        checked={showCompetitors}
                        onCheckedChange={setShowCompetitors}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-demographics" className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        Show Demographics
                      </Label>
                      <Switch
                        id="show-demographics"
                        checked={showDemographics}
                        onCheckedChange={setShowDemographics}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-1">
                    <Button variant="secondary" className="w-full gap-2">
                      <Layers className="h-4 w-4" />
                      Change Map Style
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Active Locations in Territory</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.slice(0, 4).map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Franchise</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {showCompetitors && (
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-red-500" />
                          <span>Competitor A</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-red-500 border-red-200">Competitor</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">New Territory Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="territory-name">Territory Name</Label>
                <Input id="territory-name" placeholder="Northeast Region" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market-potential">Market Potential</Label>
                <Input id="market-potential" placeholder="High" />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Territory Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TerritoryPlanningModal;
