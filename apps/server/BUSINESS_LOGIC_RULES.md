# Product Finder - Business Logic Rules

This document defines the core business logic rules for the Product Finder application in clear, natural language. These rules serve as a guide for development and testing.

## Global Entity Rules

### Active Status Policy

- Only active entities are considered for any business operations, searches, or calculations
- Inactive entities are soft-deleted and preserved for audit trails
- This applies to: Users, Brands, Categories, Products, Stores, Employees, Shopping Lists

## Users

### Core User Rules

- Users are consumers of the application (customers)
- A user must have a unique email address across the entire system
- User passwords must be hashed before storing in the database
- User passwords must be at least 8 characters long
- User emails must be valid email format
- Users must provide first name and last name (both required, max 50 characters each)
- Users can optionally provide a phone number (max 20 characters)
- Only active users can create shopping lists or perform any application functions

## Products

### Core Product Rules

- A product must have a unique name within the system
- A product can have a unique barcode if one is provided (barcodes are optional, but unique)
- A product must have a unique SKU (Stock Keeping Unit) up to 100 characters (required field)
- Product availability and price is determined per store by inventory levels, not at product level
- A product has a "stock_type" field with enum values "WEIGHT" or "UNITS"
  - WEIGHT: Product is sold by weight (inventory/prices interpreted as grams/cents per gram)
  - UNITS: Product is sold by discrete units (inventory/prices interpreted as units/cents per unit)
- Product descriptions can be up to 1000 characters
- Image URLs can be up to 500 characters

## Prices

### Core Pricing Rules

- A price links an active product to an active store
- Price interpretation depends on product stock_type:
  - WEIGHT products: price represents cents per gram
  - UNITS products: price represents cents per unit
- Each product-store combination has exactly one price record
- All prices must be positive integers (greater than 0)
- Prices are stored as integers representing cents (USD only, no currency field needed)

### Price Storage Structure

- Each price record contains:
  - `regular_price`: integer (cents) - always present
  - `sale_price`: integer (cents) - optional, only when on sale
  - `sale_start_date`: datetime - optional, when sale begins
  - `sale_end_date`: datetime - optional, when sale ends

### Sale Price Logic

- Use `sale_price` for calculations if:
  - Current date >= `sale_start_date` (if start date exists)
  - Current date <= `sale_end_date` (if end date exists)
  - If no start/end dates, sale is permanent until manually ended
- When sale conditions aren't met, use `regular_price`
- Sale price must be less than regular price
- Price changes overwrite existing values (no historical data)

## Stores

### Core Store Rules

- TODO: All stores will have a brand (Publix, Sedano's), which is an enum.
- (Deprecated) Store names must be unique across the system
- Stores must have complete address information (address, city, state, zip, country)
- All address fields are required and have character limits
- Store coordinates (latitude/longitude) are required for location services
- Only active stores appear in customer searches and location services

### Store Location Rules

- Latitude must be between -90 and 90 degrees
- Longitude must be between -180 and 180 degrees
- Coordinates should be stored with 8 decimal places for precision
- Store addresses should be validated for completeness

### Store Operations

- Stores can have multiple employees assigned (stored at the employee entity)
- Each store maintains its own inventory (stored at the inventory entity) for products, and has a price for each product (stored at the price entity)

## Inventory

### Core Inventory Rules

- Each active product-active store combination can have exactly one inventory record
- Inventory quantity interpretation depends on product stock_type:
  - WEIGHT products: quantity represents grams available
  - UNITS products: quantity represents units available
- Inventory quantities are stored as integers and cannot be negative
- Stock removals cannot result in negative inventory (enforce at application level)
- Product availability per store: quantity > 0 = available, quantity = 0 = out of stock
- Stock updates should be atomic operations
- Only inventory for active products and active stores is considered valid

## Employees

### Core Employee Rules

- Employees are completely separate from regular users
- Employees must have unique email addresses within the employee system
- Employee emails can overlap with user emails (separate domains and tables)
- Employees must have unique employee IDs across the entire system
- Employee passwords must be hashed and at least 8 characters
- Employees must provide first name and last name

### Employee Roles and Permissions

- Employee roles: STAFF, MANAGER, ADMIN
- STAFF can only access their assigned store's inventory (read and write)
- MANAGER can manage their assigned store inventory, prices, add new employees to their store
- ADMIN can access all stores and system-wide functions
- Employees can be assigned to exactly one store (ADMIN can be assigned to any store or no store)
- Only active employees can log into the system
- Employee permissions are role-based, not individual
- Only ADMIN can create/modify MANAGER accounts

## Shopping Lists

### Core Shopping List Rules

- Shopping lists belong to exactly one active user
- Only active users can create, edit, or delete shopping lists
- Shopping list names are optional and limited to 100 characters
- Users can have multiple shopping lists
- Lists are editable at all times
- Deleting a list cascades deletion of all items
- Only active shopping lists are considered for operations

### Shopping List Items Rules

- List items reference:
  - `product_id`: must be an active product (required)
  - `desired_quantity`: integer interpreted based on product stock_type (required)
    - WEIGHT products: quantity in grams
    - UNITS products: quantity in units
  - `desired_store`: can be null initially, required when marking as purchased
- Items can be marked as purchased/completed or removed from the list
- Items are valid with product_id and desired_quantity; store can be added later

## General System Rules

### Data Integrity Rules

- All entities track creation and modification timestamps
- Soft delete is preferred over hard delete for audit trails
- Foreign key relationships must be maintained
- Unique constraints must be enforced at database level

### Validation Rules

- All user inputs must be validated on both client and server side
- URLs should be validated for proper format
- All calculations (except maybe distance) should be done with integers (to avoid precision loss)

### Security Rules

- All passwords must be hashed using strong algorithms (bcrypt recommended)
- API endpoints require proper authentication and authorization
- Sensitive data should never be logged

### Performance Rules

- Database queries should use appropriate indexes
- Expensive operations should be cached when possible
- Database connections should be properly pooled and managed
