import type { APIRoute } from "astro";
import { updateOrderFulfillment } from "../../../../db/orders";
import { requireAdminMutation } from "../../../../lib/admin-guard";
import { driverErrorMessage } from "../../../../lib/driver-error";
import { isOrderId, OrderInputError, parseFulfillmentInput } from "../../../../lib/order-admin";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async ({ request, params }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	if (!isOrderId(params.id)) return Response.json({ error: "Order not found" }, { status: 404 });
	try {
		const status = parseFulfillmentInput(await request.json().catch(() => null));
		const order = await updateOrderFulfillment(env, params.id, status);
		if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
		return Response.json({ order });
	} catch (error) {
		if (error instanceof OrderInputError) return Response.json({ error: error.message }, { status: 400 });
		console.error(JSON.stringify({ message: "order fulfillment update failed", orderId: params.id, error: driverErrorMessage(error, "Unknown error") }));
		return Response.json({ error: "Order could not be updated" }, { status: 503 });
	}
};
