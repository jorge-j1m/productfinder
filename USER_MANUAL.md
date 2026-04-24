# ProductFinder — User Manual

This manual is for store professionals who use ProductFinder day-to-day: store staff, managers, and system administrators. It covers the Admin Panel (where you manage the business) and gives a short tour of the Customer Storefront (what shoppers see).

If you are a software engineer working on the codebase, read `README.md` instead.

---

## 1. Overview

ProductFinder is a two-sided system:

- **Customer Storefront** (`http://localhost:3001` in development) — a public website where shoppers search products, compare prices across nearby stores, and see what's on sale. No account is needed.
- **Admin Panel** (`http://localhost:3000`) — an employee-only dashboard for managing store brands, store locations, the product catalog, inventory, pricing, sales, and employee accounts.

Both surfaces read from and write to the same database, so anything you update in the Admin Panel appears on the Customer Storefront on the next page load.

---

## 2. Signing in

1. Open the Admin Panel at `http://localhost:3000`. If you are not signed in you will be redirected to `/login`.
2. Enter the email and password given to you by an administrator.
3. Click **Sign In**. On success you will land on `/dashboard`.

If you forget your password, click **Forgot password?** on the login screen and contact an administrator. An administrator can trigger a password-reset email for any employee from the Employees page (see section 9.5).

Sessions are persisted in a secure cookie. Closing and re-opening the browser keeps you signed in until the session expires. Use the **Sign Out** button in the top-right of the dashboard to end a session explicitly.

---

## 3. Roles and what each role can do

Every employee has one of three roles:

| Role        | Intended user                          | What they typically do                                                  |
| ----------- | -------------------------------------- | ----------------------------------------------------------------------- |
| **STAFF**   | Store floor / register staff           | Check inventory, adjust stock, look up products by barcode.             |
| **MANAGER** | Store manager                          | Everything STAFF can do, plus manage their store's employees and sales. |
| **ADMIN**   | System administrator / head of catalog | Full access: brands, stores, the product catalog, and all other stores. |

The left-hand sidebar in the Admin Panel filters itself based on your role, so you only see the sections you are permitted to use. The exact permission matrix is:

| Section      | STAFF | MANAGER | ADMIN |
| ------------ | :---: | :-----: | :---: |
| Dashboard    |  Yes  |   Yes   |  Yes  |
| Inventory    |  Yes  |   Yes   |  Yes  |
| Products     |   —   |    —    |  Yes  |
| Employees    |   —   |   Yes   |  Yes  |
| Stores       |   —   |    —    |  Yes  |
| Store Brands |   —   |    —    |  Yes  |

An account can also be in one of two statuses: **ACTIVE** or **SUSPENDED**. Suspended accounts cannot sign in; API requests with a suspended session are rejected with a "forbidden" error.

---

## 4. The Admin Panel at a glance

Every page in the Admin Panel shares the same layout:

- **Left sidebar** — navigation, grouped into Main, Management, Inventory, and (for admins) System. Click the toggle at the top of the sidebar to collapse or expand it; the choice is remembered across sessions.
- **Top bar** — your name, role badge, and a **Sign Out** button.
- **Main area** — the current page.

Most management pages share the same pattern:

- A **title and subtitle** at the top describing the page.
- A **filter bar** to narrow results by name, role, status, store, stock type, etc.
- A **data table** with sortable columns, pagination controls, and per-row action menus.
- Action buttons in the header to **Create** new records.
- A **Scan Barcode** button (on Products and Inventory) that opens your camera for quick lookup.

Clicking **Create** or editing a row opens a dialog. Dialogs validate your input, show inline error messages on invalid fields, and display server errors (e.g. "Employee with this email already exists") at the bottom of the form. You can cancel a dialog at any time without saving.

Changes made anywhere in the panel update the underlying data table immediately on success; you will see a brief toast notification in the bottom-right to confirm the change.

---

## 5. Dashboard

`Dashboard` is your landing page after signing in. It shows your session details: user ID, email, full name, role, assigned store ID, and session ID. Use it to confirm which account you are signed in under, particularly when troubleshooting.

---

## 6. Store Brands (ADMIN only)

A **store brand** is a chain (e.g. Publix, Walmart, Whole Foods). Each individual store location belongs to exactly one brand.

Path: `Management` → `Store Brands`

**To add a brand:**

1. Click **Create New**.
2. Enter a unique **Name** and a **Logo URL** (public image URL; placeholder services like `https://placehold.co/...` work fine for testing).
3. Click **Save**.

**To edit a brand:** open the row's action menu and choose **Edit**. Change the name or logo and save.

**To delete a brand:** choose **Delete** and confirm. Note that a brand with stores attached cannot be deleted until its stores are moved or deleted first.

Names must be unique across the system — the panel will show a conflict error if you try to reuse a name.

---

## 7. Stores (ADMIN only)

A **store** is a physical location. Every store belongs to exactly one brand and must have a full postal address plus latitude/longitude so that shoppers can find it on the storefront.

Path: `Management` → `Stores`

**To add a store:**

1. Click **Create New**.
2. Fill in:
   - **Brand** — pick from the dropdown of existing brands.
   - **Name** — the specific location name (e.g. "Publix #1234 — South Beach").
   - **Address, City, State, ZIP, Country Code** — a full, valid address.
   - **Latitude and Longitude** — the store's coordinates. Use Google Maps to find them if needed: latitude is between -90 and 90, longitude is between -180 and 180. Accurate coordinates are essential for the storefront's "nearby stores" and distance features to work.
3. Click **Save**.

**To edit a store:** use the row's action menu to change any field except the brand (brand is fixed at creation time to preserve referential integrity).

**To delete a store:** deletion cascades — employees assigned to the store and the store's inventory rows will also be removed. Confirm carefully.

The system rejects two stores with the same address + ZIP combination.

---

## 8. Products (ADMIN only)

A **product** is an item that can be sold in any store. Products are defined once, system-wide, and then stocked at individual stores through inventory records.

Path: `Inventory` → `Products`

**To add a product:**

1. Click **Create New** (or click **Scan Barcode** to see if the product is already in the system).
2. Fill in:
   - **Name** (required, unique, up to 255 characters).
   - **SKU** (required, unique, up to 100 characters — your internal stock-keeping identifier).
   - **Barcode** (optional, unique) — the UPC/EAN number printed on packaging.
   - **Stock Type** — **UNITS** for items sold per piece (a box of cereal, a can of soup) or **WEIGHT** for items sold by weight (loose produce, bulk meat). Pick carefully: this controls how quantity and price are interpreted later.
   - **Description** (optional, up to 1000 characters).
   - **Image URL** (optional, up to 500 characters).
3. Click **Save**.

**Stock Type matters.** For WEIGHT products, inventory quantities are measured in grams and prices are in cents per gram (displayed as `$X.XX/kg` on the storefront). For UNITS products, quantities are whole units and prices are cents per unit. You cannot change a product's stock type after creation without a data migration.

**To find a product by barcode:** click **Scan Barcode** in the page header, point your device camera at the barcode, and the system will highlight the matching product row (or tell you no product matches).

**To edit a product:** use the row's action menu. All fields except the product's ID can be changed.

**To delete a product:** deletion cascades through inventory, removing the product from every store that carries it. Confirm carefully.

Duplicate names, SKUs, or barcodes are rejected with a specific conflict message.

---

## 9. Inventory (all roles)

**Inventory** links a product to a store, with a stock quantity and a price. One inventory record per (store, product) pair — trying to create a second one for the same pair returns a conflict error.

Path: `Inventory` → `Inventory`

### 9.1 Understanding the columns

- **Store** — the physical location.
- **Product** — the catalog item.
- **Stock Type** — inherited from the product (WEIGHT or UNITS).
- **Quantity** — current stock. Grams for WEIGHT, units for UNITS.
- **Regular Price** — displayed price when no sale is active. Always in cents (e.g. `599` = $5.99). For WEIGHT products, this is cents per gram.
- **Sale Price / Sale Window** — an optional discounted price with start and end dates. The storefront uses this automatically when the current date is within the window.

### 9.2 Filtering and searching

Use the filter bar to narrow by store, product, or sort the list by quantity, regular price, or sale price. **Scan Barcode** will prefill the product filter when it finds a match.

### 9.3 Creating an inventory record

1. Click **Create New**.
2. Select a **Store** and a **Product** from the dropdowns.
3. Enter **Quantity** (integer, not negative), **Regular Price** (integer cents, positive), and optionally **Sale Price** with **Sale Start / End** dates.
4. Click **Save**.

The system rejects sale prices that are greater than or equal to the regular price.

### 9.4 Adjusting stock (add or remove)

For quick in-and-out changes (e.g. a delivery arrives or a register sale happens), use **Adjust Stock** from the row's action menu instead of editing the full record:

1. Pick **Add Stock** or **Remove Stock**.
2. Enter the amount in the unit shown (grams for WEIGHT products, units for UNITS products).
3. The dialog previews the resulting quantity before you confirm.
4. Click **Adjust Stock**.

The adjustment is an atomic database operation, so concurrent updates from different registers cannot accidentally create a negative quantity. Attempting to remove more than the current stock is rejected.

### 9.5 Managing sales

Use **Manage Sale** from the row's action menu to set or clear a sale:

- **Set Sale** — enter a sale price (must be less than the regular price) and optionally a start and end date. Leaving both dates blank makes the sale active immediately and indefinitely.
- **Clear Sale** — removes the sale price and dates, reverting the store to the regular price.

Sale changes take effect on the storefront immediately on the next customer page load.

### 9.6 Deleting an inventory record

Deleting removes the item from the store's shelf in the storefront. The product itself remains in the catalog for other stores to use.

---

## 10. Employees (ADMIN and MANAGER)

Path: `Management` → `Employees`

The Employees page lists every account in the system with name, email, role, status, and assigned store. Use the filters to search by name, email, role, or status.

### 10.1 Creating an employee

1. Click **Create New**.
2. Fill in:
   - **First name**, **Last name**, **Name** (full display name).
   - **Email** — unique across the system; the employee will sign in with this.
   - **Password** — initial password (can be reset later).
   - **Role** — STAFF, MANAGER, or ADMIN. Only an ADMIN should create other ADMINs.
   - **Store** — which store this employee belongs to. Every employee must be attached to a store, even ADMINs.
   - **Status** — ACTIVE by default.
3. Click **Save**.

The new employee can sign in immediately with the email and password you provided.

### 10.2 Editing an employee

From the row's action menu choose **Edit**. You can change name, role, status, and assigned store. Email and password are not editable here — use the password-reset flow (below) for passwords, and ask the employee to update their own email through a password-authenticated flow if needed.

### 10.3 Suspending or reactivating an employee

To temporarily block an employee from using the system, edit their record and change **Status** from `ACTIVE` to `SUSPENDED`. A suspended employee's existing sessions are rejected on the next API call, so the change takes effect within seconds. Flipping back to `ACTIVE` restores access.

Prefer suspension over deletion when an employee is on leave or has resigned but their account's audit trail may still be useful.

### 10.4 Deleting an employee

Deletion is permanent and cascades through sessions and auth records. Use it only when you are certain the account is no longer needed.

### 10.5 Sending a password reset

From the **Edit Employee** dialog, click **Send Password Reset**. The system sends a reset email (through better-auth) to the employee's address with a link that lets them choose a new password. Use this when an employee forgets their password or you want to force them to choose a fresh one.

---

## 11. Barcode scanning

Two pages have a **Scan Barcode** button: **Products** (to find an existing product) and **Inventory** (to filter inventory to a specific product quickly).

1. Click **Scan Barcode**. The browser will ask for camera permission the first time — click **Allow**.
2. Point the rear camera at the barcode and hold steady until it reads. The viewfinder is optimized for 1D retail barcodes.
3. If a matching product exists, you will see a confirmation toast with the product name and the table will update. If nothing matches, you will see a "no product found" message — use the Products page to add it.

If you get a "camera permission denied" error, re-enable camera permission for the site in your browser settings and retry. If no camera is detected, try a different browser or device.

---

## 12. The Customer Storefront

Shoppers use the public site at `http://localhost:3001`. They do not need an account. The main capabilities are:

**Home page.** A search box where shoppers type a product name. A set of pills filters by stock type (All / By Weight / By Unit).

**Search results.** A paginated list of products matching the search term. Each product links to its price comparison page. Shoppers can sort (A-Z, Z-A) and filter by stock type.

**Product price comparison.** This is the key shopper feature. For a selected product, the storefront shows every store that carries it, ordered by effective price (lowest first) or by distance from the shopper. Each row displays:

- The store's brand and location name.
- Address and city.
- Distance from the shopper (when location access is granted).
- Regular price, and — if a sale is active — the sale price, with the "ON SALE" badge and the sale end date.
- Current stock status (in-stock with the remaining quantity, or "OUT OF STOCK").

Shoppers can filter by distance radius, by store brand, and can toggle an "in stock only" checkbox. They can switch between miles and kilometers at any time; the choice is remembered in their browser.

The very first request will ask for the shopper's location; granting it enables distance-based ranking and the radius filter. Denying it still lets them browse everything — only the distance features are disabled.

**Store detail page.** Shows everything a specific store stocks, with per-product pricing, sale badges, stock status, and filters for "In stock only" and "On sale only."

**Dark mode.** A sun/moon toggle in the top-right of every page switches between light and dark themes. The choice is system-matched by default.

**What employees can do to improve the shopper experience:**

- Keep inventory quantities up to date so the "in stock / out of stock" indicator is accurate.
- Enter correct latitude/longitude for each store so distance filtering works.
- Add clear product names, SKUs, and high-quality image URLs — these appear on the storefront exactly as entered.
- Use sale prices with realistic start and end dates so shoppers see time-sensitive deals.

---

## 13. Common workflows

**Onboarding a new store chain (ADMIN):**

1. Create the brand on the Store Brands page.
2. Create each physical location on the Stores page, attaching them to the new brand and filling in accurate coordinates.
3. Create manager and staff accounts on the Employees page, assigning them to the correct store.

**Onboarding a new product into a specific store (ADMIN + MANAGER/STAFF):**

1. An ADMIN adds the product to the catalog on the Products page (once, system-wide).
2. A manager or staff member goes to the Inventory page, clicks **Create New**, picks the store and the new product, and enters the initial quantity and regular price.

**Running a weekend sale at one store:**

1. On the Inventory page, find the rows you want to discount.
2. For each row, open the action menu and choose **Manage Sale** → **Set Sale**.
3. Enter the sale price and set the start date to Friday morning and the end date to Sunday night.
4. Click **Save Sale**. The storefront shows the "ON SALE" badge automatically once the start date arrives.

**Taking a register sale out of stock (STAFF):**

1. On the Inventory page, filter to the store you are working in.
2. Open the row for the product just sold and choose **Adjust Stock** → **Remove Stock**.
3. Enter the amount sold (units for discrete items, grams for weight items) and confirm.

**Receiving a delivery (STAFF):**

1. Filter the Inventory page to your store.
2. Find each delivered product and use **Adjust Stock** → **Add Stock** with the delivered amount.
3. If a product is new to the store, instead click **Create New** and enter the full inventory record.

**Password reset for an employee who is locked out:**

1. An ADMIN or MANAGER opens the Employees page and edits the affected employee.
2. Click **Send Password Reset**.
3. The employee receives an email with a reset link and chooses a new password.

---

## 14. Troubleshooting

- **"Session expired" or redirected to login while working.** Your session has ended. Sign in again.
- **"Forbidden" errors on every action.** Your account status is SUSPENDED. Contact an administrator.
- **"Employee with this email already exists."** Each email must be unique. Search for the existing employee instead of creating a new one.
- **"Sale price must be less than regular price."** Sale prices are a discount — they cannot meet or exceed the regular price. Lower the sale price or raise the regular price first.
- **"Operation would result in negative stock quantity."** You tried to remove more stock than is on hand. Check the current quantity and retry with a smaller amount.
- **Store's distance shows "—" on the storefront.** That store has missing or invalid coordinates. An ADMIN should open the store record and set accurate latitude and longitude.
- **Barcode scanner shows a black screen.** Grant the browser camera permission for the site, or try a different browser or device.

---

## 15. Where data lives

For transparency, here is what the system stores about each domain:

- **Store brand** — unique name, logo URL.
- **Store** — brand, name, full address, country code, latitude, longitude.
- **Product** — unique name, unique SKU, optional unique barcode, stock type (WEIGHT or UNITS), optional description, optional image URL.
- **Inventory** — (store, product) pair, integer quantity, integer regular price in cents, optional integer sale price in cents, optional sale start and end timestamps.
- **Employee** — email (unique), hashed password, first and last name, role, status, assigned store, timestamps. Passwords are never stored in plaintext.

All IDs are stable, prefixed identifiers (e.g. `store_01h...`, `prod_01h...`) that are safe to copy and share within the organization. The full business-rule reference for each domain lives in `apps/server/BUSINESS_LOGIC_RULES.md`.
