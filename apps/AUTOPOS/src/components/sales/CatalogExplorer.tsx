
import { useState, useEffect } from "react";
import { Search, Filter, Plus, Camera, Package, MapPin, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/types/sales";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_MANUFACTURERS } from "@/data/mockData";
import { PartRecognition } from "./PartRecognition";
import { Badge } from "@/components/ui/badge";
import { ScaleIn } from "@/components/ui/motion/Transitions";
import { formatCurrency } from "@/lib/formatters";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ProductDetailModal } from "./ProductDetailModal";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

interface CatalogExplorerProps {
  onAddToCart: (product: Product) => void;
}

export const CatalogExplorer = ({ onAddToCart }: CatalogExplorerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [showFilters, setShowFilters] = useState(false);
  const [showPartRecognition, setShowPartRecognition] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "lowStock" | "outOfStock">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const maxPrice = Math.max(...MOCK_PRODUCTS.map(p => p.price));

  useEffect(() => {
    let filtered = [...MOCK_PRODUCTS];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.sku.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (selectedManufacturer) {
      filtered = filtered.filter(product => product.manufacturer === selectedManufacturer);
    }
    
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    if (stockFilter === "inStock") {
      filtered = filtered.filter(product => product.stock > 0);
    } else if (stockFilter === "lowStock") {
      filtered = filtered.filter(product => product.stock > 0 && product.stock <= 15);
    } else if (stockFilter === "outOfStock") {
      filtered = filtered.filter(product => product.stock === 0);
    }
    
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "price") {
        return sortOrder === "asc"
          ? a.price - b.price
          : b.price - a.price;
      } else {
        return sortOrder === "asc"
          ? a.stock - b.stock
          : b.stock - a.stock;
      }
    });
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, selectedManufacturer, sortBy, sortOrder, priceRange, stockFilter]);

  const togglePartRecognition = () => {
    setShowPartRecognition(!showPartRecognition);
  };

  const toggleBarcodeScanner = () => {
    setShowBarcodeScanner(!showBarcodeScanner);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedManufacturer(null);
    setPriceRange([0, maxPrice]);
    setStockFilter("all");
    setSortBy("name");
    setSortOrder("asc");
    setSearchQuery("");
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleProductFound = (product: Product) => {
    // Show the product details modal
    setSelectedProduct(product);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts by name, SKU, or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={showBarcodeScanner ? "default" : "outline"}
            size="icon"
            onClick={toggleBarcodeScanner}
            className="flex-shrink-0"
            title="Barcode Scanner"
          >
            <Barcode className="h-4 w-4" />
          </Button>
          
          <Button 
            variant={showPartRecognition ? "default" : "outline"}
            size="icon"
            onClick={togglePartRecognition}
            className="flex-shrink-0"
            title="Part Recognition"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2 flex-shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>
      </div>
      
      {showPartRecognition && (
        <div className="border rounded-lg p-4 bg-background">
          <PartRecognition onAddToCart={onAddToCart} />
        </div>
      )}
      
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Filters</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-xs"
              >
                Reset Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={selectedCategory || "all"}
                  onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {MOCK_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Manufacturer</label>
                <Select
                  value={selectedManufacturer || "all"}
                  onValueChange={(value) => setSelectedManufacturer(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Manufacturers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Manufacturers</SelectItem>
                    {MOCK_MANUFACTURERS.map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Stock Status</label>
                <Select
                  value={stockFilter}
                  onValueChange={(value: "all" | "inStock" | "lowStock" | "outOfStock") => setStockFilter(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="inStock">In Stock</SelectItem>
                    <SelectItem value="lowStock">Low Stock (≤ 15)</SelectItem>
                    <SelectItem value="outOfStock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  <Select
                    value={sortBy}
                    onValueChange={(value: "name" | "price" | "stock") => setSortBy(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="flex-shrink-0"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">
                  Price Range: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                </label>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={100}
                  value={priceRange}
                  onValueChange={(value: [number, number]) => setPriceRange(value)}
                  className="mt-6"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ScaleIn key={product.id}>
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square w-full bg-accent flex items-center justify-center overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium line-clamp-2">{product.name}</h3>
                      <div className="text-sm font-bold text-primary">{formatCurrency(product.price)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{product.sku}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <MapPin className="h-3 w-3 mr-1" /> 
                            {product.location}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">Location: {product.location}</p>
                            <p>Aisle: {product.location?.split('-')[0]}</p>
                            <p>Shelf: {product.location?.split('-')[1]}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <Button 
                        size="sm" 
                        className={product.stock <= 0 ? "opacity-50" : ""}
                        disabled={product.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScaleIn>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Parts Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={onAddToCart}
      />
      
      <BarcodeScannerModal
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onProductFound={handleProductFound}
        products={MOCK_PRODUCTS}
      />
    </div>
  );
};
