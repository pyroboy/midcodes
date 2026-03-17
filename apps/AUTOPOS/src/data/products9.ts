import { Product } from "@/types/sales";


// Products file 9: Exterior parts and accessories
export const PRODUCTS_BATCH_9: Product[] = [
  {
    id: "p41",
    name: "Side Mirror - Driver Side",
    description: "OEM replacement side mirror with power adjustment",
    price: 4299.95,
    category: "Exterior",
    sku: "EXT-101",
    imageUrl: "https://images.unsplash.com/photo-1610647752706-3bb12232b3e4?q=80&w=500&auto=format",
    stock: 6,
    manufacturer: "GlassTech",
    location: "D8-E6",
    barcode: "7891234567841",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 2,
    status: "active",
    cost: 3199.95,
    suppliers: [
      {
        id: "s016",
        name: "Exterior Parts Distributors",
        contactPerson: "Michael Brown",
        phone: "555-555-6666",
        email: "orders@exteriorparts.com",
        leadTime: 4,
        preferredSupplier: true,
        rating: 4,
        address: "1100 Exterior Street, Anytown, CA 90210",
        lastOrder: "2023-09-05",
        notes: "Primary supplier for exterior body parts",
        minOrderQuantity: 2,
        status: "active",
        code: "EPD",
        category: "Exterior"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2016-2021",
        make: ["Toyota"],
        model: ["Camry", "Avalon"]
      }
    ],
    oem: "87940-06790",
    partType: "OEM",
    warranty: "1 year"
  },
  {
    id: "p42",
    name: "Fender Liner - Front Passenger",
    description: "Front passenger side fender liner/splash guard",
    price: 1499.95,
    category: "Exterior",
    sku: "EXT-202",
    imageUrl: "https://images.unsplash.com/photo-1637858868799-7f26a0640eb6?q=80&w=500&auto=format",
    stock: 9,
    manufacturer: "ShieldTech",
    location: "D9-E7",
    barcode: "7891234567842",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 3,
    status: "active",
    cost: 999.95,
    suppliers: [
      {
        id: "s016",
        name: "Exterior Parts Distributors",
        contactPerson: "Michael Brown",
        phone: "555-555-6666",
        email: "orders@exteriorparts.com",
        leadTime: 4,
        preferredSupplier: true,
        rating: 4,
        address: "1100 Exterior Street, Anytown, CA 90210",
        lastOrder: "2023-09-15",
        notes: "Primary supplier for exterior body parts",
        minOrderQuantity: 3,
        status: "active",
        code: "EPD",
        category: "Exterior"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2018-2022",
        make: ["Honda"],
        model: ["Accord", "Civic"]
      }
    ],
    oem: "74101-TBA-A00",
    partType: "aftermarket",
    warranty: "1 year"
  },
  {
    id: "p43",
    name: "Car Cover - Weatherproof",
    description: "All-weather waterproof car cover with UV protection",
    price: 3299.95,
    category: "Exterior",
    sku: "EXT-305",
    imageUrl: "https://images.unsplash.com/photo-1567689235852-cbc8e9f087ee?q=80&w=500&auto=format",
    stock: 8,
    manufacturer: "WeatherGuard",
    location: "H5-I7",
    barcode: "7891234567843",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 2,
    status: "active",
    cost: 2499.95,
    suppliers: [
      {
        id: "s008",
        name: "Auto Accessories Wholesale",
        contactPerson: "Daniel Kim",
        phone: "555-111-2222",
        email: "orders@autoaccessories.com",
        leadTime: 2,
        preferredSupplier: true,
        rating: 3,
        address: "300 Accessory Lane, Anytown, CA 90210",
        lastOrder: "2023-08-25",
        notes: "Primary supplier for exterior accessories",
        minOrderQuantity: 2,
        status: "active",
        code: "AAW",
        category: "Accessories"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2010-2023",
        make: ["Universal"],
        model: ["Sedan", "Coupe"]
      }
    ],
    partType: "aftermarket",
    warranty: "2 years"
  },
  {
    id: "p44",
    name: "Windshield Washer Fluid - Winter",
    description: "Winter formula windshield washer fluid with de-icer (-20°F)",
    price: 349.95,
    category: "Fluids",
    sku: "FLD-601",
    imageUrl: "https://images.unsplash.com/photo-1635012546485-1a2beb3a86b8?q=80&w=500&auto=format",
    stock: 40,
    manufacturer: "ClearView",
    location: "A7-B3",
    barcode: "7891234567844",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "gallon",
    minStockLevel: 12,
    status: "active",
    cost: 199.95,
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
        lastOrder: "2023-10-10",
        notes: "Primary supplier for fluids",
        minOrderQuantity: 12,
        status: "active",
        code: "F&L",
        category: "Fluids"
      }
    ]
  },
  {
    id: "p45",
    name: "Bug and Tar Remover Spray",
    description: "Professional-strength bug and tar remover spray",
    price: 549.95,
    category: "Cleaning",
    sku: "CLN-101",
    imageUrl: "https://images.unsplash.com/photo-1627301517344-1e09baae9ed1?q=80&w=500&auto=format",
    stock: 28,
    manufacturer: "CleanPro",
    location: "P1-Q3",
    barcode: "7891234567845",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "bottle",
    minStockLevel: 8,
    status: "active",
    cost: 349.95,
    suppliers: [
      {
        id: "s017",
        name: "Auto Detailing Supplies",
        contactPerson: "Jessica White",
        phone: "555-222-5555",
        email: "orders@detailingsupplies.com",
        leadTime: 3,
        preferredSupplier: true,
        rating: 4,
        address: "1200 Detailing Drive, Anytown, CA 90210",
        lastOrder: "2023-09-20",
        notes: "Primary supplier for cleaning products",
        minOrderQuantity: 6,
        status: "active",
        code: "ADS",
        category: "Cleaning"
      }
    ]
  }
];