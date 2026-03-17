/**
 * Type definitions for body part mappings on 3D models
 */

export interface BodyPartMapping {
  position: [number, number, number];
  scale: number;
  cameraAzimuth?: number;
  cameraPolar?: number;
  cameraDistance?: number;
  placementSizeLimits?: { min: number; max: number; multiplier: number };
  placementPainInfo?: { level: number; reason?: string };
}

export interface BodyPartMappings {
  [category: string]: {
    [placement: string]: BodyPartMapping;
  }
}
export interface PlacementSizeLimits {
  min: number;
  max: number;
  multiplier: number;
}

export interface PlacementPainInfo {
  level: number;
  reason?: string;
}

export interface PlacementData {
  position: [number, number, number];
  scale: number;
  cameraAzimuth: number;
  cameraPolar: number;
  cameraDistance: number;
  placementSizeLimits: PlacementSizeLimits;
  placementPainInfo: PlacementPainInfo;
}

export interface CategoryMappings {
  [placement: string]: PlacementData;
}


export interface MappingUpdate {
  category: string;
  placement: string;
  mapping: BodyPartMapping;
}
