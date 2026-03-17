import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/types/sales";

interface ProductTableProps {
  products: Product[];
  title?: string;
}

export const RecentProducts = ({ products, title = "Products" }: ProductTableProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">
          {title}
          <span className="text-sm text-muted-foreground ml-2">
            ({products.length} products)
          </span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 text-sm">Name</th>
                <th className="text-left p-2 text-sm">SKU</th>
                <th className="text-left p-2 text-sm">Category</th>
                <th className="text-left p-2 text-sm">Location</th>
                <th className="text-right p-2 text-sm">Price</th>
                <th className="text-right p-2 text-sm">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.slice(0, 10).map((product) => (
                <tr key={product.id} className="hover:bg-muted/20">
                  <td className="p-2 text-sm">{product.name}</td>
                  <td className="p-2 text-sm text-muted-foreground">{product.sku}</td>
                  <td className="p-2 text-sm">{product.category}</td>
                  <td className="p-2 text-sm text-muted-foreground">{product.location || 'Not assigned'}</td>
                  <td className="p-2 text-sm text-right font-medium">₱{product.price.toFixed(2)}</td>
                  <td className="p-2 text-sm text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.stock === 0 ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
                      product.stock < 10 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" : 
                      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No products to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentProducts;