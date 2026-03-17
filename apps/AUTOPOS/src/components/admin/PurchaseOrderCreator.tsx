
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search, PackageCheck, TruckIcon, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "@/data/mockData";

// Mock Purchase Orders
const mockPurchaseOrders = [
  {
    id: "PO-2023-001",
    supplier: "AutoParts Wholesalers",
    date: "2023-08-15",
    status: "completed" as const,
    total: 1245.67,
    items: 12
  },
  {
    id: "PO-2023-002",
    supplier: "Global Auto Supplies",
    date: "2023-09-03",
    status: "pending" as const,
    total: 876.50,
    items: 8
  },
  {
    id: "PO-2023-003",
    supplier: "Premium Parts Co.",
    date: "2023-09-10",
    status: "approved" as const,
    total: 2345.00,
    items: 15
  },
  {
    id: "PO-2023-004",
    supplier: "Tech Auto Innovations",
    date: "2023-09-18",
    status: "draft" as const,
    total: 654.25,
    items: 5
  }
];

type POStatus = "draft" | "pending" | "approved" | "completed" | "cancelled";

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  status: POStatus;
  total: number;
  items: number;
}

export const PurchaseOrderCreator = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<{product: any, quantity: number}[]>([]);
  const [newPO, setNewPO] = useState({
    supplier: "",
    notes: ""
  });

  const filteredPOs = purchaseOrders.filter(po => 
    po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (product: any) => {
    if (selectedProducts.some(p => p.product.id === product.id)) {
      setSelectedProducts(
        selectedProducts.map(p => 
          p.product.id === product.id 
            ? { ...p, quantity: p.quantity + 1 } 
            : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map(p => 
        p.product.id === productId 
          ? { ...p, quantity: Math.max(1, quantity) } 
          : p
      )
    );
  };

  const handleCreatePO = () => {
    if (!newPO.supplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    const newId = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split("T")[0];
    const total = selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    setPurchaseOrders([...purchaseOrders, {
      id: newId,
      supplier: newPO.supplier,
      date: today,
      status: "draft",
      total,
      items: selectedProducts.length
    }]);

    setNewPO({
      supplier: "",
      notes: ""
    });
    setSelectedProducts([]);
    setCurrentStep(1);
    setIsCreatePOOpen(false);

    toast.success("Purchase Order created successfully");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Select Supplier</h3>
            <div className="grid gap-3">
              <Label htmlFor="supplier">Supplier</Label>
              <select
                id="supplier"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newPO.supplier}
                onChange={(e) => setNewPO({...newPO, supplier: e.target.value})}
              >
                <option value="">Select a supplier</option>
                <option value="AutoParts Wholesalers">AutoParts Wholesalers</option>
                <option value="Global Auto Supplies">Global Auto Supplies</option>
                <option value="Premium Parts Co.">Premium Parts Co.</option>
                <option value="Budget Auto Parts">Budget Auto Parts</option>
                <option value="Tech Auto Innovations">Tech Auto Innovations</option>
              </select>
              
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter any special instructions or notes"
                value={newPO.notes}
                onChange={(e) => setNewPO({...newPO, notes: e.target.value})}
              ></textarea>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 2: Add Products</h3>
            <div className="grid gap-3">
              <div className="flex justify-between">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-8 w-[300px]"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="">All Categories</option>
                    <option value="Brakes">Brakes</option>
                    <option value="Filters">Filters</option>
                    <option value="Fluids">Fluids</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
              </div>
              
              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MOCK_PRODUCTS.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleAddProduct(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${product.price.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Selected Products</h4>
                {selectedProducts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No products selected</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell>${item.product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center w-20">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                                className="h-8 w-12 text-center mx-1"
                                min="1"
                              />
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleRemoveProduct(item.product.id)}
                            >
                              ×
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 text-right">
                  <p className="font-medium">
                    Total: ${selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 3: Review & Submit</h3>
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Supplier Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{newPO.supplier}</p>
                  {newPO.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground font-medium">Notes:</p>
                      <p className="text-sm">{newPO.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 text-right">
                    <p className="text-muted-foreground">Total Items: {selectedProducts.reduce((sum, item) => sum + item.quantity, 0)}</p>
                    <p className="font-medium text-lg">
                      Total: ${selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Purchase Orders</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-8 md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreatePOOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create PO
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active POs</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.filter(po => po.status === 'pending' || po.status === 'approved').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No active purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs
                      .filter(po => po.status === 'pending' || po.status === 'approved')
                      .map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.id}</TableCell>
                          <TableCell>{po.supplier}</TableCell>
                          <TableCell>{po.date}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={po.status === 'approved' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{po.items}</TableCell>
                          <TableCell className="text-right">${po.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="draft" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.filter(po => po.status === 'draft').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No draft purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs
                      .filter(po => po.status === 'draft')
                      .map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.id}</TableCell>
                          <TableCell>{po.supplier}</TableCell>
                          <TableCell>{po.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{po.items}</TableCell>
                          <TableCell className="text-right">${po.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm">
                                Submit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.filter(po => po.status === 'completed').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No completed purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs
                      .filter(po => po.status === 'completed')
                      .map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">{po.id}</TableCell>
                          <TableCell>{po.supplier}</TableCell>
                          <TableCell>{po.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{po.items}</TableCell>
                          <TableCell className="text-right">${po.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.id}</TableCell>
                        <TableCell>{po.supplier}</TableCell>
                        <TableCell>{po.date}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              po.status === 'completed' ? 'outline' : 
                              po.status === 'approved' ? 'default' : 
                              po.status === 'draft' ? 'secondary' : 
                              'secondary'
                            } 
                            className="capitalize"
                          >
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{po.items}</TableCell>
                        <TableCell className="text-right">${po.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Create PO Dialog */}
      <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Fill out the details to create a new purchase order</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <div className={`h-1 w-20 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <div className={`h-1 w-20 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
              </div>
            </div>
            
            {renderStepContent()}
          </div>
          
          <DialogFooter className="flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsCreatePOOpen(false)}>
                Cancel
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleCreatePO}>
                Create Purchase Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
