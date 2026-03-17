
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { efficiencyMetrics } from "./locationData";

export const EfficiencyMetricsTable = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Operational Efficiency Metrics</CardTitle>
        <CardDescription>Key performance indicators across all locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Downtown</TableHead>
                <TableHead>West Side</TableHead>
                <TableHead>North Branch</TableHead>
                <TableHead>East End</TableHead>
                <TableHead>Average</TableHead>
                <TableHead>Best Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {efficiencyMetrics.map((item, index) => {
                // Calculate average and best location
                const values = [item.Downtown, item.WestSide, item.NorthBranch, item.EastEnd];
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                
                let bestLocation = "";
                let bestValue = item.metric === "Processing Time (min)" || item.metric === "Return Rate (%)" 
                  ? Math.min(...values)
                  : Math.max(...values);
                
                if (bestValue === item.Downtown) bestLocation = "Downtown";
                else if (bestValue === item.WestSide) bestLocation = "West Side";
                else if (bestValue === item.NorthBranch) bestLocation = "North Branch";
                else if (bestValue === item.EastEnd) bestLocation = "East End";
                
                return (
                  <TableRow key={item.metric} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{item.metric}</TableCell>
                    <TableCell>{item.Downtown}</TableCell>
                    <TableCell>{item.WestSide}</TableCell>
                    <TableCell>{item.NorthBranch}</TableCell>
                    <TableCell>{item.EastEnd}</TableCell>
                    <TableCell>{average.toFixed(1)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {bestLocation}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
