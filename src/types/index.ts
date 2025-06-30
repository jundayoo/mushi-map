export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Insect {
  id: string;
  name: string;
  scientificName?: string;
  imageUrls: string[];
  description?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  discoveredAt: string;
  weather?: string;
  temperature?: number;
  environment?: string;
  tags?: string[];
  isPublic: boolean;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  userId: string;
}

export interface CreateInsectDto {
  name: string;
  scientificName?: string;
  imageUrls: string[];
  description?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  discoveredAt?: string;
  weather?: string;
  temperature?: number;
  environment?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface SearchInsectsDto {
  keyword?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}