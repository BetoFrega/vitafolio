# Data Model: Core Life Management System

## Entity Overview

The system implements a flexible collection-based data model where Collections define metadata schemas and Items conform to those schemas.

## Core Entities

### Collection

**Purpose**: Primary organizing entity that defines metadata schemas for items

**Fields**:

- `id: CollectionId` - Unique identifier (value object)
- `name: string` - User-defined collection name (e.g., "Library", "Pantry")
- `description: string` - Optional description of the collection purpose
- `ownerId: UserId` - Reference to owning user (from existing IAM domain)
- `metadataSchema: MetadataSchema` - Defines available metadata fields for items
- `createdAt: Date` - Creation timestamp
- `updatedAt: Date` - Last modification timestamp

**Validation Rules**:

- Name must be 1-100 characters, unique per user
- Description maximum 500 characters
- MetadataSchema must contain at least one field definition
- ownerId must reference existing user

**State Transitions**:

- Created → Active
- Active → Archived (when user deactivates but preserves data)
- Archived → Active (when user reactivates)
- Active/Archived → Deleted (only when no items exist)

**Relationships**:

- Belongs to one User (1:N relationship)
- Contains zero or more Items (1:N relationship)

### Item

**Purpose**: Individual things being managed that conform to collection metadata schema

**Fields**:

- `id: ItemId` - Unique identifier (value object)
- `name: string` - User-defined item name
- `collectionId: CollectionId` - Reference to parent collection
- `ownerId: UserId` - Reference to owning user (derived from collection)
- `metadata: MetadataValues` - Key-value pairs conforming to collection schema
- `createdAt: Date` - Creation timestamp
- `updatedAt: Date` - Last modification timestamp

**Validation Rules**:

- Name must be 1-200 characters
- Must belong to existing collection
- Metadata values must conform to collection's metadata schema
- All required metadata fields must be present

**Relationships**:

- Belongs to one Collection (N:1 relationship)
- Belongs to one User through Collection (N:1 relationship)

### MetadataSchema

**Purpose**: Defines the structure and validation rules for item metadata with versioning support

**Fields**:

- `fields: Map<string, MetadataFieldDefinition>` - Field definitions
- `requiredFields: Set<string>` - Required field names
- `version: number` - Schema version (incremented on changes)
- `lastModified: Date` - When schema was last changed

**Structure**:

```typescript
interface MetadataFieldDefinition {
  name: string;
  type: "text" | "number" | "date" | "boolean";
  required: boolean;
  validation?: ValidationRules;
  description?: string;
}
```

**Validation Rules**:

- Field names must be valid identifiers (alphanumeric + underscore)
- Each field must have a valid type
- Required fields must be marked appropriately
- Schema changes must be compatible with existing items
- Version increments automatically on modifications

**Schema Evolution Rules**:

- Adding optional fields: Always allowed
- Adding required fields: Only if no existing items, or if default value provided
- Removing fields: Only if field is not required and has no data in existing items
- Changing field type: Only if compatible (e.g., text to text, number to number)
- Making field optional: Always allowed
- Making field required: Only if all existing items have non-null values

### MetadataValues

**Purpose**: Actual metadata values for an item conforming to collection schema

**Fields**:

- `values: Map<string, MetadataValue>` - Field name to value mapping

**Structure**:

```typescript
type MetadataValue = string | number | Date | boolean;
```

**Validation Rules**:

- All required fields from schema must be present
- Values must match field type definitions
- No extra fields beyond schema definition
- Values must pass field-specific validation rules

### Notification

**Purpose**: Alerts generated from actionable metadata

**Fields**:

- `id: NotificationId` - Unique identifier
- `userId: UserId` - Target user
- `itemId: ItemId` - Related item
- `type: NotificationType` - Type of notification (expiration, maintenance, etc.)
- `message: string` - Human-readable notification text
- `scheduledFor: Date` - When notification should be delivered
- `deliveredAt?: Date` - When notification was actually delivered
- `status: NotificationStatus` - pending, delivered, failed
- `metadata: object` - Additional notification-specific data

**Validation Rules**:

- Must reference existing user and item
- Scheduled date must be in the future when created
- Message must be 1-500 characters
- Status transitions: pending → delivered/failed

**Relationships**:

- Belongs to one User (N:1 relationship)
- References one Item (N:1 relationship)

## Value Objects

### CollectionId

- Immutable identifier for collections
- UUID-based with validation
- Static factory methods: `create()`, `fromString()`

### ItemId

- Immutable identifier for items
- UUID-based with validation
- Static factory methods: `create()`, `fromString()`

### NotificationId

- Immutable identifier for notifications
- UUID-based with validation
- Static factory methods: `create()`, `fromString()`

### NotificationType

- Enumeration: 'expiration', 'maintenance', 'reminder', 'custom'
- Immutable value object with validation

### NotificationStatus

- Enumeration: 'pending', 'delivered', 'failed'
- State machine validation for transitions

## Aggregates

### Collection Aggregate

**Root Entity**: Collection
**Child Entities**: None (Items are separate aggregates)
**Invariants**:

- Collection name unique per user
- Cannot delete collection with items
- Metadata schema changes must be compatible with existing items

### Item Aggregate

**Root Entity**: Item
**Child Entities**: None
**Invariants**:

- Item metadata must conform to collection schema
- Item name unique within collection
- Cannot modify item's collection after creation

### Notification Aggregate

**Root Entity**: Notification
**Child Entities**: None
**Invariants**:

- Cannot modify notification after delivery
- Scheduled time cannot be in the past

## Domain Services

### MetadataSchemaService

- Validates schema definitions and field definitions
- Checks schema compatibility for updates (evolution rules)
- Generates validation rules for metadata values
- Manages schema versioning and change tracking
- Provides schema migration strategies for incompatible changes

### SchemaEvolutionService

- Analyzes impact of schema changes on existing items
- Validates whether schema changes are safe to apply
- Suggests migration paths for breaking changes
- Handles automatic data migration for compatible changes

### NotificationService

- Processes actionable metadata to generate notifications
- Handles notification scheduling and delivery
- Manages notification state transitions

### SearchService

- Provides search and filtering capabilities across items
- Indexes metadata values for efficient queries
- Supports cross-collection searches

## Integration with Existing Domains

### IAM Domain Integration

- Collections and Items reference `UserId` from existing IAM domain
- Authentication and authorization handled by existing IAM patterns
- User ownership enforced at repository level

### Shared Domain Integration

- Uses existing `Result<T>` pattern for error handling
- Follows existing value object patterns
- Leverages shared utility types and validation helpers

## Storage Considerations

### Repository Interfaces

- `CollectionRepository`: CRUD operations for collections with user isolation
- `ItemRepository`: CRUD operations for items with collection/user isolation
- `NotificationRepository`: CRUD operations for notifications with user isolation

### Data Isolation

- All repositories enforce user-level data isolation
- Cross-user data access explicitly forbidden
- Repository methods accept user context for authorization

### Future Database Mapping

- Entities designed for relational database mapping
- Foreign key relationships clearly defined
- Indexing strategy planned for search and performance

## Example Use Cases

### Library Collection Example

```typescript
const librarySchema = new MetadataSchema({
  fields: new Map([
    ["title", { name: "title", type: "text", required: true }],
    ["author", { name: "author", type: "text", required: true }],
    ["isbn", { name: "isbn", type: "text", required: false }],
    ["rating", { name: "rating", type: "number", required: false }],
  ]),
  requiredFields: new Set(["title", "author"]),
});

const book = Item.create({
  name: "Clean Architecture",
  collectionId: libraryCollection.id,
  metadata: new MetadataValues({
    values: new Map([
      ["title", "Clean Architecture"],
      ["author", "Robert C. Martin"],
      ["isbn", "978-0134494166"],
      ["rating", 5],
    ]),
  }),
});
```

### Pantry Collection Example

```typescript
const pantrySchema = new MetadataSchema({
  fields: new Map([
    ["quantity", { name: "quantity", type: "number", required: true }],
    ["unit", { name: "unit", type: "text", required: true }],
    [
      "expirationDate",
      { name: "expirationDate", type: "date", required: false },
    ],
    ["location", { name: "location", type: "text", required: false }],
  ]),
  requiredFields: new Set(["quantity", "unit"]),
});

const tomato = Item.create({
  name: "Roma Tomatoes",
  collectionId: pantryCollection.id,
  metadata: new MetadataValues({
    values: new Map([
      ["quantity", 6],
      ["unit", "pieces"],
      ["expirationDate", new Date("2025-09-15")],
      ["location", "refrigerator"],
    ]),
  }),
});
```
