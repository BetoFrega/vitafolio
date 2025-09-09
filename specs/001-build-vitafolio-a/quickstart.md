# Quickstart Guide: Core Life Management System

## Overview

This quickstart guide walks through the complete user journey of the Vitafolio life management system, demonstrating collection creation, item management, and notification features.

## Prerequisites

- System running with authentication enabled
- Valid user account and authentication token
- API accessible at base URL `/api/v1`

## Story 1: Setting Up a Library Collection

### Step 1: Create Library Collection

Create a collection for managing books with custom metadata.

**Request:**

```bash
curl -X POST http://localhost:3000/api/v1/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Library",
    "description": "Personal book collection",
    "metadataSchema": {
      "fields": {
        "title": {
          "type": "text",
          "required": true,
          "description": "Book title"
        },
        "author": {
          "type": "text",
          "required": true,
          "description": "Book author"
        },
        "isbn": {
          "type": "text",
          "required": false,
          "description": "ISBN number"
        },
        "rating": {
          "type": "number",
          "required": false,
          "description": "Personal rating 1-5"
        },
        "dateRead": {
          "type": "date",
          "required": false,
          "description": "Date when book was read"
        }
      },
      "requiredFields": ["title", "author"]
    }
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "lib-uuid-123",
      "name": "My Library",
      "description": "Personal book collection",
      "metadataSchema": { ... },
      "itemCount": 0,
      "createdAt": "2025-09-09T10:00:00Z",
      "updatedAt": "2025-09-09T10:00:00Z"
    }
  },
  "timestamp": "2025-09-09T10:00:00Z"
}
```

### Step 2: Add Books to Library

Add several books with different metadata combinations.

**Add first book (all fields):**

```bash
curl -X POST http://localhost:3000/api/v1/collections/lib-uuid-123/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clean Architecture",
    "metadata": {
      "title": "Clean Architecture: A Craftsman Guide to Software Structure and Design",
      "author": "Robert C. Martin",
      "isbn": "978-0134494166",
      "rating": 5,
      "dateRead": "2025-08-15"
    }
  }'
```

**Add second book (minimal required fields):**

```bash
curl -X POST http://localhost:3000/api/v1/collections/lib-uuid-123/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "The Pragmatic Programmer",
    "metadata": {
      "title": "The Pragmatic Programmer: Your Journey to Mastery",
      "author": "Andy Hunt"
    }
  }'
```

### Step 3: View Library Collection

Retrieve the collection to see the added books.

**Request:**

```bash
curl -X GET http://localhost:3000/api/v1/collections/lib-uuid-123/items \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item-uuid-1",
        "name": "Clean Architecture",
        "collectionId": "lib-uuid-123",
        "metadata": {
          "title": "Clean Architecture: A Craftsman Guide to Software Structure and Design",
          "author": "Robert C. Martin",
          "isbn": "978-0134494166",
          "rating": 5,
          "dateRead": "2025-08-15"
        },
        "createdAt": "2025-09-09T10:01:00Z",
        "updatedAt": "2025-09-09T10:01:00Z"
      },
      {
        "id": "item-uuid-2",
        "name": "The Pragmatic Programmer",
        "collectionId": "lib-uuid-123",
        "metadata": {
          "title": "The Pragmatic Programmer: Your Journey to Mastery",
          "author": "Andy Hunt"
        },
        "createdAt": "2025-09-09T10:02:00Z",
        "updatedAt": "2025-09-09T10:02:00Z"
      }
    ],
    "pagination": {
      "total": 2,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Story 2: Managing Pantry with Expiration Tracking

### Step 1: Create Pantry Collection

Set up a collection for food items with expiration tracking.

**Request:**

```bash
curl -X POST http://localhost:3000/api/v1/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pantry",
    "description": "Food inventory with expiration tracking",
    "metadataSchema": {
      "fields": {
        "quantity": {
          "type": "number",
          "required": true,
          "description": "Amount of item"
        },
        "unit": {
          "type": "text",
          "required": true,
          "description": "Unit of measurement"
        },
        "expirationDate": {
          "type": "date",
          "required": false,
          "description": "When item expires"
        },
        "location": {
          "type": "text",
          "required": false,
          "description": "Where item is stored"
        },
        "perishable": {
          "type": "boolean",
          "required": false,
          "description": "Whether item can spoil"
        }
      },
      "requiredFields": ["quantity", "unit"]
    }
  }'
```

### Step 2: Add Food Items

Add items with expiration dates to trigger notifications.

**Add expiring tomatoes:**

```bash
curl -X POST http://localhost:3000/api/v1/collections/pantry-uuid-456/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Roma Tomatoes",
    "metadata": {
      "quantity": 6,
      "unit": "pieces",
      "expirationDate": "2025-09-15",
      "location": "refrigerator",
      "perishable": true
    }
  }'
```

**Add non-perishable rice:**

```bash
curl -X POST http://localhost:3000/api/v1/collections/pantry-uuid-456/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jasmine Rice",
    "metadata": {
      "quantity": 2,
      "unit": "kg",
      "location": "pantry",
      "perishable": false
    }
  }'
```

### Step 3: Check Generated Notifications

View notifications for upcoming expirations.

**Request:**

```bash
curl -X GET http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-uuid-1",
        "type": "expiration",
        "message": "Your Roma Tomatoes expire in 6 days",
        "itemId": "item-uuid-3",
        "itemName": "Roma Tomatoes",
        "scheduledFor": "2025-09-12T09:00:00Z",
        "status": "pending",
        "metadata": {
          "expirationDate": "2025-09-15T00:00:00Z",
          "daysUntilExpiration": 6,
          "location": "refrigerator"
        }
      }
    ]
  }
}
```

## Story 3: Tracking Appliance Maintenance

### Step 1: Create Appliances Collection

Set up collection for household appliances with maintenance scheduling.

**Request:**

```bash
curl -X POST http://localhost:3000/api/v1/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Appliances",
    "description": "Household appliances and maintenance tracking",
    "metadataSchema": {
      "fields": {
        "brand": {
          "type": "text",
          "required": true,
          "description": "Appliance brand"
        },
        "model": {
          "type": "text",
          "required": false,
          "description": "Model number"
        },
        "purchaseDate": {
          "type": "date",
          "required": false,
          "description": "When appliance was purchased"
        },
        "lastMaintenance": {
          "type": "date",
          "required": false,
          "description": "Last maintenance date"
        },
        "maintenanceInterval": {
          "type": "number",
          "required": false,
          "description": "Days between maintenance"
        },
        "warrantyExpires": {
          "type": "date",
          "required": false,
          "description": "Warranty expiration date"
        }
      },
      "requiredFields": ["brand"]
    }
  }'
```

### Step 2: Add Air Conditioner

Add appliance with maintenance schedule.

**Request:**

```bash
curl -X POST http://localhost:3000/api/v1/collections/appliances-uuid-789/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room AC",
    "metadata": {
      "brand": "Carrier",
      "model": "25HCB6",
      "purchaseDate": "2024-05-15",
      "lastMaintenance": "2025-06-01",
      "maintenanceInterval": 90,
      "warrantyExpires": "2027-05-15"
    }
  }'
```

## Story 4: Cross-Collection Search

### Step 1: Search for "Clean"

Search across all collections for items containing "clean".

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/search/items?q=clean" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item-uuid-1",
        "name": "Clean Architecture",
        "collectionId": "lib-uuid-123",
        "collectionName": "My Library",
        "metadata": {
          "title": "Clean Architecture: A Craftsman Guide to Software Structure and Design",
          "author": "Robert C. Martin",
          "isbn": "978-0134494166",
          "rating": 5,
          "dateRead": "2025-08-15"
        },
        "relevanceScore": 0.95
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### Step 2: Filter Search by Collection

Search only within the pantry collection.

**Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/search/items?q=tomato&collections=pantry-uuid-456" \
  -H "Authorization: Bearer $TOKEN"
```

## Story 5: Managing Collections

### Step 1: List All Collections

Get overview of all user's collections.

**Request:**

```bash
curl -X GET http://localhost:3000/api/v1/collections \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "lib-uuid-123",
        "name": "My Library",
        "description": "Personal book collection",
        "metadataSchema": { ... },
        "itemCount": 2,
        "createdAt": "2025-09-09T10:00:00Z",
        "updatedAt": "2025-09-09T10:00:00Z"
      },
      {
        "id": "pantry-uuid-456",
        "name": "Pantry",
        "description": "Food inventory with expiration tracking",
        "metadataSchema": { ... },
        "itemCount": 2,
        "createdAt": "2025-09-09T10:05:00Z",
        "updatedAt": "2025-09-09T10:05:00Z"
      },
      {
        "id": "appliances-uuid-789",
        "name": "Appliances",
        "description": "Household appliances and maintenance tracking",
        "metadataSchema": { ... },
        "itemCount": 1,
        "createdAt": "2025-09-09T10:10:00Z",
        "updatedAt": "2025-09-09T10:10:00Z"
      }
    ]
  }
}
```

### Step 2: Update Collection Schema

Add a new field to the library collection schema.

**Add genre field:**

```bash
curl -X POST http://localhost:3000/api/v1/collections/lib-uuid-123/schema/fields \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "genre",
    "fieldDefinition": {
      "type": "text",
      "required": false,
      "description": "Book genre"
    }
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "schema": {
      "fields": {
        "title": { "type": "text", "required": true },
        "author": { "type": "text", "required": true },
        "isbn": { "type": "text", "required": false },
        "rating": { "type": "number", "required": false },
        "dateRead": { "type": "date", "required": false },
        "genre": { "type": "text", "required": false }
      },
      "requiredFields": ["title", "author"]
    },
    "addedField": "genre",
    "version": 2
  }
}
```

**Update existing book with genre:**

```bash
curl -X PUT http://localhost:3000/api/v1/items/item-uuid-1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clean Architecture",
    "metadata": {
      "title": "Clean Architecture: A Craftsman Guide to Software Structure and Design",
      "author": "Robert C. Martin",
      "isbn": "978-0134494166",
      "rating": 5,
      "dateRead": "2025-08-15",
      "genre": "Software Engineering"
    }
  }'
```

### Step 3: View Updated Schema

Retrieve the collection schema to confirm the changes.

**Request:**

```bash
curl -X GET http://localhost:3000/api/v1/collections/lib-uuid-123/schema \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "schema": {
      "fields": {
        "title": {
          "type": "text",
          "required": true,
          "description": "Book title"
        },
        "author": {
          "type": "text",
          "required": true,
          "description": "Book author"
        },
        "isbn": {
          "type": "text",
          "required": false,
          "description": "ISBN number"
        },
        "rating": {
          "type": "number",
          "required": false,
          "description": "Personal rating 1-5"
        },
        "dateRead": {
          "type": "date",
          "required": false,
          "description": "Date when book was read"
        },
        "genre": {
          "type": "text",
          "required": false,
          "description": "Book genre"
        }
      },
      "requiredFields": ["title", "author"]
    },
    "version": 2,
    "lastModified": "2025-09-09T10:15:00Z"
  }
}
```

## Validation Scenarios

### Test Invalid Metadata

Try to create an item that doesn't conform to schema.

**Request (missing required field):**

```bash
curl -X POST http://localhost:3000/api/v1/collections/lib-uuid-123/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Incomplete Book",
    "metadata": {
      "title": "Book with Missing Author"
    }
  }'
```

**Expected Response (400 Error):**

```json
{
  "success": false,
  "error": {
    "code": "METADATA_VALIDATION_FAILED",
    "message": "Item metadata doesn't conform to collection schema",
    "details": {
      "missingRequiredFields": ["author"],
      "fieldErrors": []
    }
  },
  "timestamp": "2025-09-09T10:15:00Z"
}
```

### Test Delete Non-Empty Collection

Try to delete a collection that contains items.

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/v1/collections/lib-uuid-123 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (409 Error):**

```json
{
  "success": false,
  "error": {
    "code": "COLLECTION_NOT_EMPTY",
    "message": "Cannot delete collection containing items",
    "details": {
      "itemCount": 2,
      "collectionId": "lib-uuid-123"
    }
  },
  "timestamp": "2025-09-09T10:16:00Z"
}
```

### Test Invalid Schema Change

Try to make an optional field required when existing items have null values.

**Request (try to make 'isbn' required):**

```bash
curl -X PUT http://localhost:3000/api/v1/collections/lib-uuid-123/schema/fields/isbn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "required": true,
    "description": "ISBN number (now required)"
  }'
```

**Expected Response (400 Error):**

```json
{
  "success": false,
  "error": {
    "code": "CANNOT_REQUIRE_FIELD_WITH_NULLS",
    "message": "Cannot make field required when existing items have null values",
    "details": {
      "fieldName": "isbn",
      "itemsWithNullValues": 1,
      "affectedItems": ["item-uuid-2"]
    }
  },
  "timestamp": "2025-09-09T10:17:00Z"
}
```

### Test Remove Required Field

Try to remove a required field that has data.

**Request (try to remove 'author' field):**

```bash
curl -X DELETE http://localhost:3000/api/v1/collections/lib-uuid-123/schema/fields/author \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (409 Error):**

```json
{
  "success": false,
  "error": {
    "code": "REQUIRED_FIELD_HAS_DATA",
    "message": "Cannot remove required field that contains data",
    "details": {
      "fieldName": "author",
      "isRequired": true,
      "itemsWithData": 2
    }
  },
  "timestamp": "2025-09-09T10:18:00Z"
}
```

## Success Criteria

### ✅ Collection Management

- [x] User can create collections with custom metadata schemas
- [x] User can view all their collections
- [x] User can update collection details and schemas (when compatible)
- [x] User can delete empty collections
- [x] System prevents deletion of non-empty collections

### ✅ Item Management

- [x] User can add items to collections with metadata
- [x] User can view all items in a collection
- [x] User can update item details and metadata
- [x] User can delete items from collections
- [x] System validates metadata against collection schema

### ✅ Search & Discovery

- [x] User can search items across all collections
- [x] User can filter searches by specific collections
- [x] Search results include relevance scoring
- [x] Search works on item names and metadata values

### ✅ Notifications

- [x] System generates notifications for upcoming expirations
- [x] System generates notifications for maintenance schedules
- [x] User can view pending notifications
- [x] Notifications include relevant context and metadata

### ✅ Data Isolation & Security

- [x] User only sees their own collections and items
- [x] Authentication required for all operations
- [x] Authorization enforced at data access level
- [x] Cross-user data access prevented

### ✅ API Quality

- [x] Consistent error response format
- [x] Proper HTTP status codes
- [x] Comprehensive validation messages
- [x] Rate limiting implemented
- [x] OpenAPI documentation available

## Performance Expectations

- Collection listing: < 200ms
- Item listing (50 items): < 300ms
- Search queries: < 500ms
- Item creation: < 100ms
- API throughput: 100+ requests/minute per user
