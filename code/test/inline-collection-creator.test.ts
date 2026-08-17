import { beforeEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { attachInlineCollectionCreator } from "../src/lib/inline-collection-creator";

// The markup the component renders around the control, reduced to the parts the
// script reaches for. The artwork fields are here so a test can prove they
// survive.
const markup = (collections: string) => `
<form data-admin-artwork-form data-action="/api/admin/artworks/camelia">
	<input name="title" value="Camelia" />
	<fieldset>
		<div class="collection-list" data-collection-list>${collections}</div>
		<div class="new-collection">
			<label for="new-collection-name">New collection</label>
			<input id="new-collection-name" type="text" data-new-collection-name />
			<button type="button" data-new-collection-add>+ New</button>
			<p id="new-collection-status" role="status" aria-live="polite" data-new-collection-status></p>
		</div>
	</fieldset>
</form>`;

const populated = '<label><input type="checkbox" name="collectionIds" value="3" /> Botánica</label>';
const empty = '<p class="hint" data-collection-empty>No collections yet.</p>';

let window: Window;
let form: HTMLFormElement;
let calls: { url: string; body: Record<string, unknown> }[];

const created = (id: number, name: string) => new Response(
	// The endpoint answers with a redirect target for the collection form.
	// Following it here would discard the artwork's unsaved edits.
	JSON.stringify({ collection: { id, name }, redirect: `/admin/collections/${name}` }),
	{ status: 201, headers: { "content-type": "application/json" } },
);

const conflict = () => new Response(
	JSON.stringify({ error: "Slug already exists" }),
	{ status: 409, headers: { "content-type": "application/json" } },
);

function mount(collections: string, respond: () => Response | Promise<Response>) {
	window = new Window({ url: "https://admin.test/admin/artworks/camelia" });
	window.document.body.innerHTML = markup(collections);
	form = window.document.querySelector("[data-admin-artwork-form]") as unknown as HTMLFormElement;
	calls = [];
	attachInlineCollectionCreator(form, {
		fetchImpl: (async (url: string, init: RequestInit) => {
			calls.push({ url: String(url), body: JSON.parse(String(init.body)) });
			return respond();
		}) as unknown as typeof fetch,
	});
	return {
		field: form.querySelector("[data-new-collection-name]") as HTMLInputElement,
		button: form.querySelector("[data-new-collection-add]") as HTMLElement,
		status: form.querySelector("[data-new-collection-status]") as HTMLElement,
		list: form.querySelector("[data-collection-list]") as HTMLElement,
	};
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const pressEnter = (field: HTMLInputElement) => {
	const event = new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
	field.dispatchEvent(event as unknown as Event);
	return event;
};

describe("inline collection creator", () => {
	beforeEach(() => {
		calls = [];
	});

	test("appends the new collection ticked, in the shape the artwork form submits", async () => {
		const { field, button, status, list } = mount(populated, () => created(7, "Winter Studies"));
		const before = window.location.href;
		field.value = "Winter Studies";
		button.click();
		await settle();

		expect(calls).toEqual([{ url: "/api/admin/collections", body: { name: "Winter Studies", published: false, artworkIds: [] } }]);
		const boxes = [...list.querySelectorAll("input[name='collectionIds']")] as HTMLInputElement[];
		expect(boxes.map((box) => [box.value, box.checked])).toEqual([["3", false], ["7", true]]);
		expect(list.textContent).toContain("Winter Studies");
		expect(status.textContent).toContain("added and ticked");
		expect(status.classList.contains("is-error")).toBe(false);
		expect(field.value).toBe("");
		expect(window.document.activeElement).toBe(boxes[1] as unknown as Element);
		// The response carried a redirect. Nothing followed it, and the artwork's
		// own edits are untouched.
		expect(window.location.href).toBe(before);
		expect((form.elements as unknown as Record<string, HTMLInputElement>).title.value).toBe("Camelia");
	});

	test("the new collection is not created with the artwork already attached", async () => {
		const { field, button } = mount(populated, () => created(7, "Winter Studies"));
		field.value = "Winter Studies";
		button.click();
		await settle();
		// updateArtworkAdmin replaces membership wholesale from the submitted
		// collectionIds, so it must stay the only writer of membership.
		expect(calls[0].body.artworkIds).toEqual([]);
	});

	test("replaces the empty state rather than rendering beside it", async () => {
		const { field, button, list } = mount(empty, () => created(1, "First Group"));
		field.value = "First Group";
		button.click();
		await settle();

		expect(list.querySelector("[data-collection-empty]")).toBeNull();
		expect(list.querySelectorAll("input[name='collectionIds']")).toHaveLength(1);
	});

	test("Enter creates the collection and does not submit the artwork", async () => {
		const { field, list } = mount(populated, () => created(7, "Winter Studies"));
		field.value = "Winter Studies";
		const event = pressEnter(field);
		await settle();

		// preventDefault is what stops the browser's implicit form submission.
		expect(event.defaultPrevented).toBe(true);
		expect(calls).toHaveLength(1);
		expect(list.querySelectorAll("input[name='collectionIds']")).toHaveLength(2);
	});

	test("a second Enter while the first is in flight sends nothing", async () => {
		let release: (value: Response) => void = () => {};
		const pending = new Promise<Response>((resolve) => { release = resolve; });
		const { field, button, list, status } = mount(populated, () => pending);
		field.value = "Winter Studies";

		pressEnter(field);
		await settle();
		pressEnter(field);
		pressEnter(field);
		button.click();
		await settle();
		expect(calls).toHaveLength(1);
		// The guard is the in-flight flag, not the disabled property, which would
		// have taken the button out of the focus order.
		expect(button.getAttribute("aria-disabled")).toBe("true");
		expect((button as HTMLButtonElement).disabled).toBe(false);

		release(created(7, "Winter Studies"));
		await settle();
		expect(status.textContent).toContain("added and ticked");
		expect(list.querySelectorAll("input[name='collectionIds']")).toHaveLength(2);
		expect(button.getAttribute("aria-disabled")).toBe("false");
	});

	test("a duplicate name reports in the caller's own vocabulary and keeps the typed name", async () => {
		const { field, button, status, list } = mount(populated, conflict);
		field.value = "Winter Studies";
		button.click();
		await settle();

		// The control never shows a slug, so the server's slug wording would name
		// a field this editor cannot see.
		expect(status.textContent).toBe("A collection with that name already exists.");
		expect(status.classList.contains("is-error")).toBe(true);
		expect(field.value).toBe("Winter Studies");
		expect(window.document.activeElement).toBe(field as unknown as Element);
		expect(list.querySelectorAll("input[name='collectionIds']")).toHaveLength(1);
		expect((form.elements as unknown as Record<string, HTMLInputElement>).title.value).toBe("Camelia");
	});

	test("a validation failure reports the server's message", async () => {
		const { field, button, status } = mount(populated, () => new Response(
			JSON.stringify({ error: "Name must contain letters or numbers" }),
			{ status: 400, headers: { "content-type": "application/json" } },
		));
		field.value = "!!!";
		button.click();
		await settle();

		expect(status.textContent).toBe("Name must contain letters or numbers");
		expect(status.classList.contains("is-error")).toBe(true);
	});

	test("an empty name is refused without a request", async () => {
		const { field, button, status } = mount(populated, () => created(7, "Winter Studies"));
		field.value = "   ";
		button.click();
		await settle();

		expect(calls).toHaveLength(0);
		expect(status.textContent).toBe("Type a collection name first.");
		expect(window.document.activeElement).toBe(field as unknown as Element);
	});
});
