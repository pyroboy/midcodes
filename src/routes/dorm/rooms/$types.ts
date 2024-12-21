interface Room {
  id: number;
  number: number;
  property_id: number;
  floor_id: number;
  name: string;
  type: string;
  room_status: 'VACANT' | 'OCCUPIED';
  capacity: number;
  base_rate: number;
  amenities: string[];
  property: {
    name: string;
  };
  floor: {
    floor_number: number;
    wing?: string;
  };
}

interface Property {
  id: number;
  name: string;
}

interface Floor {
  id: number;
  property_id: number;
  floor_number: number;
  wing?: string;
}

export interface PageData {
  rooms: Room[];
  properties: Property[];
  floors: Floor[];
  form: Record<string, any>;
  user: {
    role: string;
  };
}
