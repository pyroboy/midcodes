import { Product } from "@/types/sales";

// Products file 5: Exhaust system components
export const PRODUCTS_BATCH_5: Product[] = [
  {
    id: "p21",
    name: "Catalytic Converter - Direct Fit",
    description: "CARB compliant direct-fit catalytic converter",
    price: 12999.50,
    category: "Exhaust",
    sku: "EXH-101",
    imageUrl: "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?q=80&w=500&auto=format",
    stock: 4,
    manufacturer: "CleanFlow",
    location: "J1-K3",
    barcode: "7891234567821",
    taxRate: 0.07,
    discountable: false,
    unitOfMeasure: "each",
    minStockLevel: 2,
    status: "active",
    cost: 9999.50,
    suppliers: [
      {
        id: "s012",
        name: "Exhaust Specialists",
        contactPerson: "Maria Rodriguez",
        phone: "555-222-3333",
        email: "sales@exhaustspec.com",
        leadTime: 7,
        preferredSupplier: true,
        rating: 5,
        address: "700 Exhaust Ave, Anytown, CA 90210",
        lastOrder: "2023-08-15",
        notes: "Primary supplier for exhaust components",
        minOrderQuantity: 2,
        status: "active",
        code: "EXS",
        category: "Exhaust"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2016-2021",
        make: ["Toyota"],
        model: ["Camry", "RAV4"]
      }
    ],
    oem: "17410-0P120",
    partType: "OEM",
    warranty: "5 years"
  },
  {
    id: "p22",
    name: "Muffler - Stainless Steel",
    description: "Performance stainless steel muffler with reduced back pressure",
    price: 3499.50,
    category: "Exhaust",
    sku: "EXH-202",
    imageUrl: "https://images.unsplash.com/photo-1606577924006-27d39b132ae2?q=80&w=500&auto=format",
    stock: 8,
    manufacturer: "FlowMaster",
    location: "J2-K4",
    barcode: "7891234567822",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 3,
    status: "active",
    cost: 2499.50,
    suppliers: [
      {
        id: "s012",
        name: "Exhaust Specialists",
        contactPerson: "Maria Rodriguez",
        phone: "555-222-3333",
        email: "sales@exhaustspec.com",
        leadTime: 7,
        preferredSupplier: true,
        rating: 5,
        address: "700 Exhaust Ave, Anytown, CA 90210",
        lastOrder: "2023-09-05",
        notes: "Primary supplier for exhaust components",
        minOrderQuantity: 3,
        status: "active",
        code: "EXS",
        category: "Exhaust"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2015-2023",
        make: ["Ford", "Chevrolet", "Dodge"],
        model: ["Mustang", "Camaro", "Challenger"]
      }
    ],
    partType: "performance",
    warranty: "Limited lifetime"
  },
  {
    id: "p23",
    name: "Oxygen Sensor - Upstream",
    description: "OEM replacement oxygen sensor with connector",
    price: 1299.95,
    category: "Exhaust",
    sku: "EXH-305",
    imageUrl: "https://images.unsplash.com/photo-1618401479427-c8ef9465fbe1?q=80&w=500&auto=format",
    stock: 22,
    manufacturer: "SenseTech",
    location: "J3-K5",
    barcode: "7891234567823",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 6,
    status: "active",
    cost: 899.95,
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
        lastOrder: "2023-09-25",
        notes: "Reliable supplier for sensors and electronics",
        minOrderQuantity: 6,
        status: "active",
        code: "SS",
        category: "Sensors"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2014-2020",
        make: ["Honda", "Acura"],
        model: ["Civic", "Accord", "ILX", "TLX"]
      }
    ],
    oem: "36531-RNA-A01",
    partType: "OEM",
    warranty: "1 year"
  },
  {
    id: "p24",
    name: "Exhaust Pipe Gasket",
    description: "High-temperature exhaust pipe flange gasket",
    price: 499.95,
    category: "Exhaust",
    sku: "EXH-410",
    imageUrl: "https://images.unsplash.com/photo-1564934304050-e055aad40434?q=80&w=500&auto=format",
    stock: 36,
    manufacturer: "SealTech",
    location: "J4-K6",
    barcode: "7891234567824",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 10,
    status: "active",
    cost: 299.95,
    suppliers: [
      {
        id: "s012",
        name: "Exhaust Specialists",
        contactPerson: "Maria Rodriguez",
        phone: "555-222-3333",
        email: "sales@exhaustspec.com",
        leadTime: 7,
        preferredSupplier: true,
        rating: 5,
        address: "700 Exhaust Ave, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Primary supplier for exhaust components",
        minOrderQuantity: 10,
        status: "active",
        code: "EXS",
        category: "Exhaust"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2010-2023",
        make: ["Universal"],
      }
    ],
    partType: "OEM",
    warranty: "90 days"
  },
  {
    id: "p25",
    name: "Exhaust Hanger Kit",
    description: "Universal rubber exhaust hanger kit with hardware",
    price: 349.95,
    category: "Exhaust",
    sku: "EXH-515",
    imageUrl: "https://images.unsplash.com/photo-1617419086540-518c5b847b88?q=80&w=500&auto=format",
    stock: 28,
    manufacturer: "SuspendPro",
    location: "J5-K7",
    barcode: "7891234567825",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "kit",
    minStockLevel: 8,
    status: "active",
    cost: 199.95,
    suppliers: [
      {
        id: "s012",
        name: "Exhaust Specialists",
        contactPerson: "Maria Rodriguez",
        phone: "555-222-3333",
        email: "sales@exhaustspec.com",
        leadTime: 7,
        preferredSupplier: true,
        rating: 5,
        address: "700 Exhaust Ave, Anytown, CA 90210",
        lastOrder: "2023-10-01",
        notes: "Primary supplier for exhaust components",
        minOrderQuantity: 5,
        status: "active",
        code: "EXS",
        category: "Exhaust"
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
  }
];