
import { useState } from "react";
import { 
  Edit, 
  PackagePlus, 
  PackageMinus, 
  Package, 
  Save,
  RefreshCw,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "@/data/mockData";
import { Product } from "@/types/sales";

// Adjustment types
type AdjustmentType = "add" | "remove" | "set";

// Adjustment reason options
const ADJUSTMENT_REASONS = [
  "Inventory Count",
  "Damaged Goods",
  "Internal Use",
  "Returned to Vendor",
  "System Error",
  "Other"
];

export const InventoryAdjustment = () => {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>("");
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter products based on search
  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle adjustment
  const handleAdjustment = () => {
    if (!selectedProduct) return;
    
    // Validate quantity
    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    // Validate reason
    if (!adjustmentReason) {
      toast.error("Please select an adjustment reason");
      return;
    }
    
    // Calculate new stock level
    let newStock: number;
    
    switch (adjustmentType) {
      case "add":
        newStock = selectedProduct.stock + quantity;
        break;
      case "remove":
        newStock = Math.max(0, selectedProduct.stock - quantity);
        if (newStock !== selectedProduct.stock - quantity) {
          toast.warning("Stock cannot be negative. Set to 0 instead.");
        }
        break;
      case "set":
        newStock = quantity;
        break;
      default:
        newStock = selectedProduct.stock;
    }
    
    // Update product
    const updatedProducts = products.map(product =>
      product.id === selectedProduct.id
        ? { ...product, stock: newStock }
        : product
    );
    
    setProducts(updatedProducts);
    
    // Show success message
    toast.success("Inventory adjusted successfully", {
      description: `${selectedProduct.name} - ${
        adjustmentType === "add"
          ? `Added ${quantity} units`
          : adjustmentType === "remove"
          ? `Removed ${quantity} units`
          : `Set to ${quantity} units`
      }`
    });
    
    // Reset form and close dialog
    resetForm();
  };
  
  // Reset form
  const resetForm = () => {
    setSelectedProduct(null);
    setAdjustmentType("add");
    setAdjustmentQuantity("");
    setAdjustmentReason("");
    setAdjustmentNotes("");
    setDialogOpen(false);
  };
  
  // Open adjustment dialog for a product
  const openAdjustmentDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentType("add");
    setAdjustmentQuantity("");
    setAdjustmentReason("");
    setAdjustmentNotes("");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Inventory Adjustment</h2>
        
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
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
                  <th className="text-left p-4 text-sm font-medium">SKU</th>
                  <th className="text-left p-4 text-sm font-medium">Product</th>
                  <th className="text-left p-4 text-sm font-medium">Category</th>
                  <th className="text-right p-4 text-sm font-medium">Price</th>
                  <th className="text-center p-4 text-sm font-medium">Current Stock</th>
                  <th className="text-right p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-muted/20">
                    <td className="p-4 text-sm">{product.sku}</td>
                    <td className="p-4 text-sm font-medium">{product.name}</td>
                    <td className="p-4 text-sm">{product.category}</td>
                    <td className="p-4 text-sm text-right">${product.price.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock === 0
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : product.stock < 20
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openAdjustmentDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No products found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            {selectedProduct && (
              <DialogDescription>
                {selectedProduct.name} (SKU: {selectedProduct.sku})
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 my-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Stock:</span>
                <span className="font-bold">{selectedProduct.stock}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Type</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={adjustmentType === "add" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setAdjustmentType("add")}
                  >
                    <PackagePlus className="h-4 w-4" />
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant={adjustmentType === "remove" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setAdjustmentType("remove")}
                  >
                    <PackageMinus className="h-4 w-4" />
                    Remove
                  </Button>
                  <Button
                    type="button"
                    variant={adjustmentType === "set" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setAdjustmentType("set")}
                  >
                    <Package className="h-4 w-4" />
                    Set
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="Enter quantity"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium">
                  Reason
                </label>
                <select
                  id="reason"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                >
                  <option value="">Select reason</option>
                  {ADJUSTMENT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Add adjustment notes..."
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                />
              </div>
              
              <div className="bg-muted/20 rounded-md p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">New Stock Level:</span>
                  <span className="font-bold">
                    {adjustmentType === "add" && adjustmentQuantity
                      ? selectedProduct.stock + parseInt(adjustmentQuantity || "0")
                      : adjustmentType === "remove" && adjustmentQuantity
                      ? Math.max(0, selectedProduct.stock - parseInt(adjustmentQuantity || "0"))
                      : adjustmentType === "set" && adjustmentQuantity
                      ? parseInt(adjustmentQuantity || "0")
                      : selectedProduct.stock}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAdjustment}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
