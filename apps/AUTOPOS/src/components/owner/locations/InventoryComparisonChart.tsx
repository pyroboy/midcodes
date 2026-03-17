
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { inventoryComparisonData } from "./locationData";

export const InventoryComparisonChart = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Inventory Level Comparison</CardTitle>
        <CardDescription>Stock levels by category across all locations (%)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Downtown" fill="#8884d8" name="Downtown" />
              <Bar dataKey="WestSide" fill="#82ca9d" name="West Side" />
              <Bar dataKey="NorthBranch" fill="#ffc658" name="North Branch" />
              <Bar dataKey="EastEnd" fill="#ff8042" name="East End" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
