# Enterprise Serialization Standard

This document outlines the standard serialization rules for all payloads passing through the Enterprise Shared Contract Layer between frontend and backend.

## 1. Identifiers
- **Format**: All primary and foreign keys must use `UUIDv4`.
- **Field Name**: Root identifier is always `id`. Relationships use `<EntityName>Id` (e.g., `userId`, `batchId`).

## 2. Dates and Times
- **Format**: ISO-8601 string in UTC timezone.
- **Example**: `2026-06-29T10:00:00.000Z`
- **Fields**: Standard timestamps must be named `createdAt`, `updatedAt`, `deletedAt`. Soft-deleted items must have a non-null `deletedAt`.

## 3. Currency and Money
- **Format**: Numeric (Decimal) represented as a `number` or `string` based on precision requirements, usually `number` for standard precision. Do not use floats for highly sensitive accounting; however, for generic payloads, JS `number` (which is a double-precision float) is acceptable provided precision logic is centralized.
- **Base**: Store and transmit in the lowest denominator (e.g., paise, cents) to avoid float rounding errors, or strictly control decimal limits. (Current implementation uses standard numbers).

## 4. Booleans
- **Format**: Strictly `true` or `false`. No `0/1` or `"true"/"false"` strings.

## 5. Nullable and Optional Fields
- **Nullable**: If a field is present but has no value, it must be `null` (not `undefined`).
- **Optional**: In request payloads, optional fields can be omitted entirely. In response payloads, omitted fields should generally default to `null` to ensure consistent object shapes.

## 6. Naming Conventions
- Request Payloads: `<Action><Entity>Request` (e.g., `CreateStudentRequest`, `UpdateBatchRequest`).
- Response Payloads: `<Entity>Response` for full object, `<Entity>SummaryResponse` for partials (e.g., `StudentResponse`).
- Casing: strictly `camelCase` for all object keys unless integrating with a legacy system that enforces `snake_case`. (Supabase uses `snake_case` in DB, but backend controllers should serialize to `camelCase` for frontend).
