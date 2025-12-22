import { os } from "@orpc/server";
import { z } from "zod";
import {
  employeeSchema,
  newEmployeeSchema,
  DB,
  employees,
  isEmployeeId,
  asEmployeeId,
  storeSchema,
  asStoreId,
} from "@repo/database";
import { eq, ilike, count, and } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "Internal server error",
  },
  NOT_FOUND: {
    status: 404,
    message: "Employee not found",
  },
  STORE_NOT_FOUND: {
    status: 404,
    message: "Store not found",
  },
  VALIDATION_ERROR: {
    status: 400,
    message: "Validation error",
  },
  CONFLICT: {
    status: 409,
    message: "Employee with this email already exists",
  },
});

const pathBase = "/employees";

// Sorting schemas
const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");
const sortFieldSchema = z.enum(["name", "id", "email", "role"]).default("name");

// Employee with store relation schema
const employeeWithStoreSchema = employeeSchema.extend({
  store: storeSchema,
});

// Paginated response schema
const paginatedEmployeesSchema = z.object({
  data: z.array(employeeWithStoreSchema),
  pagination: z.object({
    page: z.number().positive(),
    pageSize: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
});

// Combined input schema for getAll with field-based filtering
const getAllEmployeesInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.enum(["STAFF", "MANAGER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  storeId: z.string().optional(),
  sortBy: sortFieldSchema,
  sortOrder: sortOrderSchema,
});

export const employeesProcedures = {
  getAll: osdb
    .route({ method: "GET", path: pathBase, summary: "Get All Employees" })
    .input(getAllEmployeesInputSchema)
    .output(paginatedEmployeesSchema)
    .handler(async ({ input, context }) => {
      const { page, pageSize, name, email, role, status, storeId, sortBy, sortOrder } = input;
      const offset = (page - 1) * pageSize;

      // Build where clause for field-based filtering
      const whereConditions = [];

      if (name) {
        whereConditions.push(ilike(employees.name, `%${name}%`));
      }
      if (email) {
        whereConditions.push(ilike(employees.email, `%${email}%`));
      }
      if (role) {
        whereConditions.push(eq(employees.role, role));
      }
      if (status) {
        whereConditions.push(eq(employees.status, status));
      }
      if (storeId) {
        whereConditions.push(eq(employees.storeId, asStoreId(storeId)));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const countResult = await context.db
        .select({ value: count() })
        .from(employees)
        .where(whereClause);

      const total = countResult[0]?.value ?? 0;

      // Get paginated data with store relation
      const employeesData = await context.db.query.employees.findMany({
        where: (fields, operators) => {
          const conditions = [];

          if (name) {
            conditions.push(operators.ilike(fields.name, `%${name}%`));
          }
          if (email) {
            conditions.push(operators.ilike(fields.email, `%${email}%`));
          }
          if (role) {
            conditions.push(operators.eq(fields.role, role));
          }
          if (status) {
            conditions.push(operators.eq(fields.status, status));
          }
          if (storeId) {
            conditions.push(operators.eq(fields.storeId, asStoreId(storeId)));
          }

          return conditions.length > 0
            ? operators.and(...conditions)
            : undefined;
        },
        with: {
          store: true,
        },
        orderBy: (fields, operators) => {
          if (sortBy === "name") {
            return sortOrder === "asc"
              ? operators.asc(fields.name)
              : operators.desc(fields.name);
          } else if (sortBy === "email") {
            return sortOrder === "asc"
              ? operators.asc(fields.email)
              : operators.desc(fields.email);
          } else if (sortBy === "role") {
            return sortOrder === "asc"
              ? operators.asc(fields.role)
              : operators.desc(fields.role);
          } else {
            return sortOrder === "asc"
              ? operators.asc(fields.id)
              : operators.desc(fields.id);
          }
        },
        limit: pageSize,
        offset: offset,
      });

      return {
        data: employeesData,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  get: osdb
    .route({
      method: "GET",
      path: `${pathBase}/{id}`,
      summary: "Get Employee by ID",
    })
    .input(
      z.object({
        id: z.string().refine(isEmployeeId, { message: "Invalid EmployeeId format" }),
      }),
    )
    .output(employeeWithStoreSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asEmployeeId(input.id);

      const employee = await context.db.query.employees.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
        with: {
          store: true,
        },
      });

      if (!employee) {
        throw errors.NOT_FOUND();
      }

      return employee;
    }),

  create: osdb
    .route({
      method: "POST",
      path: pathBase,
      summary: "Create Employee",
      successStatus: 201,
    })
    .input(newEmployeeSchema.omit({ id: true }))
    .output(employeeWithStoreSchema)
    .handler(async ({ input, context, errors }) => {
      // Validate that storeId exists
      const storeExists = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, input.storeId),
      });

      if (!storeExists) {
        throw errors.STORE_NOT_FOUND();
      }

      // Check for duplicate email
      const existing = await context.db.query.employees.findFirst({
        where: (fields, { eq }) => eq(fields.email, input.email),
      });

      if (existing) {
        throw errors.CONFLICT();
      }

      const [employee] = await context.db
        .insert(employees)
        .values(input)
        .returning();

      if (!employee) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      // Fetch the created employee with store relation
      const employeeWithStore = await context.db.query.employees.findFirst({
        where: (fields, { eq }) => eq(fields.id, employee.id),
        with: {
          store: true,
        },
      });

      if (!employeeWithStore) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return employeeWithStore;
    }),

  update: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/{id}`,
      summary: "Update Employee",
    })
    .input(
      z.object({
        id: z.string().refine(isEmployeeId, { message: "Invalid EmployeeId format" }),
        data: newEmployeeSchema
          .omit({ id: true, email: true, storeId: true })
          .partial(),
      }),
    )
    .output(employeeWithStoreSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asEmployeeId(input.id);

      // Check if employee exists
      const existing = await context.db.query.employees.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      const [updated] = await context.db
        .update(employees)
        .set(input.data)
        .where(eq(employees.id, id))
        .returning();

      if (!updated) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      // Fetch the updated employee with store relation
      const employeeWithStore = await context.db.query.employees.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
        with: {
          store: true,
        },
      });

      if (!employeeWithStore) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return employeeWithStore;
    }),

  delete: osdb
    .route({
      method: "DELETE",
      path: `${pathBase}/{id}`,
      summary: "Delete Employee",
    })
    .input(
      z.object({
        id: z.string().refine(isEmployeeId, { message: "Invalid EmployeeId format" }),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        id: z.string().refine(isEmployeeId, { message: "Invalid EmployeeId format" }),
      }),
    )
    .handler(async ({ input, context, errors }) => {
      const id = asEmployeeId(input.id);

      // Check if employee exists
      const existing = await context.db.query.employees.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      await context.db.delete(employees).where(eq(employees.id, id));

      return { success: true, id: input.id };
    }),
};
