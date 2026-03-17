import React, { useState, useCallback, useEffect } from 'react';
import { BodyPartMapping, BodyPartMappings } from '../../types/mapping'; // Adjust path as needed
import { defaultMappings } from '../../data/defaultMappings'; // Adjust path as needed

interface MappingControlsProps {
  mapping: BodyPartMapping | null;
  onUpdate: (category: string, placement: string, updates: Partial<BodyPartMapping>) => void;
  category: string;
  placement: string;
  onCategoryChange?: (category: string) => void;
  onPlacementChange?: (placement: string) => void;
  bodyPartMappings?: BodyPartMappings;
}

// Define the range for position sliders
const POSITION_MIN = -2.5;
const POSITION_MAX = 2.5;
const POSITION_RANGE = POSITION_MAX - POSITION_MIN; // 5.0, not 10 as per original code, keeping it
const POSITION_STEP = 0.02; // Adjusted step for the position range

// Define the NEW range for distance slider
const DISTANCE_MIN = 0.1;
const DISTANCE_MAX = 10.1; // New max to achieve a range of 10
const DISTANCE_RANGE = DISTANCE_MAX - DISTANCE_MIN; // 10.0
const DISTANCE_STEP = 0.1; // Adjusted step for the new distance range

export const MappingControls: React.FC<MappingControlsProps> = ({
  mapping,
  onUpdate,
  category,
  placement,
  onCategoryChange,
  onPlacementChange,
  bodyPartMappings = defaultMappings,
}) => {
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [placements, setPlacements] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(category);
  const [selectedPlacement, setSelectedPlacement] = useState<string>(placement);

  // Effect to synchronize internal state with parent props
  useEffect(() => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (placement !== selectedPlacement) {
      setSelectedPlacement(placement);
    }

    const availableCategories = Object.keys(bodyPartMappings || {});
    setCategories(availableCategories);

    if (category && bodyPartMappings && bodyPartMappings[category]) {
      const availablePlacements = Object.keys(bodyPartMappings[category]);
      setPlacements(availablePlacements);
    } else {
      setPlacements([]);
    }
  }, [category, placement, bodyPartMappings, selectedCategory, selectedPlacement]);

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    // Reset placement if category changes? Decide based on UX needs.
    // For now, just notify parent.
    onCategoryChange?.(newCategory);
  };

  // Handle placement change
  const handlePlacementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlacement = e.target.value;
    setSelectedPlacement(newPlacement);
    onPlacementChange?.(newPlacement);
  };

  // Internal handler to pass updates up to the parent with category/placement context
  const handleUpdate = useCallback((updates: Partial<BodyPartMapping>) => {
    if (!selectedCategory || !selectedPlacement) {
      console.warn('[MappingControls] Cannot handle update without selected category/placement');
      return;
    }
    onUpdate(selectedCategory, selectedPlacement, updates);
  }, [onUpdate, selectedCategory, selectedPlacement]);

  const handleSliderDrag = (
    event: React.MouseEvent | React.TouchEvent,
    property: keyof BodyPartMapping | 'cameraAzimuth' | 'cameraPolar' | 'cameraDistance',
    index?: number // Only relevant for 'position'
  ) => {
    if (!mapping) return;

    const slider = event.currentTarget as HTMLDivElement;
    const sliderRect = slider.getBoundingClientRect();
    const sliderWidth = sliderRect.width;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;

    let percentage = (clientX - sliderRect.left) / sliderWidth;
    percentage = Math.max(0, Math.min(1, percentage)); // Clamp percentage 0-1

    setActiveSlider(`${String(property)}${index !== undefined ? index : ''}`);

    const calculateUpdates = (currentPercentage: number): Partial<BodyPartMapping> => {
        const updates: Partial<BodyPartMapping> = {};
        if (property === 'position' && index !== undefined) {
            // Map 0-1 percentage to POSITION_MIN to POSITION_MAX range
            const value = (currentPercentage * POSITION_RANGE) + POSITION_MIN;
            const newPosition = [...mapping.position] as [number, number, number];
            // Clamp value just in case, although percentage is already clamped
            newPosition[index] = Math.max(POSITION_MIN, Math.min(POSITION_MAX, value));
            updates.position = newPosition;
        } else if (property === 'scale') {
            const value = (currentPercentage * 0.49) + 0.01; // Range 0.01 to 0.5
            updates.scale = value;
        } else if (property === 'cameraAzimuth') {
            const value = (currentPercentage * 2 * Math.PI) - Math.PI; // Range -PI to PI
            updates.cameraAzimuth = value;
        } else if (property === 'cameraPolar') {
            const value = currentPercentage * Math.PI; // Range 0 to PI
            updates.cameraPolar = Math.max(0.01, Math.min(Math.PI - 0.01, value)); // Avoid poles slightly
        } else if (property === 'cameraDistance') {
            // Updated calculation for the new range 0.1 to 10.1
            const value = (currentPercentage * DISTANCE_RANGE) + DISTANCE_MIN;
            updates.cameraDistance = Math.max(DISTANCE_MIN, Math.min(DISTANCE_MAX, value)); // Ensure value stays within bounds
        }
        return updates;
    }

    const initialUpdates = calculateUpdates(percentage);
    if (Object.keys(initialUpdates).length > 0) {
      handleUpdate(initialUpdates);
    }

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      let movePercentage = (moveClientX - sliderRect.left) / sliderWidth;
      movePercentage = Math.max(0, Math.min(1, movePercentage)); // Clamp 0-1

      const moveUpdates = calculateUpdates(movePercentage);
      if (Object.keys(moveUpdates).length > 0) {
        handleUpdate(moveUpdates);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      setActiveSlider(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
  };

  const adjustValue = (
    property: keyof BodyPartMapping | 'cameraAzimuth' | 'cameraPolar' | 'cameraDistance',
    index: number | null, // Only relevant for 'position'
    delta: number
  ) => {
    if (!mapping) return;

    const updates: Partial<BodyPartMapping> = {};

    if (property === 'position' && index !== null) {
      const newPosition = [...mapping.position] as [number, number, number];
      let newValue = newPosition[index] + delta;
      // Clamp the value to the desired range
      newValue = Math.max(POSITION_MIN, Math.min(POSITION_MAX, newValue));
      newPosition[index] = newValue;
      updates.position = newPosition;
    } else if (property === 'scale') {
        // Clamp scale between 0.01 and 0.5
      updates.scale = Math.max(0.01, Math.min(0.5, (mapping.scale || 0.1) + delta));
    } else if (property === 'cameraAzimuth') {
        // Azimuth wraps around using modulo
      const newValue = ((mapping.cameraAzimuth || 0) + delta);
      // Normalize to -PI to PI range (optional, depends on desired behavior)
      // newValue = newValue % (2 * Math.PI);
      // if (newValue > Math.PI) newValue -= 2 * Math.PI;
      // if (newValue <= -Math.PI) newValue += 2 * Math.PI;
      updates.cameraAzimuth = newValue; // Allow wrap around for now
    } else if (property === 'cameraPolar') {
        // Clamp polar angle (typically 0 to PI, avoiding exact poles)
      const newValue = Math.max(0.01, Math.min(Math.PI - 0.01, (mapping.cameraPolar || Math.PI / 2) + delta));
      updates.cameraPolar = newValue;
    } else if (property === 'cameraDistance') {
        // Updated clamping for the new range 0.1 to 10.1
      const newValue = Math.max(DISTANCE_MIN, Math.min(DISTANCE_MAX, (mapping.cameraDistance || 1.2) + delta));
      updates.cameraDistance = newValue;
    }

    if (Object.keys(updates).length > 0) {
      handleUpdate(updates);
    }
  };

  const getHandlePosition = (
    property: keyof BodyPartMapping | 'cameraAzimuth' | 'cameraPolar' | 'cameraDistance',
    index?: number // Only relevant for 'position'
  ): string => {
    if (!mapping) return '0%';

    let percentage = 0; // Default to 0%

    if (property === 'position' && index !== undefined) {
        // Convert value from range [POSITION_MIN, POSITION_MAX] back to percentage [0, 1]
        const value = mapping.position[index];
        percentage = (value - POSITION_MIN) / POSITION_RANGE;
    } else if (property === 'scale') {
      // Map scale from 0.01-0.5 range back to 0-1 percentage
      percentage = ((mapping.scale || 0.1) - 0.01) / 0.49;
    } else if (property === 'cameraAzimuth') {
      // Map azimuth from -PI to PI range back to 0-1 percentage
      percentage = ((mapping.cameraAzimuth || 0) + Math.PI) / (2 * Math.PI);
    } else if (property === 'cameraPolar') {
      // Map polar from 0 to PI range back to 0-1 percentage
      percentage = (mapping.cameraPolar || Math.PI / 2) / Math.PI;
    } else if (property === 'cameraDistance') {
      // Updated calculation for the new range 0.1 to 10.1
      percentage = ((mapping.cameraDistance || 1.2) - DISTANCE_MIN) / DISTANCE_RANGE;
    }

    // Clamp percentage strictly between 0 and 1 before returning
    percentage = Math.max(0, Math.min(1, percentage));

    return `${percentage * 100}%`;
  };

  // Default values if mapping is null or properties are missing (for display purposes)
  const displayMapping = {
    position: mapping?.position ?? [0, 0, 0],
    scale: mapping?.scale ?? 0.1,
    cameraAzimuth: mapping?.cameraAzimuth ?? 0,
    cameraPolar: mapping?.cameraPolar ?? Math.PI / 2,
    cameraDistance: mapping?.cameraDistance ?? 1.2, // Default distance remains 1.2, which is within the new range
    // Add other BodyPartMapping properties with defaults if needed
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg max-h-[80vh] overflow-y-auto"> {/* Added overflow */}
      <h2 className="text-xl font-bold text-white mb-4">Mapping Controls</h2>

      {/* Category and Placement Selection */}
      <div className="mb-6 space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Category</label>
          <select
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={categories.length === 0}
          >
            <option value="" disabled={selectedCategory !== ""}>-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Placement</label>
          <select
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedPlacement}
            onChange={handlePlacementChange}
            disabled={placements.length === 0 || !selectedCategory}
          >
             <option value="" disabled={selectedPlacement !== ""}>-- Select Placement --</option>
            {placements.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        {selectedCategory || 'N/A'} / {selectedPlacement || 'N/A'}
      </div>

      {mapping ? (
        <div className="space-y-6">
          {/* Position Controls */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-200">Position ({POSITION_MIN} to {POSITION_MAX})</h3>

            {/* X Position */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">X Position</label>
                <div className="flex items-center space-x-2">
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('position', 0, -POSITION_STEP)}
                    disabled={displayMapping.position[0] <= POSITION_MIN}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-300 tabular-nums">
                    {displayMapping.position[0].toFixed(2)}
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('position', 0, POSITION_STEP)}
                     disabled={displayMapping.position[0] >= POSITION_MAX}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="h-6 bg-gray-700 rounded-md relative cursor-pointer"
                onMouseDown={(e) => handleSliderDrag(e, 'position', 0)}
                onTouchStart={(e) => handleSliderDrag(e, 'position', 0)}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-md" style={{ width: getHandlePosition('position', 0) }}></div>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 transition-transform ${activeSlider === 'position0' ? 'scale-125 border-indigo-400' : 'scale-100'}`}
                  style={{ left: getHandlePosition('position', 0) }}
                ></div>
              </div>
            </div>

            {/* Y Position */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Y Position</label>
                <div className="flex items-center space-x-2">
                   <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('position', 1, -POSITION_STEP)}
                    disabled={displayMapping.position[1] <= POSITION_MIN}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-300 tabular-nums">
                    {displayMapping.position[1].toFixed(2)}
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('position', 1, POSITION_STEP)}
                    disabled={displayMapping.position[1] >= POSITION_MAX}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="h-6 bg-gray-700 rounded-md relative cursor-pointer"
                onMouseDown={(e) => handleSliderDrag(e, 'position', 1)}
                onTouchStart={(e) => handleSliderDrag(e, 'position', 1)}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-md" style={{ width: getHandlePosition('position', 1) }}></div>
                <div
                   className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 transition-transform ${activeSlider === 'position1' ? 'scale-125 border-indigo-400' : 'scale-100'}`}
                   style={{ left: getHandlePosition('position', 1) }}
                ></div>
              </div>
            </div>

            {/* Z Position */}
            <div className="space-y-1">
               <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Z Position</label>
                <div className="flex items-center space-x-2">
                   <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('position', 2, -POSITION_STEP)}
                    disabled={displayMapping.position[2] <= POSITION_MIN}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-300 tabular-nums">
                    {displayMapping.position[2].toFixed(2)}
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('position', 2, POSITION_STEP)}
                    disabled={displayMapping.position[2] >= POSITION_MAX}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="h-6 bg-gray-700 rounded-md relative cursor-pointer"
                onMouseDown={(e) => handleSliderDrag(e, 'position', 2)}
                onTouchStart={(e) => handleSliderDrag(e, 'position', 2)}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-md" style={{ width: getHandlePosition('position', 2) }}></div>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 transition-transform ${activeSlider === 'position2' ? 'scale-125 border-indigo-400' : 'scale-100'}`}
                  style={{ left: getHandlePosition('position', 2) }}
                ></div>
              </div>
            </div>
          </div>

          {/* Scale Control */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-200">Scale</h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Size</label>
                 <div className="flex items-center space-x-2">
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('scale', null, -0.01)}
                    disabled={displayMapping.scale <= 0.01}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-300 tabular-nums">
                    {displayMapping.scale.toFixed(2)}
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('scale', null, 0.01)}
                    disabled={displayMapping.scale >= 0.5}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="h-6 bg-gray-700 rounded-md relative cursor-pointer"
                onMouseDown={(e) => handleSliderDrag(e, 'scale')}
                onTouchStart={(e) => handleSliderDrag(e, 'scale')}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-md" style={{ width: getHandlePosition('scale') }}></div>
                <div
                   className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 transition-transform ${activeSlider === 'scale' ? 'scale-125 border-indigo-400' : 'scale-100'}`}
                   style={{ left: getHandlePosition('scale') }}
                ></div>
              </div>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="space-y-4">
             <h3 className="text-md font-semibold text-gray-200">Camera Controls</h3>
            {/* Camera Azimuth Control */}
            <div className="space-y-1">
               <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Azimuth (Horizontal)</label>
                 <div className="flex items-center space-x-2">
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                    onClick={() => adjustValue('cameraAzimuth', null, -Math.PI / 16)}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-300 tabular-nums">
                    {(displayMapping.cameraAzimuth * 180 / Math.PI).toFixed(1)}°
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                    onClick={() => adjustValue('cameraAzimuth', null, Math.PI / 16)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="h-6 bg-gray-700 rounded-md relative cursor-pointer"
                onMouseDown={(e) => handleSliderDrag(e, 'cameraAzimuth')}
                onTouchStart={(e) => handleSliderDrag(e, 'cameraAzimuth')}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-md" style={{ width: getHandlePosition('cameraAzimuth') }}></div>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 transition-transform ${activeSlider === 'cameraAzimuth' ? 'scale-125 border-indigo-400' : 'scale-100'}`}
                  style={{ left: getHandlePosition('cameraAzimuth') }}
                ></div>
              </div>
            </div>

            {/* Camera Polar Control */}
            <div className="space-y-1">
               <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Polar (Vertical)</label>
                <div className="flex items-center space-x-2">
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('cameraPolar', null, -Math.PI / 16)}
                    disabled={displayMapping.cameraPolar <= 0.01}
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-300 tabular-nums">
                    {(displayMapping.cameraPolar * 180 / Math.PI).toFixed(1)}°
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('cameraPolar', null, Math.PI / 16)}
                    disabled={displayMapping.cameraPolar >= Math.PI - 0.01}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="h-6 bg-gray-700 rounded-md relative cursor-pointer"
                onMouseDown={(e) => handleSliderDrag(e, 'cameraPolar')}
                onTouchStart={(e) => handleSliderDrag(e, 'cameraPolar')}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-md" style={{ width: getHandlePosition('cameraPolar') }}></div>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 transition-transform ${activeSlider === 'cameraPolar' ? 'scale-125 border-indigo-400' : 'scale-100'}`}
                  style={{ left: getHandlePosition('cameraPolar') }}
                ></div>
              </div>
            </div>

            {/* Camera Distance Control -- UPDATED SECTION */}
            <div className="space-y-1">
               <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Distance ({DISTANCE_MIN.toFixed(1)} to {DISTANCE_MAX.toFixed(1)})</label> {/* Display new range */}
                 <div className="flex items-center space-x-2">
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('cameraDistance', null, -DISTANCE_STEP)} // Use new step
                    disabled={displayMapping.cameraDistance <= DISTANCE_MIN} // Use new min
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-gray-300 tabular-nums">
                    {displayMapping.cameraDistance.toFixed(1)}
                  </span>
                  <button
                    className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white disabled:opacity-50"
                    onClick={() => adjustValue('cameraDistance', null, DISTANCE_STEP)} // Use new step
                    disabled={displayMapping.cameraDistance >= DISTANCE_MAX} // Use new max
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="h-6 bg-gray-700 rounded-md relative cursor-pointer"
                onMouseDown={(e) => handleSliderDrag(e, 'cameraDistance')}
                onTouchStart={(e) => handleSliderDrag(e, 'cameraDistance')}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-600 rounded-l-md" style={{ width: getHandlePosition('cameraDistance') }}></div>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 transition-transform ${activeSlider === 'cameraDistance' ? 'scale-125 border-indigo-400' : 'scale-100'}`}
                  style={{ left: getHandlePosition('cameraDistance') }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-400">
          Select a category and placement to adjust mapping
        </div>
      )}
    </div>
  );
};

export default MappingControls; // Optional: If you use default export