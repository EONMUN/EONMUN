import type { APIRoute } from "astro";

export const prerender = false;

// CRITICAL: Email-sending is intentionally not wired up yet. This endpoint
// validates and shape-checks the submission so the form on /contact works
// today, then redirects back with a success flag. Email integration
// (SMTP/Resend) is a separate PR — when it lands, replace the marked
// section below.
export const POST: APIRoute = async ({ request, redirect }) => {
	let name = "";
	let email = "";
	let message = "";

	const contentType = request.headers.get("content-type") ?? "";
	try {
		if (contentType.includes("application/json")) {
			const body = (await request.json()) as Record<string, unknown>;
			name = typeof body.name === "string" ? body.name.trim() : "";
			email = typeof body.email === "string" ? body.email.trim() : "";
			message = typeof body.message === "string" ? body.message.trim() : "";
		} else {
			const data = await request.formData();
			name = String(data.get("name") ?? "").trim();
			email = String(data.get("email") ?? "").trim();
			message = String(data.get("message") ?? "").trim();
		}
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request body" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}

	const errors: string[] = [];
	if (!name) errors.push("Name is required");
	if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
		errors.push("Valid email is required");
	if (!message) errors.push("Message is required");

	if (errors.length > 0) {
		if (contentType.includes("application/json")) {
			return new Response(JSON.stringify({ errors }), {
				status: 400,
				headers: { "content-type": "application/json" },
			});
		}
		const params = new URLSearchParams({ error: errors.join(", ") });
		return redirect(`/contact?${params.toString()}`, 303);
	}

	// TODO(email-pr): wire up SMTP or Resend here. Submission payload:
	// { name, email, message }. Drop on `CONTACT_EMAIL` env to:
	// const env = locals.runtime.env;
	// await sendEmail({ to: env.CONTACT_EMAIL, replyTo: email, subject: `Contact from ${name}`, body: message });

	if (contentType.includes("application/json")) {
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	}
	return redirect("/contact?success=true", 303);
};
