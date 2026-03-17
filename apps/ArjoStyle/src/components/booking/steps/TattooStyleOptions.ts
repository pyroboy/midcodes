// tattooStyles.ts
// Centralized tattoo style options and helpers

export interface TattooStyleOption {
  name: string;
  requiresDescription: boolean;
  exampleImage: string; // Use string type for URL path
}

// Consider alphabetical order or grouping by related styles for better maintainability
export const TATTOO_STYLE_OPTIONS: TattooStyleOption[] = [
  {
    name: "American Traditional (Old School)",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567356/elz9d8znoovzneuxho4w.webp",
  },
  {
    name: "Anime / Manga",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567356/qctjzww0uxjdijifbzny.webp",
  },
  {
    name: "Baybayin Script", // Added based on Filipino trends
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567356/t0tuqu7awdwufpinopqc.webp", // Placeholder image path
  },
  {
    name: "Biomechanical",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567356/qctjzww0uxjdijifbzny.webp",
  },
  {
    name: "Blackwork",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567346/z2x2zhfwddrmbjfc4rw1.webp",
  },
  {
    name: "Brush Stroke",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567346/t2uquxytwbmykxnqyjvr.webp",
  },
  {
    name: "Cyber Sigilism",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567347/hog6kon0nbihddbqfq1p.webp",
  },
  {
    name: "Dotwork (Pointillism)",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567347/jwdebzzq6ncu3sxp0k2k.webp",
  },
  {
    name: "Embroidery / Patch",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567351/bkifihvdipmb2was9qlh.webp",
  },
  {
    name: "Fine Line",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567347/hu6jcgzl8t3ol8mwzutf.webp",
  },
  {
    name: "Geometric",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567347/ml7heemfb8p1fhkvev9c.webp",
  },
  {
    name: "Glitch",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567348/lqlgdg7dxsebajkcx5jy.webp",
  },
  {
    name: "Ignorant Style",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567348/k9e7orscoeg1kllpm9ww.webp",
  },

  {
    name: "Japanese (Irezumi)",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567348/ildjbbikqxxhfmownb4c.webp",
  },
  {
    name: "Micro Realism",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567349/duee7qgbpgc1ncnnlowl.webp",
  },
  {
    name: "Minimalist",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567349/dediebn7msjiudm8mxmi.webp",
  },
  {
    name: "Negative Space",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567350/fueoa5qwxemx3ngvcnn6.webp",
  },
  {
    name: "Neo-Traditional",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567350/kzcc1qqsrlkgpor2zdci.webp",
  },
  {
    name: "Ornamental / Filigree",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567351/aptqe8nupjyzoxllx8fo.webp",
  },
  {
    name: "Realism (Color or Black and Grey)",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567352/vsrggxik9utaaoaxnnty.webp",
  },
  {
    name: "Script / Lettering", // Kept general, Baybayin added separately
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567353/putzedw0k5hgugfl9pbn.webp",
  },
  {
    name: "Surrealism",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567353/v9dls0e5bh3d4hqzjif3.webp",
  },
  {
    name: "Traditional Filipino (Batok/Batek)", // Added based on Filipino trends
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567347/b4xlvu11de1vtvmvsxyb.webp", // Placeholder image path
  },
  {
    name: "Trash Polka",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567353/p9qe19jkv3qqpzsk1l4x.webp",
  },
  {
    name: "Tribal", // Kept general, Filipino styles added separately
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567354/ujnfhzykzdy5v29hskbb.webp",
  },
  {
    name: "Watercolor",
    requiresDescription: false,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567355/xnvzejvrvpgqjkegz1an.webp",
  },
  // --- Options requiring description ---
  {
    name: "Combination / Multiple Styles",
    requiresDescription: true,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567346/amqwp0rwtdxjgechzfda.webp",
  },
  {
    name: "Other / Custom Style",
    requiresDescription: true,
    exampleImage:
      "https://res.cloudinary.com/dexcw6vg0/image/upload/v1745567351/rnkyjblwkeeg2xuyis2x.webp",
  },
];

// Array of style names that require a description
export const STYLE_OPTIONS_REQUIRING_DESCRIPTION = TATTOO_STYLE_OPTIONS.filter(
  (opt) => opt.requiresDescription
).map((opt) => opt.name);

// Simple array of all available style names
// Regenerate this based on the updated TATTOO_STYLE_OPTIONS
export const TATTOO_STYLES = TATTOO_STYLE_OPTIONS.map((opt) => opt.name);

// Optional: Helper function to get a full style option object by its name
export function getTattooStyleOption(
  name: string
): TattooStyleOption | undefined {
  return TATTOO_STYLE_OPTIONS.find((opt) => opt.name === name);
}
