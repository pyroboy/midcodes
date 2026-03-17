
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, ListFilter, XCircle, DollarSign, Package, Tag, Calendar, FileSpreadsheet, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const ApprovalWorkflow = () => {
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([
    {
      id: "PO-2023-0126",
      type: "purchase",
      title: "Large Inventory Restock",
      description: "Quarterly restock of all product categories",
      priority: "high",
      amount: "$12,500.00",
      requestedBy: "Chris Manager",
      createdAt: "2023-10-12T10:30:00",
      details: {
        supplier: "AutoParts Wholesale",
        items: [
          { name: "Brake Pads (Ceramic)", qty: 50, price: "$28.50" },
          { name: "Oil Filters (Premium)", qty: 75, price: "$8.75" },
          { name: "Spark Plugs (Platinum)", qty: 100, price: "$5.50" },
          { name: "Wiper Blades (All-Weather)", qty: 60, price: "$12.25" },
          { name: "Air Filters (HEPA)", qty: 45, price: "$15.75" }
        ],
        notes: "This order addresses the projected increase in demand for Q4. Several items are currently at <20% inventory levels."
      }
    },
    {
      id: "PR-2023-0089",
      type: "pricing",
      title: "Category Price Adjustment",
      description: "Seasonal pricing update for winter items",
      priority: "medium",
      requestedBy: "Sarah Marketing",
      createdAt: "2023-10-13T14:15:00",
      details: {
        categories: ["Winter Accessories", "Engine Fluids", "Battery Products"],
        adjustment: "+8%",
        rationale: "Seasonal adjustment to reflect increased demand and higher supplier prices for winter items. Competitive analysis shows our prices will remain within market range even after adjustment.",
        effectiveDate: "2023-11-01"
      }
    },
    {
      id: "DI-2023-0034",
      type: "discount",
      title: "Commercial Client Discount",
      description: "Volume discount for Johnson's Fleet Services",
      priority: "medium",
      requestedBy: "Michael Sales",
      createdAt: "2023-10-11T09:45:00",
      details: {
        client: "Johnson's Fleet Services",
        currentDiscount: "8%",
        proposedDiscount: "12%",
        annualPurchaseVolume: "$48,000",
        projectedIncrease: "25%",
        rationale: "Johnson's Fleet has committed to making us their primary parts supplier if we can offer a more competitive rate. They plan to add 10 more vehicles to their maintenance program."
      }
    },
    {
      id: "ST-2023-0055",
      type: "staffing",
      title: "New Service Technician",
      description: "Hire approval for experienced mechanic",
      priority: "low",
      requestedBy: "Emily HR",
      createdAt: "2023-10-10T13:20:00",
      details: {
        candidate: "Robert Martinez",
        position: "Senior Service Technician",
        experience: "12 years",
        certifications: ["ASE Master Technician", "Hybrid Vehicle Specialist"],
        proposedSalary: "$65,000",
        startDate: "2023-11-15",
        rationale: "We need additional certified technicians to handle the increased service volume. Robert has extensive experience with European vehicles, which matches our customer base."
      }
    },
    {
      id: "EX-2023-0012",
      type: "expense",
      title: "Diagnostic Equipment Upgrade",
      description: "New scanner systems for service department",
      priority: "high",
      amount: "$8,750.00",
      requestedBy: "David Service",
      createdAt: "2023-10-09T11:10:00",
      details: {
        vendor: "TechDiag Solutions",
        items: [
          { name: "MultiCar Diagnostic System Pro", qty: 2, price: "$3,250.00" },
          { name: "OBDII Advanced Scanner", qty: 3, price: "$750.00" }
        ],
        justification: "Our current diagnostic equipment doesn't support the newest vehicle models. This upgrade will allow us to service 95% of vehicles on the road today, up from our current 80% coverage."
      }
    }
  ]);
  
  const handleApproval = (approved: boolean) => {
    if (!selectedItem) return;
    
    setApprovalItems(approvalItems.filter(item => item.id !== selectedItem.id));
    
    toast.success(
      approved ? "Item approved successfully" : "Item rejected", 
      { description: `${selectedItem.title} has been ${approved ? 'approved' : 'rejected'}.` }
    );
    
    setSelectedItem(null);
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500 hover:bg-red-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'pricing':
        return <Tag className="h-5 w-5 text-green-500" />;
      case 'discount':
        return <DollarSign className="h-5 w-5 text-amber-500" />;
      case 'staffing':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'expense':
        return <FileSpreadsheet className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const filteredItems = filter === "all" 
    ? approvalItems 
    : approvalItems.filter(item => item.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Approval Workflow</h2>
          <p className="text-muted-foreground">Review and respond to pending approval requests</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs defaultValue="pending" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                <Clock className="mr-2 h-4 w-4" />
                Pending ({approvalItems.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approved (8)
              </TabsTrigger>
              <TabsTrigger value="rejected">
                <XCircle className="mr-2 h-4 w-4" />
                Rejected (3)
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center">
            <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchase Orders</SelectItem>
                <SelectItem value="pricing">Pricing Changes</SelectItem>
                <SelectItem value="discount">Discount Requests</SelectItem>
                <SelectItem value="staffing">Staffing Requests</SelectItem>
                <SelectItem value="expense">Expense Approvals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Pending Approvals</CardTitle>
          <CardDescription>Items requiring your review and decision</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">ID</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Title</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Type</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Requested By</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Date</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Priority</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{item.id}</td>
                      <td className="px-4 py-3 text-sm">{item.title}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="capitalize">{item.type}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{item.requestedBy}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {getPriorityBadge(item.priority)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => setSelectedItem(item)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Review Approval Request</DialogTitle>
                              <DialogDescription>
                                {selectedItem?.description}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedItem && (
                              <div className="mt-4 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium flex items-center gap-2">
                                      {getTypeIcon(selectedItem.type)}
                                      <span>{selectedItem.title}</span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      ID: {selectedItem.id} • 
                                      Requested by {selectedItem.requestedBy} on {formatDate(selectedItem.createdAt)}
                                    </p>
                                  </div>
                                  <div>
                                    {getPriorityBadge(selectedItem.priority)}
                                  </div>
                                </div>
                                
                                <ScrollArea className="h-[300px] rounded-md border p-4">
                                  {selectedItem.type === "purchase" && selectedItem.details && (
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium">Supplier</h4>
                                        <p>{selectedItem.details.supplier}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Items</h4>
                                        <table className="w-full mt-2">
                                          <thead>
                                            <tr className="border-b">
                                              <th className="text-left pb-2">Item</th>
                                              <th className="text-right pb-2">Quantity</th>
                                              <th className="text-right pb-2">Unit Price</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {selectedItem.details.items.map((item, index) => (
                                              <tr key={index} className="border-b">
                                                <td className="py-2">{item.name}</td>
                                                <td className="text-right py-2">{item.qty}</td>
                                                <td className="text-right py-2">{item.price}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Total Amount</h4>
                                        <p className="text-lg font-bold">{selectedItem.amount}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Notes</h4>
                                        <p>{selectedItem.details.notes}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedItem.type === "pricing" && selectedItem.details && (
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium">Categories Affected</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {selectedItem.details.categories.map((category, index) => (
                                            <Badge key={index} variant="outline">{category}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Price Adjustment</h4>
                                        <p className="text-lg font-bold">{selectedItem.details.adjustment}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Effective Date</h4>
                                        <p>{selectedItem.details.effectiveDate}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Rationale</h4>
                                        <p>{selectedItem.details.rationale}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedItem.type === "discount" && selectedItem.details && (
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium">Client</h4>
                                        <p>{selectedItem.details.client}</p>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium">Current Discount</h4>
                                          <p className="text-lg font-bold">{selectedItem.details.currentDiscount}</p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium">Proposed Discount</h4>
                                          <p className="text-lg font-bold text-green-600">{selectedItem.details.proposedDiscount}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium">Annual Purchase Volume</h4>
                                          <p>{selectedItem.details.annualPurchaseVolume}</p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium">Projected Increase</h4>
                                          <p className="text-green-600">{selectedItem.details.projectedIncrease}</p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Rationale</h4>
                                        <p>{selectedItem.details.rationale}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedItem.type === "staffing" && selectedItem.details && (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                          <AvatarFallback>{selectedItem.details.candidate.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <h4 className="font-medium text-lg">{selectedItem.details.candidate}</h4>
                                          <p>{selectedItem.details.position}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium">Experience</h4>
                                          <p>{selectedItem.details.experience}</p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium">Proposed Salary</h4>
                                          <p className="font-bold">{selectedItem.details.proposedSalary}</p>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Certifications</h4>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {selectedItem.details.certifications.map((cert, index) => (
                                            <Badge key={index} variant="outline">{cert}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Start Date</h4>
                                        <p>{selectedItem.details.startDate}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Rationale</h4>
                                        <p>{selectedItem.details.rationale}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedItem.type === "expense" && selectedItem.details && (
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium">Vendor</h4>
                                        <p>{selectedItem.details.vendor}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Items</h4>
                                        <table className="w-full mt-2">
                                          <thead>
                                            <tr className="border-b">
                                              <th className="text-left pb-2">Item</th>
                                              <th className="text-right pb-2">Quantity</th>
                                              <th className="text-right pb-2">Unit Price</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {selectedItem.details.items.map((item, index) => (
                                              <tr key={index} className="border-b">
                                                <td className="py-2">{item.name}</td>
                                                <td className="text-right py-2">{item.qty}</td>
                                                <td className="text-right py-2">{item.price}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Total Amount</h4>
                                        <p className="text-lg font-bold">{selectedItem.amount}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium">Justification</h4>
                                        <p>{selectedItem.details.justification}</p>
                                      </div>
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>
                            )}
                            
                            <DialogFooter className="flex items-center justify-between mt-4">
                              <div>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleApproval(false)}
                                  className="gap-1"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedItem(null)}
                                >
                                  Review Later
                                </Button>
                                <Button
                                  onClick={() => handleApproval(true)}
                                  className="gap-1"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  Approve
                                </Button>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No approval requests found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Type definitions for approval items
type ApprovalItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  amount?: string;
  requestedBy: string;
  createdAt: string;
  details: any;
};
