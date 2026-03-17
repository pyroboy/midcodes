
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
}

interface OrderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockSuppliers = [
  "Premium Poultry Co.",
  "Fresh Dairy Farms",
  "Artisan Bakery Inc.",
  "Gourmet Coffee Imports",
  "EcoPackaging Co."
];

const mockInventoryItems = [
  { id: "1", name: "Chicken Breast", unit: "lbs" },
  { id: "2", name: "Coffee Beans (Dark Roast)", unit: "kg" },
  { id: "3", name: "Brioche Buns", unit: "pcs" },
  { id: "4", name: "Cheddar Cheese", unit: "kg" },
  { id: "5", name: "Lettuce", unit: "heads" },
];

export function OrderManagementModal({ isOpen, onClose }: OrderManagementModalProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const handleAddItem = () => {
    if (!selectedItem || quantity <= 0 || !selectedSupplier) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const itemDetails = mockInventoryItems.find(item => item.id === selectedItem);
    if (!itemDetails) return;
    
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: itemDetails.name,
      quantity,
      unit: itemDetails.unit,
      supplier: selectedSupplier
    };
    
    setOrderItems([...orderItems, newItem]);
    
    // Reset form
    setSelectedItem("");
    setQuantity(0);
    setSelectedSupplier("");
    
    toast.success(`Added ${newItem.name} to order`);
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }
    
    toast.success(`Order created with ${orderItems.length} items`);
    setOrderItems([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Create New Order
          </DialogTitle>
          <DialogDescription>
            Create a purchase order for inventory items
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="item">Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger id="item">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {mockInventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {mockSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAddItem}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item to Order
          </Button>
        </div>
        
        {orderItems.length > 0 && (
          <>
            <Separator />
            
            <div className="mt-2">
              <h4 className="mb-2 font-medium">Order Items</h4>
              <div className="max-h-[200px] overflow-y-auto rounded border p-2">
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} • {item.supplier}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmitOrder}>Submit Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
