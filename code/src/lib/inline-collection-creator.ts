// Files an artwork into a brand-new collection without leaving the editor. The
// artwork's own save is the only writer of membership, so the collection is
// created empty here and its checkbox is ticked; saving the artwork attaches it.
//
// This lives in a module rather than the component's inline script so the
// behaviour can be driven by a test.

export interface InlineCollectionCreatorOptions {
	fetchImpl?: typeof fetch;
	endpoint?: string;
}

export function attachInlineCollectionCreator(
	form: HTMLFormElement,
	options: InlineCollectionCreatorOptions = {},
) {
	const list = form.querySelector<HTMLElement>("[data-collection-list]");
	const nameField = form.querySelector<HTMLInputElement>("[data-new-collection-name]");
	const button = form.querySelector<HTMLElement>("[data-new-collection-add]");
	const status = form.querySelector<HTMLElement>("[data-new-collection-status]");
	if (!list || !nameField || !button || !status) return;

	const doc = form.ownerDocument;
	const endpoint = options.endpoint ?? "/api/admin/collections";
	const request: typeof fetch = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
	let inFlight = false;

	const report = (message: string, failed: boolean) => {
		status.textContent = message;
		status.classList.toggle("is-error", failed);
	};

	// CRITICAL: `aria-disabled`, not the `disabled` property. A disabled button
	// leaves the focus order, so a keyboard user who just activated this one
	// would be dropped back to the document body until the request settles.
	const setBusy = (busy: boolean) => {
		inFlight = busy;
		button.setAttribute("aria-disabled", String(busy));
	};

	const create = async () => {
		// The click path and the Enter path both reach here, and a disabled
		// attribute would only have stopped the first. Without this a second
		// Enter sends a concurrent request whose 409 overwrites the success line.
		if (inFlight) return;
		const name = nameField.value.trim();
		if (!name) {
			report("Type a collection name first.", true);
			nameField.focus();
			return;
		}
		setBusy(true);
		report("Creating the collection.", false);
		try {
			const response = await request(endpoint, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name, published: false, artworkIds: [] }),
			});
			const result = await response.json();
			// This control asks for a name and never shows a slug, so the server's
			// slug wording would name a field the editor cannot see. Two names can
			// also collide only after slugification -- "B&W" and "B W" both derive
			// b-w -- which reads as nonsense unless the message talks about names.
			if (response.status === 409) throw new Error("A collection with that name already exists.");
			if (!response.ok) throw new Error(result.error || "Could not create the collection");
			// CRITICAL: the endpoint also answers with a redirect target, for the
			// collection form's benefit. Following it here would throw away every
			// unsaved edit on this artwork.
			list.querySelector("[data-collection-empty]")?.remove();
			const label = doc.createElement("label");
			const checkbox = doc.createElement("input");
			checkbox.type = "checkbox";
			checkbox.name = "collectionIds";
			checkbox.value = String(result.collection.id);
			checkbox.checked = true;
			label.append(checkbox, ` ${result.collection.name}`);
			list.append(label);
			nameField.value = "";
			report(`${result.collection.name} is added and ticked. Save the artwork to file it.`, false);
			checkbox.focus();
		} catch (error) {
			report(error instanceof Error ? error.message : "Could not create the collection", true);
			nameField.focus();
		} finally {
			setBusy(false);
		}
	};

	button.addEventListener("click", (event) => {
		event.preventDefault();
		void create();
	});
	nameField.addEventListener("keydown", (event) => {
		if ((event as KeyboardEvent).key !== "Enter") return;
		// The field sits inside the artwork form, so Enter would otherwise submit
		// and save the whole artwork.
		event.preventDefault();
		void create();
	});
}
