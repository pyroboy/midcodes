
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LocationCardProps {
  id: number;
  name: string;
  address: string;
  status: string;
  stats: {
    sales: string;
    salesTrend: { value: string; positive: boolean };
    inventory: string;
    inventoryTrend: { value: string; positive: boolean };
    staffing: string;
    returns: string;
  };
}

export const LocationCard = ({ id, name, address, status, stats }: LocationCardProps) => {
  return (
    <Card key={id} className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">{name}</CardTitle>
            <CardDescription>{address}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Sales (MTD)</p>
            <div className="flex items-center mt-1">
              <p className="font-semibold">{stats.sales}</p>
              <span className={`text-xs ml-2 ${stats.salesTrend.positive ? 'text-green-500' : 'text-red-500'}`}>
                {stats.salesTrend.positive ? '↑' : '↓'} {stats.salesTrend.value}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inventory</p>
            <div className="flex items-center mt-1">
              <p className="font-semibold">{stats.inventory}</p>
              <span className={`text-xs ml-2 ${stats.inventoryTrend.positive ? 'text-green-500' : 'text-red-500'}`}>
                {stats.inventoryTrend.positive ? '↑' : '↓'} {stats.inventoryTrend.value}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Staffing</p>
            <p className="font-semibold">{stats.staffing}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Returns</p>
            <p className="font-semibold">{stats.returns}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
