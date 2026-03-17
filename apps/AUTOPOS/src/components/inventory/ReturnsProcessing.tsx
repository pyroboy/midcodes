
import { useState } from "react";
import { 
  RotateCcw, 
  ArrowLeft, 
  PackageX, 
  Check, 
  X,
  Eye,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Mock returns data
const MOCK_RETURNS = [
  {
    id: "r1001",
    orderNumber: "ORD-10392",
    customer: "John Smith",
    reason: "Defective item",
    items: [{ name: "Premium Brake Pads", quantity: 1, sku: "BRK-001" }],
    status: "pending",
    date: "2023-11-15T14:30:00Z"
  },
  {
    id: "r1002",
    orderNumber: "ORD-10405",
    customer: "Sarah Johnson",
    reason: "Wrong item received",
    items: [{ name: "Oil Filter - Standard", quantity: 2, sku: "FLT-100" }],
    status: "pending",
    date: "2023-11-18T09:45:00Z"
  },
  {
    id: "r1003",
    orderNumber: "ORD-10418",
    customer: "Michael Brown",
    reason: "No longer needed",
    items: [
      { name: "Spark Plug Set (4pk)", quantity: 1, sku: "IGN-220" },
      { name: "Synthetic Motor Oil - 5W30 (5qt)", quantity: 1, sku: "OIL-530" }
    ],
    status: "pending",
    date: "2023-11-20T16:15:00Z"
  },
  {
    id: "r1004",
    orderNumber: "ORD-10426",
    customer: "Lisa Rodriguez",
    reason: "Item damaged in shipping",
    items: [{ name: "Headlight Restoration Kit", quantity: 1, sku: "LGT-305" }],
    status: "pending",
    date: "2023-11-22T11:30:00Z"
  },
  {
    id: "r1005",
    orderNumber: "ORD-10431",
    customer: "David Williams",
    reason: "Incorrect part",
    items: [{ name: "Wheel Bearing Assembly", quantity: 1, sku: "SUS-510" }],
    status: "processing",
    date: "2023-11-25T10:00:00Z"
  }
];

export const ReturnsProcessing = () => {
  const [returns, setReturns] = useState(MOCK_RETURNS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<typeof MOCK_RETURNS[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState("");

  // Filter returns based on search
  const filteredReturns = returns.filter(
    ret =>
      ret.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Handle viewing return details
  const handleViewReturn = (ret: typeof MOCK_RETURNS[0]) => {
    setSelectedReturn(ret);
    setDialogOpen(true);
  };

  // Handle processing return action
  const handleProcessAction = (action: 'approve' | 'reject') => {
    if (!selectedReturn) return;
    
    // Update return status
    const updatedReturns = returns.map(ret => 
      ret.id === selectedReturn.id
        ? {
            ...ret,
            status: action === 'approve' ? 'approved' : 'rejected'
          }
        : ret
    );
    
    setReturns(updatedReturns);
    setSelectedReturn(null);
    setActionDialogOpen(false);
    setDialogOpen(false);
    setActionNotes("");
    
    toast.success(
      action === 'approve'
        ? "Return approved successfully"
        : "Return rejected",
      {
        description: `Return #${selectedReturn.id} has been ${
          action === 'approve' ? 'approved' : 'rejected'
        }.`
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Returns Processing Queue</h2>
        
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search returns..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-4 text-sm font-medium">Return ID</th>
                  <th className="text-left p-4 text-sm font-medium">Order</th>
                  <th className="text-left p-4 text-sm font-medium">Customer</th>
                  <th className="text-left p-4 text-sm font-medium">Items</th>
                  <th className="text-left p-4 text-sm font-medium">Date</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-right p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReturns.map(ret => (
                  <tr key={ret.id} className="hover:bg-muted/20">
                    <td className="p-4 text-sm font-medium">{ret.id}</td>
                    <td className="p-4 text-sm">{ret.orderNumber}</td>
                    <td className="p-4 text-sm">{ret.customer}</td>
                    <td className="p-4 text-sm">
                      {ret.items.length === 1
                        ? ret.items[0].name
                        : `${ret.items[0].name} +${ret.items.length - 1} more`}
                    </td>
                    <td className="p-4 text-sm">{formatDate(ret.date)}</td>
                    <td className="p-4 text-sm">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ret.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : ret.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : ret.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}
                      >
                        {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReturn(ret)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {filteredReturns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      No returns found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Return Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
            <DialogDescription>
              {selectedReturn?.orderNumber} - {selectedReturn?.customer}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Return ID</h4>
                  <p>{selectedReturn.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <p>{formatDate(selectedReturn.date)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p className="capitalize">{selectedReturn.status}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Reason</h4>
                  <p>{selectedReturn.reason}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Items</h4>
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 text-xs font-medium">SKU</th>
                          <th className="text-left p-3 text-xs font-medium">Item</th>
                          <th className="text-right p-3 text-xs font-medium">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedReturn.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 text-sm">{item.sku}</td>
                            <td className="p-3 text-sm">{item.name}</td>
                            <td className="p-3 text-sm text-right">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
              
              {selectedReturn.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      setActionDialogOpen(true);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button 
                    className="gap-2"
                    onClick={() => {
                      setActionDialogOpen(true);
                    }}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              Add notes about your decision for this return.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Processing Notes
              </label>
              <textarea
                id="notes"
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Add processing notes..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleProcessAction('reject')}
              className="gap-2"
            >
              <PackageX className="h-4 w-4" />
              Reject Return
            </Button>
            <Button 
              onClick={() => handleProcessAction('approve')}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Approve Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
