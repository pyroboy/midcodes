
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle,
  Clock
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Location {
  id: string;
  name: string;
  healthScore: number;
}

interface LocationHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
}

// Mock health check data
const healthChecks = [
  {
    id: 1,
    name: "Equipment Maintenance",
    status: "passed",
    lastChecked: "2023-11-15",
    score: 95,
  },
  {
    id: 2,
    name: "Health & Safety Compliance",
    status: "passed",
    lastChecked: "2023-11-10",
    score: 100,
  },
  {
    id: 3,
    name: "Stock Levels",
    status: "warning",
    lastChecked: "2023-11-12",
    score: 76,
  },
  {
    id: 4,
    name: "Staff Training Compliance",
    status: "failed",
    lastChecked: "2023-11-08",
    score: 45,
  },
  {
    id: 5,
    name: "Facility Inspection",
    status: "passed",
    lastChecked: "2023-11-14",
    score: 92,
  },
];

const LocationHealthModal = ({ isOpen, onClose, location }: LocationHealthModalProps) => {
  if (!location) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Passed</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
      case "failed":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Location Health Check
          </DialogTitle>
          <DialogDescription>
            Health monitoring status for {location.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{location.name}</h3>
              <p className="text-sm text-muted-foreground">Overall Health Score</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {location.healthScore}<span className="text-sm">/100</span>
              </div>
              <p className="text-xs text-muted-foreground">Last updated: 2 days ago</p>
            </div>
          </div>
          
          <Progress value={location.healthScore} className="h-2.5" />
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Health Check Categories</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthChecks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>{check.name}</TableCell>
                    <TableCell>{getStatusBadge(check.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {check.lastChecked}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium">{check.score}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreColor(check.score)}`} 
                            style={{ width: `${check.score}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-md space-y-2">
            <h3 className="text-sm font-medium">Recommended Actions</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span>Schedule staff training refresher to improve compliance scores</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span>Review stock levels and order critical inventory items</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" className="gap-2" onClick={onClose}>
            <FileSpreadsheet className="h-4 w-4" />
            Download Report
          </Button>
          <Button>Schedule New Health Check</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationHealthModal;
