import { useState } from "react";
import { 
  FileText, 
  Tag, 
  PackagePlus, 
  Info, 
  Truck,
  Save,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_CATEGORIES } from "@/data/mockData";
import { toast } from "sonner";
import { Product } from "@/types/sales";

interface ProductEntryModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onProductAdded: (product: Product) => void;
}

export const ProductEntryModal = ({ 
  open, 
  setOpen, 
  onProductAdded 
}: ProductEntryModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    sku: "",
    stock: "",
    manufacturer: "",
    imageUrl: "/placeholder.svg",
    location: "",
    
    // Universal product fields
    barcode: "",
    taxRate: "",
    discountable: false,
    unitOfMeasure: "",
    minStockLevel: "",
    status: "active" as 'active' | 'discontinued' | 'seasonal' | 'backordered',
    
    // Cost information
    cost: "",
    
    // Auto-specific fields
    oem: "",
    partType: "OEM" as 'OEM' | 'aftermarket' | 'remanufactured' | 'performance',
    warranty: "",
    
    // Compatibility and supersession
    year: "",
    make: "",
    model: "",
    supersessionType: "",
    supersessionPartSku: "",
    supersessionPartName: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.price || !formData.sku || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    // Create supersession object if applicable
    let supersession = undefined;
    if (formData.supersessionType && formData.supersessionPartSku && formData.supersessionPartName) {
      supersession = {
        type: formData.supersessionType as 'replaced_by' | 'replaces',
        partSku: formData.supersessionPartSku,
        partName: formData.supersessionPartName
      };
    }

    // Create vehicle compatibility array if applicable
    let vehicleCompatibility = undefined;
    if (formData.year || formData.make || formData.model) {
      vehicleCompatibility = [{
        year: formData.year,
        make: formData.make ? formData.make.split(',').map(m => m.trim()) : [],
        model: formData.model ? formData.model.split(',').map(m => m.trim()) : []
      }];
    }

    // Create new product
    const newProduct: Product = {
      id: `p${Date.now()}`,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price || "0"),
      category: formData.category,
      sku: formData.sku,
      imageUrl: formData.imageUrl,
      stock: parseInt(formData.stock || "0"),
      manufacturer: formData.manufacturer || undefined,
      location: formData.location,
      
      // Universal product fields
      barcode: formData.barcode || undefined,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
      discountable: formData.discountable,
      unitOfMeasure: formData.unitOfMeasure || undefined,
      minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : undefined,
      status: formData.status,
      
      // Cost information
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      
      // Auto-specific fields
      vehicleCompatibility,
      oem: formData.oem || undefined,
      partType: formData.partType,
      warranty: formData.warranty || undefined,
      supersession
    };

    // Pass the new product to parent component
    onProductAdded(newProduct);
    
    // Show success message
    toast.success("Product added successfully");
    
    // Reset form and close dialog
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      sku: "",
      stock: "",
      manufacturer: "",
      imageUrl: "/placeholder.svg",
      location: "",
      
      barcode: "",
      taxRate: "",
      discountable: false,
      unitOfMeasure: "",
      minStockLevel: "",
      status: "active" as 'active' | 'discontinued' | 'seasonal' | 'backordered',
      
      cost: "",
      
      oem: "",
      partType: "OEM" as 'OEM' | 'aftermarket' | 'remanufactured' | 'performance',
      warranty: "",
      
      year: "",
      make: "",
      model: "",
      supersessionType: "",
      supersessionPartSku: "",
      supersessionPartName: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the product details to add it to your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="basic" className="gap-2">
                <FileText className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <Tag className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2">
                <PackagePlus className="h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="compatibility" className="gap-2">
                <Truck className="h-4 w-4" />
                Compatibility
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Product Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="sku" className="text-sm font-medium">
                    SKU *
                  </label>
                  <Input
                    id="sku"
                    name="sku"
                    placeholder="Product SKU (e.g. BP-2234)"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Product description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price (₱) *
                  </label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    {MOCK_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="manufacturer" className="text-sm font-medium">
                    Manufacturer
                  </label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    placeholder="Manufacturer name"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="barcode" className="text-sm font-medium">
                    Barcode
                  </label>
                  <Input
                    id="barcode"
                    name="barcode"
                    placeholder="Product barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="oem" className="text-sm font-medium">
                    OEM Number
                  </label>
                  <Input
                    id="oem"
                    name="oem"
                    placeholder="OEM reference number"
                    value={formData.oem}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="partType" className="text-sm font-medium">
                    Part Type
                  </label>
                  <select
                    id="partType"
                    name="partType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.partType}
                    onChange={handleInputChange}
                  >
                    <option value="OEM">OEM</option>
                    <option value="aftermarket">Aftermarket</option>
                    <option value="remanufactured">Remanufactured</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="warranty" className="text-sm font-medium">
                    Warranty
                  </label>
                  <Input
                    id="warranty"
                    name="warranty"
                    placeholder="e.g. 1 year limited"
                    value={formData.warranty}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="unitOfMeasure" className="text-sm font-medium">
                    Unit of Measure
                  </label>
                  <Input
                    id="unitOfMeasure"
                    name="unitOfMeasure"
                    placeholder="e.g. each, pair, set"
                    value={formData.unitOfMeasure}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="imageUrl" className="text-sm font-medium">
                  Image URL
                </label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="/placeholder.svg"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Product Image Preview</p>
                <div className="border rounded-md p-4 flex items-center justify-center">
                  {formData.imageUrl ? (
                    <img 
                      src={formData.imageUrl} 
                      alt="Product preview" 
                      className="h-32 w-32 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="h-32 w-32 bg-muted rounded-md flex items-center justify-center">
                      <Info className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Supersession Information</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <select
                      id="supersessionType"
                      name="supersessionType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.supersessionType}
                      onChange={handleInputChange}
                    >
                      <option value="">No supersession</option>
                      <option value="replaced_by">Replaced by</option>
                      <option value="replaces">Replaces</option>
                    </select>
                  </div>
                  
                  <div>
                    <Input
                      id="supersessionPartSku"
                      name="supersessionPartSku"
                      placeholder="Related Part SKU"
                      value={formData.supersessionPartSku}
                      onChange={handleInputChange}
                      disabled={!formData.supersessionType}
                    />
                  </div>
                  
                  <div>
                    <Input
                      id="supersessionPartName"
                      name="supersessionPartName"
                      placeholder="Related Part Name"
                      value={formData.supersessionPartName}
                      onChange={handleInputChange}
                      disabled={!formData.supersessionType}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="stock" className="text-sm font-medium">
                    Initial Stock Quantity
                  </label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="minStockLevel" className="text-sm font-medium">
                    Minimum Stock Level
                  </label>
                  <Input
                    id="minStockLevel"
                    name="minStockLevel"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.minStockLevel}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cost" className="text-sm font-medium">
                    Cost (₱)
                  </label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="taxRate" className="text-sm font-medium">
                    Tax Rate (%)
                  </label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Product Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="backordered">Backordered</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Discountable</label>
                  <div className="flex items-center h-10 space-x-2">
                    <input
                      type="checkbox"
                      id="discountable"
                      name="discountable"
                      checked={formData.discountable}
                      onChange={(e) => 
                        setFormData({
                          ...formData,
                          discountable: e.target.checked
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="discountable" className="text-sm text-muted-foreground">
                      Product can be discounted
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Storage Location
                </label>
                <div className="relative">
                  <MapPin className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g. Aisle 3-B"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="compatibility" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">
                  Compatible Years
                </label>
                <Input
                  id="year"
                  name="year"
                  placeholder="e.g. 2015-2020"
                  value={formData.year}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="make" className="text-sm font-medium">
                  Compatible Makes
                </label>
                <Input
                  id="make"
                  name="make"
                  placeholder="e.g. Toyota, Honda (comma separated)"
                  value={formData.make}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="model" className="text-sm font-medium">
                  Compatible Models
                </label>
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g. Corolla, Civic (comma separated)"
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="p-4 border rounded-md bg-muted/20">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Enter makes and models as comma-separated values. For more complex vehicle compatibility, use the advanced management features.
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Save Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEntryModal;