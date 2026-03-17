
import { Order } from "@/types/sales";

// Helper functions for orders
export const getCustomerName = (customerId: string) => {
  const customerMap: {[key: string]: string} = {
    "CUST-001": "John Smith",
    "CUST-002": "Jane Doe",
    "CUST-003": "Alex Johnson"
  };
  
  return customerMap[customerId] || "Unknown Customer";
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "cancelled":
      return "destructive";
    default:
      return "outline bg-amber-500 text-white";
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Mock data for order retrieval
export const mockOrdersHistory: Order[] = [
  {
    id: "ORD-1001",
    customerId: "CUST-001",
    items: [
      {
        product: {
          id: "PROD-001",
          name: "Brake Pad Set",
          description: "High-performance brake pads for sedans",
          price: 45.99,
          category: "Brakes",
          sku: "BP-S-001",
          imageUrl: "/placeholder.svg",
          stock: 28,
          manufacturer: "StopTech",
          location: "A1-B2"
        },
        quantity: 1
      },
      {
        product: {
          id: "PROD-002",
          name: "Oil Filter",
          description: "Premium oil filter for most vehicles",
          price: 8.99,
          category: "Filters",
          sku: "OF-P-002",
          imageUrl: "/placeholder.svg",
          stock: 45,
          manufacturer: "Fram",
          location: "A3-B4"
        },
        quantity: 2
      }
    ],
    total: 63.97,
    status: "completed",
    date: "2023-08-14T14:30:00Z"
  },
  {
    id: "ORD-1002",
    customerId: "CUST-002",
    items: [
      {
        product: {
          id: "PROD-003",
          name: "Spark Plug Set",
          description: "Set of 4 high-performance spark plugs",
          price: 22.99,
          category: "Ignition",
          sku: "SP-HP-003",
          imageUrl: "/placeholder.svg",
          stock: 30,
          manufacturer: "NGK",
          location: "C1-D2"
        },
        quantity: 1
      }
    ],
    total: 22.99,
    status: "cancelled",
    date: "2023-08-13T15:45:00Z"
  },
  {
    id: "ORD-1003",
    customerId: "CUST-003",
    items: [
      {
        product: {
          id: "PROD-004",
          name: "Windshield Wiper Blades",
          description: "All-season windshield wiper blades (pair)",
          price: 34.99,
          category: "Exterior",
          sku: "WW-AS-004",
          imageUrl: "/placeholder.svg",
          stock: 22,
          manufacturer: "Rain-X",
          location: "E1-F2"
        },
        quantity: 1
      },
      {
        product: {
          id: "PROD-005",
          name: "Air Filter",
          description: "Engine air filter for improved performance",
          price: 12.99,
          category: "Filters",
          sku: "AF-EP-005",
          imageUrl: "/placeholder.svg",
          stock: 38,
          manufacturer: "K&N",
          location: "A5-B6"
        },
        quantity: 1
      },
      {
        product: {
          id: "PROD-006",
          name: "Synthetic Oil (5qt)",
          description: "Full synthetic motor oil 5W-30",
          price: 28.99,
          category: "Fluids",
          sku: "SO-5W30-006",
          imageUrl: "/placeholder.svg",
          stock: 42,
          manufacturer: "Mobil 1",
          location: "G1-H2"
        },
        quantity: 1
      }
    ],
    total: 76.97,
    status: "completed",
    date: "2023-08-12T16:20:00Z"
  },
  {
    id: "ORD-1004",
    customerId: "CUST-001",
    items: [
      {
        product: {
          id: "PROD-007",
          name: "Headlight Bulbs (Pair)",
          description: "LED headlight replacement bulbs",
          price: 39.99,
          category: "Lighting",
          sku: "HB-LED-007",
          imageUrl: "/placeholder.svg",
          stock: 18,
          manufacturer: "Sylvania",
          location: "J1-K2"
        },
        quantity: 1
      }
    ],
    total: 39.99,
    status: "completed",
    date: "2023-08-10T09:15:00Z"
  },
  {
    id: "ORD-1005",
    customerId: "CUST-002",
    items: [
      {
        product: {
          id: "PROD-008",
          name: "Car Battery",
          description: "High-performance automotive battery",
          price: 129.99,
          category: "Electrical",
          sku: "CB-HP-008",
          imageUrl: "/placeholder.svg",
          stock: 12,
          manufacturer: "DieHard",
          location: "L1-M2"
        },
        quantity: 1
      }
    ],
    total: 129.99,
    status: "completed",
    date: "2023-08-09T11:30:00Z"
  }
];
