import { Product } from "@/types/sales";

// Products file 3: Batteries, fluids, etc.
export const PRODUCTS_BATCH_3: Product[] = [
  {
    id: "p11",
    name: "Battery - Premium",
    description: "Premium automotive battery with 5-year warranty",
    price: 7499.50,
    category: "Electrical",
    sku: "ELC-100",
    imageUrl: "https://images.unsplash.com/photo-1626663679351-377797182b59?q=80&w=500&auto=format",
    stock: 15,
    manufacturer: "PowerCell",
    location: "F1-G2",
    barcode: "7891234567811",
    taxRate: 0.07,
    discountable: false,
    unitOfMeasure: "each",
    minStockLevel: 5,
    status: "active",
    cost: 5499.50,
    suppliers: [
      {
        id: "s006",
        name: "Electrical Components Ltd",
        contactPerson: "Thomas Lee",
        phone: "555-777-8888",
        email: "orders@electricalcomponents.com",
        leadTime: 5,
        preferredSupplier: true,
        rating: 4,
        address: "500 Electric Ave, Anytown, CA 90210",
        lastOrder: "2023-09-05",
        notes: "Primary supplier for electrical components",
        minOrderQuantity: 3,
        status: "active",
        code: "ECL",
        category: "Electrical"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2018-2023",
        make: ["Universal"],
      }
    ],
    partType: "OEM",
    warranty: "5 years"
  },
  {
    id: "p12",
    name: "Transmission Fluid (1qt)",
    description: "Automatic transmission fluid for smooth shifting",
    price: 499.95,
    category: "Fluids",
    sku: "FLD-300",
    imageUrl: "https://images.unsplash.com/photo-1635166304267-59371b8d9f14?q=80&w=500&auto=format",
    stock: 60,
    manufacturer: "ShiftSmooth",
    location: "A5-B1",
    barcode: "7891234567812",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "quart",
    minStockLevel: 15,
    status: "active",
    cost: 299.95,
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
        lastOrder: "2023-10-02",
        notes: "Primary supplier for fluids",
        minOrderQuantity: 12,
        status: "active",
        code: "F&L",
        category: "Fluids"
      }
    ]
  },
  {
    id: "p13",
    name: "Car Air Freshener - Pine",
    description: "Long-lasting pine scented air freshener for vehicles",
    price: 299.95,
    category: "Accessories",
    sku: "ACC-101",
    imageUrl: "https://images.unsplash.com/photo-1620285327197-1d41f3092c0c?q=80&w=500&auto=format",
    stock: 85,
    manufacturer: "FreshScent",
    location: "H3-I2",
    barcode: "7891234567813",
    taxRate: 0.07,
    discountable: true,
    unitOfMeasure: "each",
    minStockLevel: 20,
    status: "active",
    cost: 149.95,
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
        lastOrder: "2023-09-20",
        notes: "Primary supplier for interior accessories",
        minOrderQuantity: 24,
        status: "active",
        code: "AAW",
        category: "Accessories"
      }
    ]
  },
  {
    id: "p14",
    name: "Super Glue - 5ml",
    description: "Quick-setting adhesive for emergency repairs",
    price: 249.50,
    category: "Accessories",
    sku: "ACC-202",
    imageUrl: "https://images.unsplash.com/photo-1622557850710-7fc7848683ef?q=80&w=500&auto=format",
    stock: 42,
    manufacturer: "BondTight",
    location: "H4-I3",
    barcode: "7891234567814",
    taxRate: 0.07,
    discountable: false,
    unitOfMeasure: "tube",
    minStockLevel: 15,
    status: "active",
    cost: 129.50,
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
        lastOrder: "2023-09-20",
        notes: "Primary supplier for general accessories",
        minOrderQuantity: 24,
        status: "active",
        code: "AAW",
        category: "Accessories"
      }
    ]
  },
  {
    id: "p15",
    name: "Fuel Pump Assembly",
    description: "Complete fuel pump assembly with pressure regulator",
    price: 5499.50,
    category: "Fuel System",
    sku: "FUL-505",
    imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=500&auto=format",
    stock: 8,
    manufacturer: "FlowMaster",
    location: "C5-D3",
    barcode: "7891234567815",
    taxRate: 0.07,
    discountable: false,
    unitOfMeasure: "each",
    minStockLevel: 3,
    status: "active",
    cost: 3999.50,
    suppliers: [
      {
        id: "s009",
        name: "Fuel System Specialists",
        contactPerson: "Eric Thompson",
        phone: "555-666-7777",
        email: "orders@fuelsystems.com",
        leadTime: 4,
        preferredSupplier: true,
        rating: 5,
        address: "400 Fuel Pump Road, Anytown, CA 90210",
        lastOrder: "2023-08-22",
        notes: "Primary supplier for fuel system components",
        minOrderQuantity: 2,
        status: "active",
        code: "FSS",
        category: "Fuel System"
      }
    ],
    vehicleCompatibility: [
      {
        year: "2015-2020",
        make: ["Toyota", "Lexus"],
        model: ["Camry", "Corolla", "ES350", "IS300"]
      }
    ],
    oem: "23220-0P090",
    partType: "OEM",
    warranty: "2 years"
  }
];