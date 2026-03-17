import { useState, useEffect, useContext } from "react";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Search,
  Car
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_PRODUCTS } from "@/data/mockData";
import { Product } from "@/types/sales";
import { StockFilters } from "./StockStatusSidebar";
import { useParams } from "react-router-dom";
import { InventoryContext } from "@/contexts/InventoryContext";
import { ProductDetailModal } from "./ProductDetailModal";

interface StockStatusProps {
  stockFilters?: StockFilters | null;
}

export const StockStatus = ({ stockFilters }: StockStatusProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  const params = useParams();
  const inventoryContext = useContext(InventoryContext);
  
  // Use filters from props or context
  const filters = stockFilters || inventoryContext.stockFilters;

  // Load mock products
  useEffect(() => {
    setProducts(MOCK_PRODUCTS);
    setFilteredProducts(MOCK_PRODUCTS);
  }, []);

  // Apply search and filters
  useEffect(() => {
    let result = [...products];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sidebar filters if available
    if (filters) {
      // Filter by categories
      if (filters.categories.length > 0) {
        result = result.filter(product => 
          filters.categories.includes(product.category)
        );
      }
      
      // Filter by manufacturers
      if (filters.manufacturers.length > 0) {
        result = result.filter(product => 
          filters.manufacturers.includes(product.manufacturer || '')
        );
      }
      
      // Filter by price range
      if (filters.priceRange && filters.priceRange.length === 2) {
        const [min, max] = filters.priceRange;
        result = result.filter(product => 
          product.price >= min && product.price <= max
        );
      }
      
      // Filter by stock status
      if (filters.stockStatus.length > 0) {
        result = result.filter(product => {
          if (filters.stockStatus.includes('in-stock') && product.stock > 20) return true;
          if (filters.stockStatus.includes('low-stock') && product.stock > 0 && product.stock <= 20) return true;
          if (filters.stockStatus.includes('out-of-stock') && product.stock === 0) return true;
          return false;
        });
      }
      
      // Filter by locations
      if (filters.locations.length > 0) {
        result = result.filter(product => 
          product.location && filters.locations.includes(product.location)
        );
      }
    }
    
    setFilteredProducts(result);
  }, [searchTerm, products, filters]);

  const handleCardClick = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  // Get stock statistics
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 20).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalProducts = products.length;

  // Check if a product is an auto part
  const isAutoPart = (product: Product) => {
    return Boolean(product.oem || product.partType || product.vehicleCompatibility);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <h3 className="text-2xl font-bold">{totalProducts}</h3>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
              <h3 className="text-2xl font-bold">{totalStock}</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
              <h3 className="text-2xl font-bold">{lowStockCount}</h3>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
              <h3 className="text-2xl font-bold">{outOfStockCount}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Quick search products by name or SKU..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
              onClick={() => handleCardClick(product)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                    {isAutoPart(product) ? (
                      <Car className="h-8 w-8 text-blue-500" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-sm">{product.name}</h3>
                        {isAutoPart(product) && (
                          <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs">
                            Auto Part
                          </Badge>
                        )}
                      </div>
                      
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.stock === 0 ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
                        product.stock < 20 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" : 
                        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      }`}>
                        {product.stock === 0 ? "Out of Stock" : 
                         product.stock < 20 ? "Low Stock" : "In Stock"}
                      </div>
                    </div>
                    
                    <div className="mt-1 text-xs text-muted-foreground">
                      SKU: {product.sku} | {product.category}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">₱{product.price.toFixed(2)}</span>
                      <span className="text-sm">Stock: {product.stock}</span>
                    </div>
                    
                    {isAutoPart(product) && product.oem && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        OEM: {product.oem}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3 py-8 text-center text-muted-foreground">
            No products found matching your criteria.
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={detailModalOpen}
          setOpen={setDetailModalOpen}
        />
      )}
    </div>
  );
};

export default StockStatus;