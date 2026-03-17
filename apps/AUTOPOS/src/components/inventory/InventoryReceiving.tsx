
import { useState } from "react";
import { 
  PackageCheck, 
  Truck, 
  Clipboard, 
  ArrowDown,
  Check,
  PackagePlus,
  ListChecks
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "@/data/mockData";

// Mock purchase orders
const MOCK_PURCHASE_ORDERS = [
  {
    id: "PO-1001",
    supplier: "AutoParts Wholesale",
    status: "pending",
    dateOrdered: "2023-11-10T09:00:00Z",
    expectedDelivery: "2023-11-25T09:00:00Z",
    items: [
      { id: "p1", name: "Premium Brake Pads", sku: "BRK-001", quantity: 20, received: 0 },
      { id: "p2", name: "Oil Filter - Standard", sku: "FLT-100", quantity: 50, received: 0 }
    ]
  },
  {
    id: "PO-1002",
    supplier: "Parts Unlimited",
    status: "in-transit",
    dateOrdered: "2023-11-12T11:30:00Z",
    expectedDelivery: "2023-11-26T09:00:00Z",
    items: [
      { id: "p3", name: "Spark Plug Set (4pk)", sku: "IGN-220", quantity: 15, received: 0 },
      { id: "p4", name: "Synthetic Motor Oil - 5W30 (5qt)", sku: "OIL-530", quantity: 30, received: 0 }
    ]
  },
  {
    id: "PO-1003",
    supplier: "Quality Auto Supply",
    status: "arrived",
    dateOrdered: "2023-11-15T14:45:00Z",
    expectedDelivery: "2023-11-23T09:00:00Z",
    items: [
      { id: "p5", name: "Wiper Blade Set", sku: "WPR-215", quantity: 25, received: 0 },
      { id: "p6", name: "Air Filter - Performance", sku: "FLT-210", quantity: 15, received: 0 },
      { id: "p7", name: "Headlight Restoration Kit", sku: "LGT-305", quantity: 10, received: 0 }
    ]
  }
];

export const InventoryReceiving = () => {
  const [purchaseOrders, setPurchaseOrders] = useState(MOCK_PURCHASE_ORDERS);
  const [currentPO, setCurrentPO] = useState<typeof MOCK_PURCHASE_ORDERS[0] | null>(null);
  const [step, setStep] = useState(1);
  const [receivedItems, setReceivedItems] = useState<Record<string, number>>({});
  const [receivingNotes, setReceivingNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Initialize receiving process for a PO
  const startReceiving = (po: typeof MOCK_PURCHASE_ORDERS[0]) => {
    setCurrentPO(po);
    
    // Initialize received quantities
    const initialReceivedItems: Record<string, number> = {};
    po.items.forEach(item => {
      initialReceivedItems[item.id] = item.received;
    });
    
    setReceivedItems(initialReceivedItems);
    setReceivingNotes("");
    setStep(1);
    setDialogOpen(true);
  };
  
  // Handle quantity changes
  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setReceivedItems(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };
  
  // Go to next step
  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeReceiving();
    }
  };
  
  // Go to previous step
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Complete receiving process
  const completeReceiving = () => {
    if (!currentPO) return;
    
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Update the PO with received quantities
      const updatedPOs = purchaseOrders.map(po => {
        if (po.id === currentPO.id) {
          const updatedItems = po.items.map(item => ({
            ...item,
            received: receivedItems[item.id] || 0
          }));
          
          // Check if all items are fully received
          const allReceived = updatedItems.every(item => item.received === item.quantity);
          
          return {
            ...po,
            status: allReceived ? "completed" : "partial",
            items: updatedItems
          };
        }
        return po;
      });
      
      setPurchaseOrders(updatedPOs);
      setIsProcessing(false);
      setDialogOpen(false);
      
      toast.success("Receiving completed", {
        description: `Purchase order ${currentPO.id} has been processed.`
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Receiving Workflow</h2>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-4 text-sm font-medium">PO Number</th>
                  <th className="text-left p-4 text-sm font-medium">Supplier</th>
                  <th className="text-left p-4 text-sm font-medium">Ordered</th>
                  <th className="text-left p-4 text-sm font-medium">Expected Delivery</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Items</th>
                  <th className="text-right p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-muted/20">
                    <td className="p-4 text-sm font-medium">{po.id}</td>
                    <td className="p-4 text-sm">{po.supplier}</td>
                    <td className="p-4 text-sm">{formatDate(po.dateOrdered)}</td>
                    <td className="p-4 text-sm">{formatDate(po.expectedDelivery)}</td>
                    <td className="p-4 text-sm">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          po.status === 'pending'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                            : po.status === 'in-transit'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                            : po.status === 'arrived'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : po.status === 'partial'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}
                      >
                        {po.status === 'in-transit'
                          ? 'In Transit'
                          : po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{po.items.length} items</td>
                    <td className="p-4 text-sm text-right">
                      <Button
                        variant={po.status === 'arrived' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1"
                        disabled={po.status !== 'arrived' && po.status !== 'in-transit'}
                        onClick={() => startReceiving(po)}
                      >
                        <ArrowDown className="h-4 w-4" />
                        Receive
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {purchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Receiving Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!isProcessing) setDialogOpen(open);
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receiving Workflow</DialogTitle>
            <DialogDescription>
              {currentPO?.id} - {currentPO?.supplier}
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            {/* Step indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center w-full max-w-md">
                <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    step >= 1 ? 'border-primary bg-primary/10' : 'border-muted-foreground'
                  }`}>
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1">Verification</span>
                </div>
                
                <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                
                <div className={`flex flex-col items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    step >= 2 ? 'border-primary bg-primary/10' : 'border-muted-foreground'
                  }`}>
                    <Clipboard className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1">Items</span>
                </div>
                
                <div className={`flex-1 h-0.5 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                
                <div className={`flex flex-col items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    step >= 3 ? 'border-primary bg-primary/10' : 'border-muted-foreground'
                  }`}>
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1">Confirmation</span>
                </div>
              </div>
            </div>
            
            {/* Step content */}
            {step === 1 && currentPO && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Shipment Verification</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Purchase Order</h4>
                    <p className="font-medium">{currentPO.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Supplier</h4>
                    <p>{currentPO.supplier}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Date Ordered</h4>
                    <p>{formatDate(currentPO.dateOrdered)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Expected Delivery</h4>
                    <p>{formatDate(currentPO.expectedDelivery)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Carrier Information</h4>
                  <Input 
                    placeholder="Shipping carrier name"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Tracking Number</h4>
                  <Input 
                    placeholder="Enter tracking number"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Package Condition</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">Good</Button>
                    <Button variant="outline" className="flex-1">Damaged</Button>
                    <Button variant="outline" className="flex-1">Partial</Button>
                  </div>
                </div>
              </div>
            )}
            
            {step === 2 && currentPO && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Item Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Check the received items and enter the quantities.
                </p>
                
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-3 text-xs font-medium">SKU</th>
                          <th className="text-left p-3 text-xs font-medium">Item</th>
                          <th className="text-center p-3 text-xs font-medium">Expected</th>
                          <th className="text-center p-3 text-xs font-medium">Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {currentPO.items.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 text-sm">{item.sku}</td>
                            <td className="p-3 text-sm">{item.name}</td>
                            <td className="p-3 text-sm text-center">{item.quantity}</td>
                            <td className="p-3 text-center">
                              <Input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={receivedItems[item.id]}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="w-20 mx-auto text-center"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Quality Check</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        // Set all items to their expected quantities
                        const allReceived: Record<string, number> = {};
                        currentPO.items.forEach(item => {
                          allReceived[item.id] = item.quantity;
                        });
                        setReceivedItems(allReceived);
                      }}
                    >
                      <ListChecks className="h-4 w-4" />
                      All Items Received
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && currentPO && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Confirmation</h3>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2">Summary</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Expected Items:</span>
                        <span className="font-medium">
                          {currentPO.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Received Items:</span>
                        <span className="font-medium">
                          {Object.values(receivedItems).reduce((sum, qty) => sum + qty, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="font-medium">
                          {Object.values(receivedItems).reduce((sum, qty) => sum + qty, 0) === 
                           currentPO.items.reduce((sum, item) => sum + item.quantity, 0)
                            ? "Complete"
                            : "Partial"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <textarea
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Add any notes about this receiving..."
                    value={receivingNotes}
                    onChange={(e) => setReceivingNotes(e.target.value)}
                  />
                </div>
                
                <div className="rounded-md bg-primary/10 p-4 flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-primary" />
                  <p className="text-sm">
                    All items will be added to your inventory upon confirmation.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isProcessing}
              >
                Back
              </Button>
            )}
            
            <Button
              type="button"
              onClick={nextStep}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : step < 3 ? (
                <>Next</>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" />
                  Complete Receiving
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
