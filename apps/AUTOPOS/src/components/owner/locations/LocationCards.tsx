
import { LocationCard } from "./LocationCard";
import { locations, locationStats } from "./locationData";

export const LocationCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {locations.map((location) => {
        // Fix the error by ensuring we have a valid stats object
        // Use a type assertion to ensure TypeScript knows the key exists
        const stats = locationStats[location.name as keyof typeof locationStats] || {
          sales: "N/A",
          salesTrend: { value: "0%", positive: false },
          inventory: "N/A",
          inventoryTrend: { value: "0%", positive: false },
          staffing: "N/A",
          returns: "N/A"
        };
        
        return (
          <LocationCard
            key={location.id}
            id={location.id}
            name={location.name}
            address={location.address}
            status={location.status}
            stats={stats}
          />
        );
      })}
    </div>
  );
};
