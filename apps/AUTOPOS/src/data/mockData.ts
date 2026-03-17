import { Product, Customer, Order } from "@/types/sales";
import { PRODUCTS_BATCH_1 } from "./products1";
import { PRODUCTS_BATCH_2 } from "./products2";
import { PRODUCTS_BATCH_3 } from "./products3";
import { PRODUCTS_BATCH_4 } from "./products4";
import { PRODUCTS_BATCH_5 } from "./products5";
import { PRODUCTS_BATCH_6 } from "./products6";
import { PRODUCTS_BATCH_7 } from "./products7";
import { PRODUCTS_BATCH_8 } from "./products8";
import { PRODUCTS_BATCH_9 } from "./products9";
import { PRODUCTS_BATCH_10 } from "./products10";

// Enhanced Product Interface


// Mock Products
export const MOCK_PRODUCTS: Product[] = [
  ...PRODUCTS_BATCH_1,
  ...PRODUCTS_BATCH_2,
  ...PRODUCTS_BATCH_3,
  ...PRODUCTS_BATCH_4,
  ...PRODUCTS_BATCH_5,
  ...PRODUCTS_BATCH_6,
  ...PRODUCTS_BATCH_7,
  ...PRODUCTS_BATCH_8,
  ...PRODUCTS_BATCH_9,
  ...PRODUCTS_BATCH_10
];
// Add more categories
export const MOCK_CATEGORIES = [
  "Brakes",
  "Filters",
  "Ignition",
  "Fluids",
  "Exterior",
  "Electrical",
  "Suspension"
];

// Add manufacturers for filtering
export const MOCK_MANUFACTURERS = [
  "StopTech",
  "FilterCraft",
  "FirePower",
  "LubeMax",
  "ClearView",
  "TurboFlow",
  "BrightBeam",
  "PowerGen",
  "RollerTech",
  "PowerCell",
  "ShiftSmooth"
];

// Mock Customers
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, CA 90210",
    loyaltyLevel: "gold"
  },
  {
    id: "c2",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 987-6543",
    address: "456 Oak Ave, Somewhere, CA 92101",
    loyaltyLevel: "silver"
  },
  {
    id: "c3",
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "(555) 567-8901",
    address: "789 Pine Rd, Nowhere, CA 94103",
    loyaltyLevel: "bronze"
  },
  {
    id: "c4",
    name: "Lisa Rodriguez",
    email: "lisa.r@example.com",
    phone: "(555) 234-5678",
    address: "321 Cedar St, Anyplace, CA 95814",
    loyaltyLevel: "platinum"
  },
  {
    id: "c5",
    name: "David Williams",
    email: "david.w@example.com",
    phone: "(555) 345-6789",
    address: "654 Birch Dr, Someplace, CA 90007"
  }
];

// Mock Orders
export const MOCK_ORDERS: Order[] = [
  {
    id: "o1001",
    customerId: "c1",
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 1 },
      { product: MOCK_PRODUCTS[3], quantity: 2 }
    ],
    total: 153.97,
    status: "completed",
    date: "2023-05-15T14:30:00Z"
  },
  {
    id: "o1002",
    customerId: "c2",
    items: [
      { product: MOCK_PRODUCTS[5], quantity: 1 },
      { product: MOCK_PRODUCTS[6], quantity: 1 }
    ],
    total: 69.98,
    status: "completed",
    date: "2023-06-22T10:15:00Z"
  },
  {
    id: "o1003",
    customerId: "c1",
    items: [
      { product: MOCK_PRODUCTS[9], quantity: 2 },
      { product: MOCK_PRODUCTS[2], quantity: 1 }
    ],
    total: 124.97,
    status: "completed",
    date: "2023-07-10T16:45:00Z"
  },
  {
    id: "o1004",
    customerId: "c3",
    items: [
      { product: MOCK_PRODUCTS[10], quantity: 1 },
      { product: MOCK_PRODUCTS[1], quantity: 3 }
    ],
    total: 188.96,
    status: "completed",
    date: "2023-08-05T11:20:00Z"
  },
  {
    id: "o1005",
    customerId: "c4",
    items: [
      { product: MOCK_PRODUCTS[7], quantity: 1 },
      { product: MOCK_PRODUCTS[4], quantity: 2 }
    ],
    total: 179.97,
    status: "pending",
    date: "2023-09-18T09:30:00Z"
  },
  {
    id: "o1006",
    customerId: "c5",
    items: [
      { product: MOCK_PRODUCTS[11], quantity: 4 },
      { product: MOCK_PRODUCTS[8], quantity: 1 }
    ],
    total: 129.95,
    status: "completed",
    date: "2023-10-01T13:10:00Z"
  }
];
