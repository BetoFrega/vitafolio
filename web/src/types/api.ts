// API Types for Vitafolio frontend
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
}

export interface Item {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchItemsRequest {
  query: string;
}

export interface ApiError {
  message: string;
  status: number;
}
