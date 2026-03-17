import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_PRODUCTS } from "@/data/mockData";
import { RecentProducts } from "./RecentProducts";
import { ProductEntryModal } from "./ProductEntryModal";
import { Product } from "@/types/sales";

export const ProductEntry = () => {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  
  // Filter products based on search term
  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleProductAdded = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Product Management</h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 w-[250px]"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
          
          <ProductEntryModal
            open={modalOpen}
            setOpen={setModalOpen}
            onProductAdded={handleProductAdded}
          />
        </div>
      </div>
      
      <RecentProducts 
        products={filteredProducts} 
        title={searchTerm ? "Search Results" : "Recent Products"} 
      />
    </div>
  );
};

export default ProductEntry;