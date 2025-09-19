// API client for communicating with the Vitafolio backend
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Collection,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  Item,
  CreateItemRequest,
  UpdateItemRequest,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    return this.request<Collection[]>("/api/v1/collections");
  }

  async getCollection(id: string): Promise<Collection> {
    return this.request<Collection>(`/api/v1/collections/${id}`);
  }

  async createCollection(data: CreateCollectionRequest): Promise<Collection> {
    return this.request<Collection>("/api/v1/collections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCollection(
    id: string,
    data: UpdateCollectionRequest,
  ): Promise<Collection> {
    return this.request<Collection>(`/api/v1/collections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string): Promise<void> {
    return this.request<void>(`/api/v1/collections/${id}`, {
      method: "DELETE",
    });
  }

  // Items
  async getItems(collectionId: string): Promise<Item[]> {
    return this.request<Item[]>(`/api/v1/collections/${collectionId}/items`);
  }

  async getItem(collectionId: string, itemId: string): Promise<Item> {
    return this.request<Item>(
      `/api/v1/collections/${collectionId}/items/${itemId}`,
    );
  }

  async createItem(
    collectionId: string,
    data: CreateItemRequest,
  ): Promise<Item> {
    return this.request<Item>(`/api/v1/collections/${collectionId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateItem(
    collectionId: string,
    itemId: string,
    data: UpdateItemRequest,
  ): Promise<Item> {
    return this.request<Item>(
      `/api/v1/collections/${collectionId}/items/${itemId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  }

  async deleteItem(collectionId: string, itemId: string): Promise<void> {
    return this.request<void>(
      `/api/v1/collections/${collectionId}/items/${itemId}`,
      {
        method: "DELETE",
      },
    );
  }

  async searchItems(collectionId: string, query: string): Promise<Item[]> {
    return this.request<Item[]>(
      `/api/v1/collections/${collectionId}/items/search?q=${encodeURIComponent(query)}`,
    );
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
