import { ModelConfig, ModelConfigList } from '../types/models';

const MODEL_CONFIG_KEY = 'tattoo-tide-model-configs';

/**
 * Load all model configurations from localStorage
 */
export const loadModelConfigs = (): ModelConfigList => {
  try {
    const storedConfigs = localStorage.getItem(MODEL_CONFIG_KEY);
    if (storedConfigs) {
      return JSON.parse(storedConfigs);
    }
  } catch (error) {
    console.error('Error loading model configurations:', error);
  }
  
  return [];
};

/**
 * Save model configurations to localStorage
 */
export const saveModelConfigs = (configs: ModelConfigList): void => {
  try {
    localStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error('Error saving model configurations:', error);
  }
};

/**
 * Get a specific model configuration by ID
 */
export const getModelConfig = (id: string): ModelConfig | undefined => {
  const configs = loadModelConfigs();
  return configs.find(config => config.id === id);
};

/**
 * Add a new model configuration
 */
export const addModelConfig = (config: ModelConfig): void => {
  const configs = loadModelConfigs();
  
  // Check if model with this ID already exists
  const existingIndex = configs.findIndex(c => c.id === config.id);
  
  if (existingIndex >= 0) {
    // Update existing config
    configs[existingIndex] = config;
  } else {
    // Add new config
    configs.push(config);
  }
  
  saveModelConfigs(configs);
};

/**
 * Update an existing model configuration
 */
export const updateModelConfig = (id: string, updates: Partial<ModelConfig>): boolean => {
  const configs = loadModelConfigs();
  const index = configs.findIndex(config => config.id === id);
  
  if (index >= 0) {
    configs[index] = { ...configs[index], ...updates };
    saveModelConfigs(configs);
    return true;
  }
  
  return false;
};

/**
 * Delete a model configuration
 */
export const deleteModelConfig = (id: string): boolean => {
  const configs = loadModelConfigs();
  const filteredConfigs = configs.filter(config => config.id !== id);
  
  if (filteredConfigs.length < configs.length) {
    saveModelConfigs(filteredConfigs);
    return true;
  }
  
  return false;
};

/**
 * Validate a model configuration
 */
export const validateModelConfig = (config: ModelConfig): boolean => {
  // Basic validation
  if (!config.id || !config.name || !config.url) {
    return false;
  }
  
  // Validate arrays
  if (!Array.isArray(config.scale) || config.scale.length !== 3 ||
      !Array.isArray(config.position) || config.position.length !== 3 ||
      !Array.isArray(config.rotation) || config.rotation.length !== 3) {
    return false;
  }
  
  // Validate mappings
  if (!config.mappings || typeof config.mappings !== 'object') {
    return false;
  }
  
  return true;
};
