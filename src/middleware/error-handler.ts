import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const status_code_map: Record<number, string> = {
	400: "VALIDATION_ERROR",
	401: "UNAUTHORIZED",
	403: "FORBIDDEN",
	404: "NOT_FOUND",
	409: "CONFLICT",
	429: "TOO_MANY_REQUESTS",
	500: "INTERNAL_SERVER_ERROR"
};

export const errorHandler = (err: Error, c: Context) => {
	let status: ContentfulStatusCode = 500;
	let code = "INTERNAL_SERVER_ERROR";
	let message = "Internal Server Error";

	/* http exception errors handling */
	if (err instanceof HTTPException) {
		status = err.status;
		message = err.message;

		if (status_code_map[status]) {
			code = status_code_map[status];
		}
	}

	/* logs for dev */
	if (status >= 500 || c.env.NODE_ENV !== "production") {
		console.error("Error:", err);
	}

	return c.json({
		success: false,
		code,
		message,
		stack: c.env.NODE_ENV === "development" ? err.stack : undefined
	}, status);
};