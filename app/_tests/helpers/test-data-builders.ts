/**
 * Test data builders for E2E tests
 * Creates realistic test data with sensible defaults
 */
export class TestDataBuilder {
  static collection(overrides?: Partial<CollectionData>): CollectionData {
    return {
      name: "Test Collection",
      description: "A test collection for E2E testing",
      metadataSchema: {
        fields: {
          title: { type: "text", required: true },
          author: { type: "text", required: false },
          category: { type: "text", required: false },
        },
      },
      ...overrides,
    };
  }

  static item(overrides?: Partial<ItemData>): ItemData {
    return {
      name: "Test Item",
      metadata: {
        title: "Test Title",
        author: "Test Author",
        category: "Test Category",
      },
      ...overrides,
    };
  }

  static user(overrides?: Partial<UserData>): UserData {
    const timestamp = Date.now();
    return {
      email: `test.user.${timestamp}@example.com`,
      password: "Test123!",
      confirmPassword: "Test123!",
      ...overrides,
    };
  }

  static bookCollection(overrides?: Partial<CollectionData>): CollectionData {
    return {
      name: "Book Library",
      description: "My personal book collection",
      metadataSchema: {
        fields: {
          title: { type: "text", required: true },
          author: { type: "text", required: true },
          isbn: { type: "text", required: false },
          pages: { type: "number", required: false },
          publishedYear: { type: "number", required: false },
          genre: { type: "text", required: false },
        },
      },
      ...overrides,
    };
  }

  static book(overrides?: Partial<ItemData>): ItemData {
    return {
      name: "The Great Gatsby",
      metadata: {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "978-0-7432-7356-5",
        pages: 180,
        publishedYear: 1925,
        genre: "Fiction",
      },
      ...overrides,
    };
  }

  static movieCollection(overrides?: Partial<CollectionData>): CollectionData {
    return {
      name: "Movie Watchlist",
      description: "Movies I want to watch",
      metadataSchema: {
        fields: {
          title: { type: "text", required: true },
          director: { type: "text", required: true },
          year: { type: "number", required: false },
          rating: { type: "text", required: false },
          genre: { type: "text", required: false },
        },
      },
      ...overrides,
    };
  }

  static movie(overrides?: Partial<ItemData>): ItemData {
    return {
      name: "Inception",
      metadata: {
        title: "Inception",
        director: "Christopher Nolan",
        year: 2010,
        rating: "PG-13",
        genre: "Sci-Fi",
      },
      ...overrides,
    };
  }
}

// Type definitions for test data
export interface CollectionData {
  name: string;
  description: string;
  metadataSchema: {
    fields: Record<string, { type: string; required: boolean }>;
  };
}

export interface ItemData {
  name: string;
  metadata: Record<string, string | number | boolean>;
}

export interface UserData {
  email: string;
  password: string;
  confirmPassword: string;
}
