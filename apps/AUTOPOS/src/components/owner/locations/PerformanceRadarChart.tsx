
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { locationPerformance } from "./locationData";

export const PerformanceRadarChart = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Location Performance Radar</CardTitle>
        <CardDescription>Comprehensive performance metrics across all locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={locationPerformance}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar name="Downtown" dataKey="Downtown" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="West Side" dataKey="WestSide" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Radar name="North Branch" dataKey="NorthBranch" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
              <Radar name="East End" dataKey="EastEnd" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
