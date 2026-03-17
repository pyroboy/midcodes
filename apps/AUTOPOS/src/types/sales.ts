export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  imageUrl: string;
  stock: number;
  manufacturer?: string;
  location: string;

  barcode?: string;
  taxRate?: number;
  discountable?: boolean;
  unitOfMeasure?: string;
  minStockLevel?: number;
  status?: 'active' | 'discontinued' | 'seasonal' | 'backordered';
  
  // Supplier information (separate from manufacturer)
  suppliers?: Supplier[];
  
  // Cost information (related to suppliers)
  cost?: number; // Average or standard cost
  
  // Auto-specific fields
  vehicleCompatibility?: Array<{
    year: string | number;
    make: string[];
    model?: string[];
  }>;
  oem?: string;
  partType?: 'OEM' | 'aftermarket' | 'remanufactured' | 'performance';
  warranty?: string;
  supersession?: {
    type: 'replaced_by' | 'replaces';
    partSku: string;
    partName: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyaltyLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  purchaseHistory?: Order[];
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  items: {
    product: Product;
    quantity: number;
    reason: string;
  }[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  date: string;
}

export interface PartRecognitionResult {
  confidence: number;
  product: Product;
  alternates?: Product[];
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive";
  leadTime?: number; // in days
  minOrderQuantity?: number;
  preferredSupplier?: boolean;
  rating: number;
  address: string;
  lastOrder: string;
  notes: string;
}


export interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  status: "draft" | "pending" | "approved" | "completed" | "cancelled";
  total: number;
  items: number;
}

export type UserRole = "admin" | "manager" | "cashier" | "inventory" | "owner";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLogin: string;
}
