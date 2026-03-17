import { Product } from "@/types/sales";


// Products file 6: Suspension and steering components
export const PRODUCTS_BATCH_6: Product[] = [
  {
    id: "p26",
    name: "Shock Absorber - Front",
    description: "Gas-charged front shock absorber for improved handling",
    price: 2899.50,
    category: "Suspension",
    sku: "SUS-101",
    imageUrl: "https://images.unsplash.com/photo-1581098631708-634d2e77a5d6?q=80&w=500&auto=format",
    stock: 12,
    manufacturer: "RideControl",
    location: "G2-H4",
    barcode: "7891234567826",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 4,
    status: "active",
    cost: 1999.50,
    suppliers: [
      {
        id: "s007",
        name: "Suspension Specialists",
        contactPerson: "Laura Martinez",
        phone: "555-999-0000",
        email: "parts@suspensionspecialists.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "200 Suspension Rd, Anytown, CA 90210",
        lastOrder: "2023-09-18",
        notes: "Primary supplier for suspension components",
        minOrderQuantity: 4,
        status: "active",
        code: "SS",
        category: "Suspension"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2016-2022",
        make: ["Toyota", "Lexus"],
        model: ["Camry", "Avalon", "ES350"]
      }
    ],
    oem: "48510-06A50",
    partType: "OEM",
    warranty: "2 years"
  },
  {
    id: "p27",
    name: "Strut Assembly - Complete",
    description: "Ready-to-install complete strut assembly with springs",
    price: 4499.50,
    category: "Suspension",
    sku: "SUS-202",
    imageUrl: "https://images.unsplash.com/photo-1580974852861-c381510bc98a?q=80&w=500&auto=format",
    stock: 8,
    manufacturer: "RideControl",
    location: "G3-H5",
    barcode: "7891234567827",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 2,
    status: "active",
    cost: 3299.50,
    suppliers: [
      {
        id: "s007",
        name: "Suspension Specialists",
        contactPerson: "Laura Martinez",
        phone: "555-999-0000",
        email: "parts@suspensionspecialists.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "200 Suspension Rd, Anytown, CA 90210",
        lastOrder: "2023-08-25",
        notes: "Primary supplier for suspension components",
        minOrderQuantity: 2,
        status: "active",
        code: "SS",
        category: "Suspension"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2015-2020",
        make: ["Honda", "Acura"],
        model: ["Accord", "Civic", "TLX", "ILX"]
      }
    ],
    oem: "51602-SDA-A05",
    partType: "OEM",
    warranty: "3 years"
  },
  {
    id: "p28",
    name: "Control Arm - Lower",
    description: "Front lower control arm with ball joint",
    price: 3699.95,
    category: "Suspension",
    sku: "SUS-305",
    imageUrl: "https://images.unsplash.com/photo-1580974852861-c381510bc98a?q=80&w=500&auto=format",
    stock: 14,
    manufacturer: "SuspensionTech",
    location: "G4-H6",
    barcode: "7891234567828",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 4,
    status: "active",
    cost: 2799.95,
    suppliers: [
      {
        id: "s007",
        name: "Suspension Specialists",
        contactPerson: "Laura Martinez",
        phone: "555-999-0000",
        email: "parts@suspensionspecialists.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "200 Suspension Rd, Anytown, CA 90210",
        lastOrder: "2023-09-22",
        notes: "Primary supplier for suspension components",
        minOrderQuantity: 4,
        status: "active",
        code: "SS",
        category: "Suspension"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2014-2019",
        make: ["Ford", "Lincoln"],
        model: ["Fusion", "MKZ"]
      }
    ],
    oem: "DS7Z-3078-A",
    partType: "aftermarket",
    warranty: "2 years"
  },
  {
    id: "p29",
    name: "Sway Bar Link Kit",
    description: "Front sway bar link kit with bushings and hardware",
    price: 599.95,
    category: "Suspension",
    sku: "SUS-410",
    imageUrl: "https://images.unsplash.com/photo-1564934304050-e055aad40434?q=80&w=500&auto=format",
    stock: 26,
    manufacturer: "SuspensionTech",
    location: "G5-H7",
    barcode: "7891234567829",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "kit",
    minStockLevel: 8,
    status: "active",
    cost: 349.95,
    suppliers: [
      {
        id: "s007",
        name: "Suspension Specialists",
        contactPerson: "Laura Martinez",
        phone: "555-999-0000",
        email: "parts@suspensionspecialists.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "200 Suspension Rd, Anytown, CA 90210",
        lastOrder: "2023-10-03",
        notes: "Primary supplier for suspension components",
        minOrderQuantity: 6,
        status: "active",
        code: "SS",
        category: "Suspension"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2012-2022",
        make: ["Toyota", "Honda", "Nissan"],
        model: ["Camry", "Accord", "Altima"]
      }
    ],
    partType: "aftermarket",
    warranty: "1 year"
  },
  {
    id: "p30",
    name: "Power Steering Pump",
    description: "Remanufactured power steering pump with pulley",
    price: 4299.95,
    category: "Steering",
    sku: "STR-101",
    imageUrl: "https://images.unsplash.com/photo-1619642751034-765fc2da97dc?q=80&w=500&auto=format",
    stock: 6,
    manufacturer: "SteerTech",
    location: "I1-J3",
    barcode: "7891234567830",
    taxRate: 0.07,
    discountable: false,
    unitOfMeasure: "each",
    minStockLevel: 2,
    status: "active",
    cost: 2999.95,
    suppliers: [
      {
        id: "s013",
        name: "Steering Components Inc",
        contactPerson: "Kevin Wilson",
        phone: "555-444-5555",
        email: "orders@steeringcomp.com",
        leadTime: 4,
        preferredSupplier: true,
        rating: 4,
        address: "800 Steering Way, Anytown, CA 90210",
        lastOrder: "2023-09-10",
        notes: "Primary supplier for steering components",
        minOrderQuantity: 2,
        status: "active",
        code: "SCI",
        category: "Steering"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2015-2019",
        make: ["Chevrolet", "GMC"],
        model: ["Silverado 1500", "Sierra 1500"]
      }
    ],
    oem: "26064546",
    partType: "remanufactured",
    warranty: "2 years"
  }
];