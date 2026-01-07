export interface Ingredient {
    id: string;
    name: string;
    category: 'dairy' | 'dry' | 'sugar' | 'chocolate' | 'produce' | 'misc';
    packageSize: number; // in grams or pcs
    packageCost: number; // in PHP
    unit: 'g' | 'ml' | 'pcs';
}

// Master Ingredient Database with realistic Manila pricing estimates
export const ingredients: Ingredient[] = [
    // DAIRY
    { id: "butter_unsalted", name: "Unsalted Butter", category: "dairy", packageSize: 225, packageCost: 180, unit: "g" },
    { id: "egg_large", name: "Large Egg", category: "dairy", packageSize: 12, packageCost: 120, unit: "pcs" }, // ~10php per egg
    
    // SUGARS
    { id: "sugar_brown", name: "Brown Sugar", category: "sugar", packageSize: 1000, packageCost: 90, unit: "g" }, // 1kg
    { id: "sugar_white", name: "White Sugar", category: "sugar", packageSize: 1000, packageCost: 85, unit: "g" },
    
    // DRY GOODS
    { id: "flour_ap", name: "All-Purpose Flour", category: "dry", packageSize: 1000, packageCost: 60, unit: "g" },
    { id: "baking_soda", name: "Baking Soda", category: "dry", packageSize: 500, packageCost: 45, unit: "g" },
    { id: "baking_powder", name: "Baking Powder", category: "dry", packageSize: 500, packageCost: 50, unit: "g" },
    { id: "salt_sea", name: "Sea Salt", category: "dry", packageSize: 500, packageCost: 35, unit: "g" },
    
    // CHOCOLATE & FLAVORINGS
    { id: "choco_chunks_70", name: "Dark Chocolate Chunks (70%)", category: "chocolate", packageSize: 1000, packageCost: 850, unit: "g" },
    { id: "choco_white", name: "White Chocolate Chips", category: "chocolate", packageSize: 1000, packageCost: 750, unit: "g" },
    { id: "vanilla_extract", name: "Vanilla Extract", category: "misc", packageSize: 500, packageCost: 650, unit: "ml" },
    { id: "matcha_powder", name: "Matcha Powder (Culinary)", category: "dry", packageSize: 100, packageCost: 450, unit: "g" },
    { id: "ube_halaya", name: "Ube Halaya", category: "misc", packageSize: 440, packageCost: 280, unit: "g" }, // Standard jar
    { id: "ube_extract", name: "Ube Extract", category: "misc", packageSize: 20, packageCost: 45, unit: "ml" },
    
    // NUTS
    { id: "almonds_sliced", name: "Sliced Almonds", category: "dry", packageSize: 1000, packageCost: 800, unit: "g" }
];

export const getIngredient = (id: string): Ingredient | undefined => {
    return ingredients.find(i => i.id === id);
};
