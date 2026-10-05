// Drizzle wraps a driver failure as "Failed query: <sql> params: <values>" and
// keeps the driver's own error as the cause, so the constraint text a slug
// collision is recognised by is never in the outermost message.
export function errorMessages(error: unknown) {
	const messages: string[] = [];
	let current: unknown = error;
	while (current instanceof Error && messages.length < 5) {
		messages.push(current.message);
		current = (current as { cause?: unknown }).cause;
	}
	return messages;
}

// SECURITY: the wrapper message repeats the statement and every bound
// parameter, which can include buyer details. Report the driver's message instead.
export function driverErrorMessage(error: unknown, fallback: string) {
	return errorMessages(error).find((message) => !message.startsWith("Failed query:")) ?? fallback;
}
