// src/types/portfolioTypes.ts

// Base interface shared by all portfolio items
export interface PortfolioItemBase {
    id: number;
    title: string;
    artist: string;
    category: string; // Consider using a specific union type if categories are fixed
}

// Interface for portfolio items that are images
export interface PortfolioImageItem extends PortfolioItemBase {
    type: 'image';
    image: string;
    description?: string; // Optional description for images
}

// Interface for portfolio items that are videos
export interface PortfolioVideoItem extends PortfolioItemBase {
    type: 'video';
    videoSrc: string;
    poster?: string; // Optional poster image for video
    description: string; // Description is required for videos
}

// Union type representing any possible portfolio item
export type PortfolioItem = PortfolioImageItem | PortfolioVideoItem;

// You can also add other related types here if needed, for example:
// export type PortfolioCategory = 'all' | 'blackwork' | 'minimalist' | ...etc;
// export type VideoControlState = { ... }; // If you want to reuse this elsewhere