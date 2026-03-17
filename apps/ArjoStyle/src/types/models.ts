/**
 * Type definitions for 3D model configurations
 */

import { BodyPartMappings } from './mapping';

export interface ModelConfig {
  id: string;
  name: string;
  url: string;
  scale: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  mappings: Record<string, BodyPartMappings>;
}

export type ModelConfigList = ModelConfig[];
