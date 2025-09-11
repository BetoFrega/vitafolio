# API Contracts: Core Life Management System

## Overview

HTTP API contracts for collection and item management operations. All endpoints require authentication via existing IAM system.

## Base URL

All endpoints are prefixed with `/api/v1`

## Authentication

All endpoints require valid authentication token in `Authorization: Bearer <token>` header.

## Common Response Patterns

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-09-09T10:00:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2025-09-09T10:00:00Z"
}
```

## Collections API

### GET /collections

Retrieve all collections for authenticated user.

**Request**: No body required

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "uuid",
        "name": "Library",
        "description": "My book collection",
        "metadataSchema": {
          "fields": {
            "title": { "type": "text", "required": true },
            "author": { "type": "text", "required": true },
            "isbn": { "type": "text", "required": false }
          },
          "requiredFields": ["title", "author"]
        },
        "itemCount": 42,
        "createdAt": "2025-09-01T10:00:00Z",
        "updatedAt": "2025-09-05T15:30:00Z"
      }
    ]
  }
}
```

### POST /collections

Create a new collection.

**Request**: 201 Created

```json
{
  "name": "Pantry",
  "description": "Food inventory tracking",
  "metadataSchema": {
    "fields": {
      "quantity": { "type": "number", "required": true },
      "unit": { "type": "text", "required": true },
      "expirationDate": { "type": "date", "required": false }
    },
    "requiredFields": ["quantity", "unit"]
  }
}
```

**Response**: 201 Created

```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "uuid",
      "name": "Pantry",
      "description": "Food inventory tracking",
      "metadataSchema": { ... },
      "itemCount": 0,
      "createdAt": "2025-09-09T10:00:00Z",
      "updatedAt": "2025-09-09T10:00:00Z"
    }
  }
}
```

**Errors**:

- 400: Invalid schema or duplicate name
- 401: Authentication required
- 422: Validation errors

### GET /collections/:id

Retrieve specific collection by ID.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "uuid",
      "name": "Library",
      "description": "My book collection",
      "metadataSchema": { ... },
      "itemCount": 42,
      "createdAt": "2025-09-01T10:00:00Z",
      "updatedAt": "2025-09-05T15:30:00Z"
    }
  }
}
```

**Errors**:

- 404: Collection not found or not owned by user
- 401: Authentication required

### PUT /collections/:id

Update existing collection (name and description only).

**Request**:

```json
{
  "name": "Updated Library",
  "description": "My updated book collection"
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "collection": { ... }
  }
}
```

**Errors**:

- 404: Collection not found
- 422: Validation errors

### DELETE /collections/:id

Delete collection (only if empty).

**Response**: 204 No Content

**Errors**:

- 404: Collection not found
- 409: Collection contains items
- 401: Authentication required

## Collection Schema API

### GET /collections/:id/schema

Get the metadata schema for a collection.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "schema": {
      "fields": {
        "title": { "type": "text", "required": true },
        "author": { "type": "text", "required": true },
        "isbn": { "type": "text", "required": false }
      },
      "requiredFields": ["title", "author"]
    },
    "version": 1,
    "lastModified": "2025-09-05T15:30:00Z"
  }
}
```

### PUT /collections/:id/schema

Update the metadata schema for a collection.

**Request**:

```json
{
  "fields": {
    "title": { "type": "text", "required": true },
    "author": { "type": "text", "required": true },
    "isbn": { "type": "text", "required": false },
    "rating": { "type": "number", "required": false },
    "genre": { "type": "text", "required": false }
  },
  "requiredFields": ["title", "author"]
}
```

**Response**: 200 OK

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
        "genre": { "type": "text", "required": false }
      },
      "requiredFields": ["title", "author"]
    },
    "version": 2,
    "lastModified": "2025-09-09T10:30:00Z"
  }
}
```

**Errors**:

- 404: Collection not found
- 400: Schema incompatible with existing items
- 422: Schema validation errors

### POST /collections/:id/schema/fields

Add a single field to the collection schema.

**Request**:

```json
{
  "fieldName": "genre",
  "fieldDefinition": {
    "type": "text",
    "required": false,
    "description": "Book genre"
  }
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "schema": { ... },
    "addedField": "genre",
    "version": 3
  }
}
```

### PUT /collections/:id/schema/fields/:fieldName

Update a specific field in the collection schema.

**Request**:

```json
{
  "type": "text",
  "required": true,
  "description": "Updated book genre (now required)"
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "schema": { ... },
    "updatedField": "genre",
    "version": 4
  }
}
```

**Errors**:

- 404: Collection or field not found
- 400: Field change incompatible with existing items (e.g., making optional field required when items have null values)

### DELETE /collections/:id/schema/fields/:fieldName

Remove a field from the collection schema.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "schema": { ... },
    "removedField": "isbn",
    "version": 5
  }
}
```

**Errors**:

- 404: Collection or field not found
- 400: Cannot remove required field that has data in existing items
- 409: Field is required and cannot be removed

## Items API

### GET /collections/:collectionId/items

Retrieve all items in a collection.

**Query Parameters**:

- `search`: Search term for item names
- `metadata[field]`: Filter by metadata field value
- `limit`: Number of items to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Clean Architecture",
        "collectionId": "uuid",
        "metadata": {
          "title": "Clean Architecture",
          "author": "Robert C. Martin",
          "isbn": "978-0134494166"
        },
        "createdAt": "2025-09-01T10:00:00Z",
        "updatedAt": "2025-09-01T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### POST /collections/:collectionId/items

Create new item in collection.

**Request**:

```json
{
  "name": "The Pragmatic Programmer",
  "metadata": {
    "title": "The Pragmatic Programmer",
    "author": "Andy Hunt",
    "isbn": "978-0135957059"
  }
}
```

**Response**: 201 Created

```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "name": "The Pragmatic Programmer",
      "collectionId": "uuid",
      "metadata": { ... },
      "createdAt": "2025-09-09T10:00:00Z",
      "updatedAt": "2025-09-09T10:00:00Z"
    }
  }
}
```

**Errors**:

- 404: Collection not found
- 400: Metadata doesn't conform to collection schema
- 422: Validation errors

### GET /items/:id

Retrieve specific item by ID.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "name": "Clean Architecture",
      "collectionId": "uuid",
      "metadata": { ... },
      "createdAt": "2025-09-01T10:00:00Z",
      "updatedAt": "2025-09-01T10:00:00Z"
    },
    "collection": {
      "id": "uuid",
      "name": "Library"
    }
  }
}
```

### PUT /items/:id

Update existing item (name and/or metadata).

**Request**:

```json
{
  "name": "Clean Architecture (Updated)",
  "metadata": {
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "isbn": "978-0134494166",
    "rating": 5
  }
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "item": { ... }
  }
}
```

### PATCH /items/:id/metadata

Update specific metadata fields without replacing entire metadata object.

**Request**:

```json
{
  "rating": 5,
  "genre": "Software Engineering"
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "name": "Clean Architecture",
      "metadata": {
        "title": "Clean Architecture",
        "author": "Robert C. Martin",
        "isbn": "978-0134494166",
        "rating": 5,
        "genre": "Software Engineering"
      },
      "updatedAt": "2025-09-09T10:30:00Z"
    },
    "updatedFields": ["rating", "genre"]
  }
}
```

**Errors**:

- 404: Item not found
- 400: Metadata fields don't conform to collection schema
- 422: Field validation errors

### DELETE /items/:id/metadata/:fieldName

Remove a specific metadata field from an item.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "item": { ... },
    "removedField": "isbn"
  }
}
```

**Errors**:

- 404: Item or field not found
- 400: Cannot remove required field

### DELETE /items/:id

Delete item.

**Response**: 204 No Content

**Errors**:

- 404: Item not found
- 401: Authentication required

## Search API

### GET /search/items

Search items across all collections.

**Query Parameters**:

- `q`: Search query (searches names and metadata values)
- `collections`: Comma-separated collection IDs to search in
- `metadata[field]`: Filter by specific metadata field
- `limit`: Results limit (default: 20)
- `offset`: Pagination offset

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Clean Architecture",
        "collectionId": "uuid",
        "collectionName": "Library",
        "metadata": { ... },
        "relevanceScore": 0.95
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Notifications API

### GET /notifications

Retrieve user's notifications.

**Query Parameters**:

- `status`: Filter by status (pending, delivered, failed)
- `type`: Filter by notification type
- `limit`: Results limit (default: 50)

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "expiration",
        "message": "Your tomatoes expire in 3 days",
        "itemId": "uuid",
        "itemName": "Roma Tomatoes",
        "scheduledFor": "2025-09-12T09:00:00Z",
        "status": "pending",
        "metadata": {
          "expirationDate": "2025-09-15T00:00:00Z",
          "daysUntilExpiration": 3
        }
      }
    ]
  }
}
```

### PUT /notifications/:id/mark-read

Mark notification as read.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "notification": { ... }
  }
}
```

### DELETE /notifications/:id

Dismiss/delete a notification.

**Response**: 204 No Content

**Errors**:

- 404: Notification not found
- 401: Authentication required

## Notification Settings API

### GET /notifications/settings

Get user's notification preferences and settings.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "settings": {
      "emailNotifications": true,
      "inAppNotifications": true,
      "notificationTypes": {
        "expiration": {
          "enabled": true,
          "advanceWarningDays": 3,
          "channels": ["email", "in-app"]
        },
        "maintenance": {
          "enabled": true,
          "advanceWarningDays": 7,
          "channels": ["in-app"]
        }
      },
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "UTC"
      }
    }
  }
}
```

### PUT /notifications/settings

Update user's notification preferences.

**Request**:

```json
{
  "emailNotifications": false,
  "notificationTypes": {
    "expiration": {
      "enabled": true,
      "advanceWarningDays": 5,
      "channels": ["in-app"]
    }
  }
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "settings": { ... }
  }
}
```

### POST /notifications/settings/test

Send a test notification to verify settings.

**Request**:

```json
{
  "type": "expiration",
  "channel": "email"
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "testSent": true,
    "channel": "email",
    "timestamp": "2025-09-09T10:30:00Z"
  }
}
```

## Error Codes

- `COLLECTION_NOT_FOUND`: Collection does not exist or access denied
- `ITEM_NOT_FOUND`: Item does not exist or access denied
- `NOTIFICATION_NOT_FOUND`: Notification does not exist or access denied
- `SCHEMA_FIELD_NOT_FOUND`: Metadata schema field does not exist
- `ITEM_METADATA_FIELD_NOT_FOUND`: Item metadata field does not exist
- `INVALID_METADATA_SCHEMA`: Metadata schema validation failed
- `METADATA_VALIDATION_FAILED`: Item metadata doesn't conform to schema
- `SCHEMA_INCOMPATIBLE_CHANGE`: Schema change incompatible with existing items
- `REQUIRED_FIELD_HAS_DATA`: Cannot remove required field that contains data
- `CANNOT_REQUIRE_FIELD_WITH_NULLS`: Cannot make field required when existing items have null values
- `CANNOT_REMOVE_REQUIRED_METADATA`: Cannot remove required metadata field from item
- `COLLECTION_NOT_EMPTY`: Cannot delete collection containing items
- `DUPLICATE_COLLECTION_NAME`: Collection name already exists for user
- `DUPLICATE_FIELD_NAME`: Schema field name already exists
- `INVALID_NOTIFICATION_SETTINGS`: Notification settings validation failed
- `AUTHENTICATION_REQUIRED`: Valid authentication token required
- `INSUFFICIENT_PERMISSIONS`: User lacks permission for requested operation

## User Profile API

### GET /profile

Get user profile information and preferences.

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "preferences": {
        "defaultCollectionView": "grid",
        "itemsPerPage": 50,
        "timezone": "UTC",
        "language": "en"
      },
      "stats": {
        "totalCollections": 5,
        "totalItems": 127,
        "accountCreated": "2025-01-15T10:00:00Z"
      }
    }
  }
}
```

### PUT /profile

Update user profile and preferences.

**Request**:

```json
{
  "name": "John Smith",
  "preferences": {
    "defaultCollectionView": "list",
    "itemsPerPage": 25,
    "timezone": "America/New_York"
  }
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

## Rate Limiting

- 100 requests per minute per user for read operations
- 20 requests per minute per user for write operations
- 429 status code returned when limits exceeded

## Validation Rules

### Collection Names

- 1-100 characters
- Alphanumeric, spaces, hyphens, underscores allowed
- Must be unique per user

### Item Names

- 1-200 characters
- Any printable characters allowed

### Metadata Field Names

- 1-50 characters
- Alphanumeric and underscores only
- Must start with letter

### Metadata Values

- Text: 0-1000 characters
- Number: Valid JavaScript number
- Date: ISO 8601 format
- Boolean: true/false
