import { FieldValue, Timestamp } from 'firebase/firestore';

export enum DietType {
  None = 'none',
  Vegan = 'vegan',
  Vegetarian = 'vegetarian',
  Keto = 'keto',
  Paleo = 'paleo',
  GlutenFree = 'gluten-free'
}

export interface UserPreferences {
  allergies: string[];
  diet: DietType;
  goals: string[];
  healthConditions: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  preferences: UserPreferences;
  createdAt: Timestamp | FieldValue;
}

export interface ScanAnalysis {
  nutritionInfo?: Record<string, string>;
  ingredients: string[];
  score: number;
  summary: string;
  isGoodMatch: boolean;
  recommendation: string;
  warnings: string[];
}

export interface ProductScan {
  id?: string;
  userId: string;
  productName: string;
  category: 'food' | 'beverage' | 'personal-care' | 'household' | 'other';
  imageUrl: string;
  analysis: ScanAnalysis;
  scannedAt: Timestamp | FieldValue;
}
