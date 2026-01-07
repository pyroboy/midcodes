import type { Ingredient } from './ingredients';

export interface RecipeIngredient {
    ingredientId: string;
    amount: number; // Numeric amount for calculation
    unit?: string; // override if needed, else mostly 'g'
    notes?: string;
}

export interface Recipe {
    id: string;
    name: string;
    description: string;
    yield: number; // Numeric yield (e.g. 12 pieces)
    yieldUnit: string; // e.g. "cookies" or "boxes"
    prepTime: string;
    bakeTime: string;
    items: RecipeIngredient[]; // Renamed from 'ingredients' to avoid confusion with master list
    instructions: string[];
    tips: string[];
}

export const recipes: Recipe[] = [
    {
        id: "classic-choco-chip",
        name: "Classic Chocolate Chip",
        description: "The gold standard. Crispy edges, chewy centers, and pools of melted chocolate.",
        yield: 12,
        yieldUnit: "giant cookies",
        prepTime: "15 mins (+ 1 hr chill)",
        bakeTime: "12-14 mins",
        items: [
            { ingredientId: "butter_unsalted", amount: 225, notes: "Browned and cooled" },
            { ingredientId: "sugar_brown", amount: 200 },
            { ingredientId: "sugar_white", amount: 100 },
            { ingredientId: "egg_large", amount: 2, unit: "pcs" },
            { ingredientId: "vanilla_extract", amount: 15, unit: "ml" }, // ~1 tbsp
            { ingredientId: "flour_ap", amount: 320 },
            { ingredientId: "baking_soda", amount: 5, unit: "g" }, // ~1 tsp
            { ingredientId: "salt_sea", amount: 5, unit: "g" },
            { ingredientId: "choco_chunks_70", amount: 300 }
        ],
        instructions: [
            "Brown the butter in a saucepan over medium heat until nutty and amber. Pour into a bowl and let cool for 20 mins.",
            "Whisk cooled butter with brown and white sugars until smooth (no need to cream extensively).",
            "Add eggs one at a time, followed by vanilla. Whisk vigorously for 2 minutes until glossy.",
            "Fold in flour, baking soda, and salt until just combined. Do not overmix.",
            "Fold in chocolate chunks.",
            "Chill dough for at least 1 hour (overnight is best for flavor).",
            "Preheat oven to 180°C (350°F). Scoop 100g balls onto laid baking tray.",
            "Bake for 12-14 mins. Edges should be golden, centers slightly soft.",
            "Cool on tray for 10 mins before moving to wire rack."
        ],
        tips: [
            "Browning the butter adds a toffee-like depth.",
            "Chilling the dough prevents excessive spreading.",
            "Top with flaky sea salt immediately after baking for a gourmet touch."
        ]
    },
    {
        id: "ube-white-choco",
        name: "Ube White Chocolate",
        description: "A vibrant purple Filipino favorite. Earthy, sweet ube paired with creamy white chocolate.",
        yield: 12,
        yieldUnit: "cookies",
        prepTime: "20 mins",
        bakeTime: "11-13 mins",
        items: [
            { ingredientId: "butter_unsalted", amount: 115, notes: "Softened" },
            { ingredientId: "sugar_white", amount: 150 },
            { ingredientId: "egg_large", amount: 1, unit: "pcs" },
            { ingredientId: "ube_halaya", amount: 100 },
            { ingredientId: "ube_extract", amount: 5, unit: "ml" }, // ~1 tsp
            { ingredientId: "flour_ap", amount: 200 },
            { ingredientId: "baking_powder", amount: 3, unit: "g" }, // ~1/2 tsp
            { ingredientId: "choco_white", amount: 150 }
        ],
        instructions: [
            "Cream butter and sugar until light and fluffy.",
            "Beat in egg, ube halaya, and ube extract until vibrant purple.",
            "Whisk flour and baking powder in a separate bowl, then gradually add to wet mix.",
            "Fold in white chocolate chips.",
            "Chill for 30 mins to firm up.",
            "Scoop onto baking sheet.",
            "Bake at 175°C (350°F) for 11-13 mins. Do not overbake to keep the color vibrant.",
            "Cool completely to let the ube flavor settle."
        ],
        tips: [
            "Use high-quality Ube Halaya for authentic flavor, not just extract.",
            "White chocolate can burn easily, so watch the bottom of the cookies."
        ]
    },
     {
        id: "matcha-almond",
        name: "Matcha Almond",
        description: "Earthy premium matcha balanced with white chocolate and roasted almonds.",
        yield: 12,
        yieldUnit: "cookies",
        prepTime: "15 mins",
        bakeTime: "10-12 mins",
        items: [
            { ingredientId: "butter_unsalted", amount: 115, notes: "Melted" },
            { ingredientId: "sugar_white", amount: 100 },
            { ingredientId: "sugar_brown", amount: 50 },
            { ingredientId: "egg_large", amount: 1, unit: "pcs" },
            { ingredientId: "matcha_powder", amount: 7, unit: "g" }, // ~1 tbsp
            { ingredientId: "flour_ap", amount: 180 },
            { ingredientId: "baking_soda", amount: 3, unit: "g" },
            { ingredientId: "choco_white", amount: 100 },
            { ingredientId: "almonds_sliced", amount: 50 }
        ],
        instructions: [
            "Mix melted butter with sugars.",
            "Add egg and whisk until smooth.",
            "Sift in flour, matcha powder, and baking soda. Fold until combined.",
            "Fold in white chocolate and most of the almonds.",
            "Scoop dough balls and press remaining almonds on top.",
            "Bake at 175°C (350°F) for 10-12 mins.",
            "They will look soft but firm up as they cool."
        ],
        tips: [
            "Don't skimp on the matcha quality for a bright green color.",
            "Toasting the almonds beforehand releases their essential oils."
        ]
    }
];
