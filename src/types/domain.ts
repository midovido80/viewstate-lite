export type ContactRole =
  | 'tenant'
  | 'owner'
  | 'broker'
  | 'real_estate_company'
  | 'building_guard';

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'floor'
  | 'building'
  | 'office'
  | 'shop'
  | 'warehouse'
  | 'chalet';

export type Furnishing = 'furnished' | 'semi_furnished' | 'unfurnished' | 'any';
export type PropertyStatus = 'available' | 'rented' | 'paused';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  role: ContactRole;
  notes: string;
  source: 'manual' | 'device';
  createdAt: string;
  updatedAt: string;
}

export interface Requirement {
  id: string;
  contactId: string;
  areas: string[];
  propertyTypes: PropertyType[];
  minRent: number | null;
  maxRent: number | null;
  minBedrooms: number | null;
  furnishing: Furnishing;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  area: string;
  monthlyRent: number;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  furnishing: Exclude<Furnishing, 'any'>;
  description: string;
  privateNotes: string;
  paci: string;
  mapUrl: string;
  latitude: number | null;
  longitude: number | null;
  ownerContactId: string | null;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyMedia {
  id: string;
  propertyId: string;
  uri: string;
  kind: 'image' | 'video';
  sortOrder: number;
  createdAt: string;
}

export interface MatchResult {
  propertyId: string;
  requirementId: string;
  score: number;
  reasons: string[];
  blockers: string[];
}

