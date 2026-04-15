import { os } from "@orpc/server";
import type { DB, EmployeeSession } from "@repo/database";

export type AdminBaseContext = {
  db: DB;
  requestId: string;
  session: EmployeeSession | null;
};

export const protectedProcedure = os
  .$context<AdminBaseContext>()
  .errors({
    UNAUTHORIZED: {
      status: 401,
      message: "Authentication required",
    },
    FORBIDDEN: {
      status: 403,
      message: "Forbidden",
    },
    INTERNAL_SERVER_ERROR: {
      status: 500,
      message: "Internal server error",
    },
    VALIDATION_ERROR: {
      status: 400,
      message: "Validation error",
    },
  })
  .use(({ context, next, errors }) => {
    if (!context.session) {
      throw errors.UNAUTHORIZED();
    }
    if (context.session.user.status === "SUSPENDED") {
      throw errors.FORBIDDEN({ message: "Account is suspended" });
    }

    return next({
      context: {
        session: context.session satisfies EmployeeSession,
      },
    });
  });
