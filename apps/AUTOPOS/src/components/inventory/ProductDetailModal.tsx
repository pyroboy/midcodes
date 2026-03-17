import { 
    Dialog, 
    DialogContent, 
    DialogFooter
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
  import { 
    FileText, 
    Package, 
    Truck,
    ShoppingCart,
    Tag,
    Car,
    X
  } from "lucide-react";
  import { Product } from "@/types/sales";
  import { Badge } from "@/components/ui/badge";
  import { Separator } from "@/components/ui/separator";
  
  interface ProductDetailModalProps {
    product: Product;
    open: boolean;
    setOpen: (open: boolean) => void;
  }
  
  export const ProductDetailModal = ({ product, open, setOpen }: ProductDetailModalProps) => {
    // Check if this is an auto part
    const isAutoPart = Boolean(product.oem || product.partType || product.vehicleCompatibility);
  
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Header with close button */}
          <div className="absolute right-4 top-4 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left column - Image */}
            <div className="p-6 flex items-center justify-center bg-muted/5">
              <div className="aspect-square w-full max-w-[360px] rounded-md overflow-hidden flex items-center justify-center border">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-muted/10 flex items-center justify-center">
                    {isAutoPart ? (
                      <Car className="h-24 w-24 text-muted-foreground/40" />
                    ) : (
                      <Package className="h-24 w-24 text-muted-foreground/40" />
                    )}
                  </div>
                )}
              </div>
            </div>
  
            {/* Right column - Title and key details */}
            <div className="p-6 pt-10">
              <div className="space-y-5">
                {/* Title and SKU */}
                <div>
                  <h1 className="text-2xl font-bold">{product.name}</h1>
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <span>SKU: {product.sku}</span>
                    <span className="mx-2">•</span>
                    <span>Category: {product.category}</span>
                  </div>
                </div>
  
                {/* Price and Stock */}
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Stock Status</h3>
                    <div className="flex items-center mt-1">
                      <Badge className={`px-3 py-1 text-xs ${
                        product.stock === 0 ? "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800 dark:bg-red-900/20 dark:text-red-300" :
                        product.stock < 20 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" : 
                        "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      }`}>
                        {product.stock === 0 ? "Out of Stock" : 
                         product.stock < 20 ? `Low Stock (${product.stock})` : 
                         `In Stock (${product.stock})`}
                      </Badge>
                    </div>
                  </div>
  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                    <p className="text-3xl font-bold mt-1">₱{product.price.toFixed(2)}</p>
                    {product.cost !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">Cost: ₱{product.cost.toFixed(2)}</p>
                    )}
                  </div>
  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                    <p className="text-sm font-medium mt-1">{product.location || "Not assigned"}</p>
                  </div>
  
                  {isAutoPart && (
                    <div className="pt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        <Car className="h-3 w-3 mr-1" />
                        Auto Part
                      </Badge>
                      
                      {product.partType && (
                        <Badge variant="outline" className="ml-2">
                          {product.partType}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
  
          <Separator />
          
          {/* Tabs section */}
          <div className="p-6 pt-2">
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
                <TabsTrigger value="details" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="inventory" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="specs" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Specs
                </TabsTrigger>
              </TabsList>
  
              <TabsContent value="details" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.description || "No description available for this product."}
                  </p>
                </div>
  
                <div className="grid grid-cols-2 gap-x-12 gap-y-5">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Manufacturer</h3>
                    <p className="text-sm font-medium mt-1">{product.manufacturer || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Barcode</h3>
                    <p className="text-sm font-medium mt-1">{product.barcode || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Unit of Measure</h3>
                    <p className="text-sm font-medium mt-1">{product.unitOfMeasure || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tax Rate</h3>
                    <p className="text-sm font-medium mt-1">{product.taxRate ? `${product.taxRate}%` : "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Product Status</h3>
                    <div className="mt-1">
                      <Badge variant={
                        product.status === "active" ? "default" :
                        product.status === "discontinued" ? "destructive" :
                        product.status === "seasonal" ? "secondary" : "outline"
                      }>
                        {product.status || "active"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Discountable</h3>
                    <p className="text-sm font-medium mt-1">{product.discountable ? "Yes" : "No"}</p>
                  </div>
                </div>
              </TabsContent>
  
              <TabsContent value="inventory" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-x-12 gap-y-5">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Stock</h3>
                    <p className="text-sm font-medium mt-1">{product.stock}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Minimum Stock Level</h3>
                    <p className="text-sm font-medium mt-1">{product.minStockLevel || "Not set"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                    <p className="text-sm font-medium mt-1">₱{product.price.toFixed(2)}</p>
                  </div>
                  
                  {product.cost !== undefined && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Cost</h3>
                      <p className="text-sm font-medium mt-1">₱{product.cost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                {product.suppliers && product.suppliers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Suppliers</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {product.suppliers.map(supplier => (
                        <div key={supplier.id} className="text-sm p-3 border rounded-md bg-muted/5">
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">Code: {supplier.code}</div>
                          {supplier.leadTime && <div className="text-xs text-muted-foreground">Lead time: {supplier.leadTime} days</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
  
              <TabsContent value="specs" className="mt-0 space-y-6">
                {isAutoPart ? (
                  <>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-5">
                      {product.oem && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">OEM Number</h3>
                          <p className="text-sm font-medium mt-1">{product.oem}</p>
                        </div>
                      )}
                      
                      {product.partType && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Part Type</h3>
                          <p className="text-sm font-medium mt-1">{product.partType}</p>
                        </div>
                      )}
                      
                      {product.warranty && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Warranty</h3>
                          <p className="text-sm font-medium mt-1">{product.warranty}</p>
                        </div>
                      )}
                    </div>
  
                    {product.supersession && (
                      <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/20 rounded-md">
                        <h3 className="text-sm font-medium mb-1">Supersession Information</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.supersession.type === "replaced_by" 
                            ? `This part has been replaced by ${product.supersession.partName} (${product.supersession.partSku})`
                            : `This part replaces ${product.supersession.partName} (${product.supersession.partSku})`}
                        </p>
                      </div>
                    )}
  
                    {product.vehicleCompatibility && product.vehicleCompatibility.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Vehicle Compatibility</h3>
                        <div className="space-y-3">
                          {product.vehicleCompatibility.map((compat, index) => (
                            <div key={index} className="p-3 border rounded-md bg-muted/5">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground">Year</h4>
                                  <p className="text-sm font-medium mt-1">{compat.year || "Any"}</p>
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground">Makes</h4>
                                  <p className="text-sm mt-1">{compat.make.join(", ") || "Any"}</p>
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground">Models</h4>
                                  <p className="text-sm mt-1">{compat.model?.join(", ") || "Any"}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No additional specifications available for this product.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
  
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default ProductDetailModal;