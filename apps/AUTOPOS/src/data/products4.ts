import { Product } from "@/types/sales";

// Products file 4: Cooling system components
export const PRODUCTS_BATCH_4: Product[] = [
  {
    id: "p16",
    name: "Radiator - Aluminum",
    description: "High-performance aluminum radiator for improved cooling",
    price: 8999.50,
    category: "Cooling",
    sku: "CLG-101",
    imageUrl: "https://images.unsplash.com/photo-1635774899334-a041cbc0e174?q=80&w=500&auto=format",
    stock: 7,
    manufacturer: "CoolMax",
    location: "D4-E2",
    barcode: "7891234567816",
    taxRate: 0.07,
    discountable: false,
    unitOfMeasure: "each",
    minStockLevel: 2,
    status: "active",
    cost: 6999.50,
    suppliers: [
      {
        id: "s010",
        name: "Cooling Systems Inc",
        contactPerson: "Jennifer Adams",
        phone: "555-888-9999",
        email: "orders@coolingsystems.com",
        leadTime: 5,
        preferredSupplier: true,
        rating: 4,
        address: "500 Coolant Drive, Anytown, CA 90210",
        lastOrder: "2023-09-10",
        notes: "Primary supplier for cooling components",
        minOrderQuantity: 2,
        status: "active",
        code: "CSI",
        category: "Cooling"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2010-2019",
        make: ["Honda", "Acura"],
        model: ["Civic", "Accord", "ILX", "TLX"]
      }
    ],
    oem: "19010-RRB-A01",
    partType: "performance",
    warranty: "3 years"
  },
  {
    id: "p17",
    name: "Thermostat Assembly",
    description: "OEM replacement thermostat with housing",
    price: 1899.50,
    category: "Cooling",
    sku: "CLG-202",
    imageUrl: "https://images.unsplash.com/photo-1617419086540-518c5b847b88?q=80&w=500&auto=format",
    stock: 22,
    manufacturer: "TempControl",
    location: "D5-E3",
    barcode: "7891234567817",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 6,
    status: "active",
    cost: 1199.50,
    suppliers: [
      {
        id: "s010",
        name: "Cooling Systems Inc",
        contactPerson: "Jennifer Adams",
        phone: "555-888-9999",
        email: "orders@coolingsystems.com",
        leadTime: 5,
        preferredSupplier: true,
        rating: 4,
        address: "500 Coolant Drive, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Primary supplier for cooling components",
        minOrderQuantity: 5,
        status: "active",
        code: "CSI",
        category: "Cooling"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2015-2022",
        make: ["Toyota", "Lexus"],
        model: ["Camry", "Corolla", "ES350", "IS300"]
      }
    ],
    oem: "16341-0V030",
    partType: "OEM",
    warranty: "1 year"
  },
  {
    id: "p18",
    name: "Coolant Temperature Sensor",
    description: "Engine coolant temperature sensor with connector",
    price: 799.95,
    category: "Cooling",
    sku: "CLG-305",
    imageUrl: "https://images.unsplash.com/photo-1618401479427-c8ef9465fbe1?q=80&w=500&auto=format",
    stock: 34,
    manufacturer: "SenseTech",
    location: "D6-E4",
    barcode: "7891234567818",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 10,
    status: "active",
    cost: 499.95,
    suppliers: [
      {
        id: "s011",
        name: "Sensor Solutions",
        contactPerson: "Paul Williams",
        phone: "555-777-1111",
        email: "sales@sensorsolutions.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "600 Sensor Street, Anytown, CA 90210",
        lastOrder: "2023-10-01",
        notes: "Reliable supplier for sensors and electronics",
        minOrderQuantity: 10,
        status: "active",
        code: "SS",
        category: "Sensors"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2012-2022",
        make: ["Ford", "Lincoln"],
        model: ["F-150", "Explorer", "Navigator", "Expedition"]
      }
    ],
    oem: "F5TZ-10884-A",
    partType: "OEM",
    warranty: "1 year"
  },
  {
    id: "p19",
    name: "Radiator Cap - Premium",
    description: "High-pressure radiator cap with safety release valve",
    price: 399.95,
    category: "Cooling",
    sku: "CLG-410",
    imageUrl: "https://images.unsplash.com/photo-1620743364195-33637e0af71b?q=80&w=500&auto=format",
    stock: 45,
    manufacturer: "CoolMax",
    location: "D7-E5",
    barcode: "7891234567819",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 15,
    status: "active",
    cost: 199.95,
    suppliers: [
      {
        id: "s010",
        name: "Cooling Systems Inc",
        contactPerson: "Jennifer Adams",
        phone: "555-888-9999",
        email: "orders@coolingsystems.com",
        leadTime: 5,
        preferredSupplier: true,
        rating: 4,
        address: "500 Coolant Drive, Anytown, CA 90210",
        lastOrder: "2023-09-18",
        notes: "Primary supplier for cooling components",
        minOrderQuantity: 10,
        status: "active",
        code: "CSI",
        category: "Cooling"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2010-2023",
        make: ["Universal"],
      }
    ],
    partType: "aftermarket",
    warranty: "1 year"
  },
  {
    id: "p20",
    name: "Engine Coolant - Premixed (1gal)",
    description: "Ready-to-use 50/50 antifreeze and coolant mixture",
    price: 899.95,
    category: "Fluids",
    sku: "FLD-450",
    imageUrl: "https://images.unsplash.com/photo-1614598993252-7c130e8e3fea?q=80&w=500&auto=format",
    stock: 32,
    manufacturer: "CoolMax",
    location: "A6-B2",
    barcode: "7891234567820",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "gallon",
    minStockLevel: 10,
    status: "active",
    cost: 599.95,
    suppliers: [
      {
        id: "s004",
        name: "Fluids & Lubricants Supply",
        contactPerson: "Sarah Wilson",
        phone: "555-444-8888",
        email: "orders@fluidsnlube.com",
        leadTime: 2,
        preferredSupplier: true,
        rating: 4,
        address: "789 Fluids St, Anytown, CA 90210",
        lastOrder: "2023-10-05",
        notes: "Primary supplier for fluids",
        minOrderQuantity: 6,
        status: "active",
        code: "F&L",
        category: "Fluids"
      }
    ]
  }
];