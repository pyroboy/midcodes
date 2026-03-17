
import { Search } from "lucide-react";

export const EmptyOrdersList = () => {
  return (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No orders found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
        Try adjusting your search or filter criteria to find what you're looking for.
      </p>
    </div>
  );
};
