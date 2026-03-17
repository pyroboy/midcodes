import { Product } from "@/types/sales";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { 
  MapPin, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Truck, 
  ShieldCheck, 
  Tag, 
  Barcode, 
  TrendingUp, 
  Clock, 
  Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductDetailModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart 
}: ProductDetailModalProps) => {
  if (!product) return null;

  const handleAddToCart = () => {
    if (onAddToCart && product) {
      onAddToCart(product);
      onClose();
    }
  };

  // Check if vehicle compatibility exists and has items
  const hasVehicleCompatibility = product.vehicleCompatibility && 
    product.vehicleCompatibility.length > 0;

  // Check if supplier info exists
  const hasSuppliers = product.suppliers && product.suppliers.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            Product details and specifications
            {product.status && product.status !== 'active' && (
              <Badge variant="outline" className="ml-2 capitalize">
                {product.status}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-4">
            <div className="aspect-square rounded-lg border bg-accent flex items-center justify-center overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Location: {product.location}</span>
            </div>

            {product.manufacturer && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Manufacturer: {product.manufacturer}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{product.category}</Badge>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">SKU: {product.sku}</span>
                  </div>
                  
                  {product.partType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Part Type:</span> 
                      <Badge variant="secondary" className="capitalize">
                        {product.partType}
                      </Badge>
                    </div>
                  )}
                  
                  {product.barcode && (
                    <div className="flex items-center gap-2 text-sm">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Barcode:</span> {product.barcode}
                    </div>
                  )}
                  
                  {product.oem && (
                    <div className="text-sm">
                      <span className="font-medium">OEM Number:</span> {product.oem}
                    </div>
                  )}
                  
                  {product.unitOfMeasure && (
                    <div className="text-sm">
                      <span className="font-medium">Unit of Measure:</span> {product.unitOfMeasure}
                    </div>
                  )}
                  
                  {product.warranty && (
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Warranty:</span> {product.warranty}
                    </div>
                  )}
                </div>

                {product.supersession && (
                  <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Supersession Notice</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {product.supersession.type === 'replaced_by' ? 'Replaced by' : 'Replaces'}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{product.supersession.partName} ({product.supersession.partSku})</span>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="compatibility" className="space-y-4 py-4">
                {hasVehicleCompatibility ? (
                  <div className="space-y-3">
                    {product.vehicleCompatibility.map((compat, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline">{compat.year}</Badge>
                          {compat.make.map((makeName, makeIndex) => (
                            <Badge key={makeIndex} variant="secondary">{makeName}</Badge>
                          ))}
                        </div>
                        {compat.model && compat.model.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Models:</span>{" "}
                            {compat.model.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No specific vehicle compatibility information available.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="inventory" className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Stock Level:</span>{" "}
                    <span className={`font-bold ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                      {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
                    </span>
                  </div>
                  
                  {product.minStockLevel !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Min Stock Level:</span>{" "}
                      <span>{product.minStockLevel}</span>
                    </div>
                  )}
                  
                  {product.taxRate !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Tax Rate:</span>{" "}
                      <span>{product.taxRate}%</span>
                    </div>
                  )}
                  
                  {product.discountable !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Discountable:</span>{" "}
                      <span>{product.discountable ? "Yes" : "No"}</span>
                    </div>
                  )}
                  
                  {product.cost !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Cost:</span>{" "}
                      <span>{formatCurrency(product.cost)}</span>
                    </div>
                  )}
                </div>
                
                {hasSuppliers && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Suppliers</h4>
                    <div className="space-y-2">
                      {product.suppliers.slice(0, 3).map((supplier) => (
                        <div key={supplier.id} className="flex items-center justify-between text-sm p-2 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <span>{supplier.name}</span>
                            {supplier.preferredSupplier && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {supplier.leadTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{supplier.leadTime}d</span>
                              </div>
                            )}
                            <Badge 
                              variant={supplier.status === "active" ? "outline" : "secondary"}
                              className="text-xs"
                            >
                              {supplier.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {product.suppliers.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center mt-1">
                          +{product.suppliers.length - 3} more suppliers
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {onAddToCart && (
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add to Cart
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};