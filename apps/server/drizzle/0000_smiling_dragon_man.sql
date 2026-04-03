CREATE TYPE "public"."employee_roles" AS ENUM('STAFF', 'MANAGER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."stock_type" AS ENUM('WEIGHT', 'UNITS');--> statement-breakpoint
CREATE TABLE "store_brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo" varchar(255) NOT NULL,
	CONSTRAINT "store_brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"state" varchar(2) NOT NULL,
	"zip" varchar(10) NOT NULL,
	"countryCode" varchar(2) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "employee_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "employee_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" "employee_roles" NOT NULL,
	"store_id" text NOT NULL,
	"status" "employee_status" NOT NULL,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(255),
	"stock_type" "stock_type" NOT NULL,
	"image" varchar(500),
	CONSTRAINT "products_name_unique" UNIQUE("name"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"regular_price" integer NOT NULL,
	"sale_price" integer,
	"sale_start_date" timestamp,
	"sale_end_date" timestamp,
	CONSTRAINT "inventory_store_product_unique" UNIQUE("store_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_brand_id_store_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."store_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_sessions" ADD CONSTRAINT "employee_sessions_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;