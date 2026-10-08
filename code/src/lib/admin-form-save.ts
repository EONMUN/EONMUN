// Locks an admin form for the length of one save, so a second press cannot send
// a duplicate request and no edit can land after the payload was read. Each
// form supplies its own `save`; this owns the lock, the status line, and the
// recovery after a failure.

export type AdminFormSaveOutcome = { redirect: string } | { message: string };

export interface AdminFormSaveOptions {
	/** Optional external live region near the editor actions. */
	statusElement?: HTMLElement;
	save: (data: FormData) => Promise<AdminFormSaveOutcome>;
	/** Why the form cannot be saved yet, such as a request still running beside it. */
	blockedReason?: () => string | null;
	/** Runs after a failed save has re-enabled the form, before focus is restored. */
	onFailure?: () => void;
}

export const SLOW_SAVE_MS = 5000;

type Control = HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isControl = (element: Element): element is Control =>
	element instanceof HTMLButtonElement ||
	element instanceof HTMLInputElement ||
	element instanceof HTMLSelectElement ||
	element instanceof HTMLTextAreaElement;

export async function postAdminJson<T>(url: string, payload: unknown): Promise<T> {
	const response = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
	});
	// A proxy or Worker error page is not JSON; its status still decides.
	const result = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Save failed");
	return result as T;
}

export function attachAdminFormSave(form: HTMLFormElement, options: AdminFormSaveOptions) {
	const doc = form.ownerDocument;
	const errorBox = form.querySelector<HTMLElement>("[data-error]");
	// The status line follows the form rather than sitting inside it: assistive
	// technology may hold back live updates inside an aria-busy subtree until it
	// stops being busy, which would swallow the "Saving…" announcement.
	const status = options.statusElement ?? doc.createElement("p");
	status.className = "form-status";
	status.setAttribute("role", "status");
	status.setAttribute("aria-live", "polite");
	if (!options.statusElement) form.after(status);

	let release: ((afterEnable?: () => void) => void) | null = null;

	const lock = () => {
		const focused = doc.activeElement;
		const disabled: Control[] = [];
		const submitters: Array<[Control, string | null]> = [];
		for (const element of Array.from(form.elements)) {
			if (!isControl(element)) continue;
			if (element.type === "submit") {
				// CRITICAL: `aria-disabled`, not `disabled`. A disabled button leaves
				// the focus order and drops a keyboard user to the document body; the
				// submit handler already refuses a press while locked.
				submitters.push([element, element.getAttribute("aria-disabled")]);
				element.setAttribute("aria-disabled", "true");
			} else if (!element.disabled) {
				element.disabled = true;
				disabled.push(element);
			}
		}
		form.setAttribute("aria-busy", "true");

		// Enter in a field submits too, and that field is now disabled.
		const submitter = submitters[0]?.[0];
		const movedFocus = Boolean(submitter) && disabled.includes(focused as Control);
		if (movedFocus) submitter!.focus();

		return (afterEnable?: () => void) => {
			for (const element of disabled) element.disabled = false;
			for (const [element, prior] of submitters) {
				if (prior === null) element.removeAttribute("aria-disabled");
				else element.setAttribute("aria-disabled", prior);
			}
			form.removeAttribute("aria-busy");
			afterEnable?.();
			if (movedFocus && doc.activeElement === submitter && focused instanceof HTMLElement && focused.isConnected) focused.focus();
		};
	};

	const unlock = (afterEnable?: () => void) => {
		// Cleared first, so a throwing callback cannot leave every later submit refused.
		const restore = release;
		release = null;
		restore?.(afterEnable);
	};

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		// Locked covers both a save in flight and a saved form waiting on navigation.
		if (release) return;
		const blocked = options.blockedReason?.();
		if (blocked) {
			status.textContent = blocked;
			return;
		}
		// CRITICAL: FormData skips disabled controls, so it is read before the lock.
		const data = new FormData(form);
		if (errorBox) errorBox.hidden = true;
		status.textContent = "Saving…";
		release = lock();
		const slow = setTimeout(() => {
			status.textContent = "Still processing…";
		}, SLOW_SAVE_MS);
		try {
			const outcome = await options.save(data);
			clearTimeout(slow);
			if ("redirect" in outcome) {
				// Stays locked until the page is replaced, so the saved changes
				// cannot be edited or sent again from a page that is going away.
				status.textContent = "Saved. Opening the updated page…";
				window.location.assign(outcome.redirect);
				return;
			}
			unlock();
			status.textContent = outcome.message;
		} catch (error) {
			clearTimeout(slow);
			const message = error instanceof Error ? error.message : "Save failed";
			unlock(options.onFailure);
			if (errorBox) {
				errorBox.textContent = message;
				errorBox.hidden = false;
				status.textContent = "Not saved. See the error above.";
			} else {
				status.textContent = `Not saved. ${message}`;
			}
		}
	});

	// A page restored from the back-forward cache comes back locked mid-redirect,
	// holding content that was already saved. Unlocking it would show stale image
	// rows and let a create be sent twice, so it is fetched fresh instead.
	window.addEventListener("pageshow", (event) => {
		if (!event.persisted || !release) return;
		window.location.reload();
	});
}

/** Tracks editor changes outside named controls too, such as image metadata. */
export function attachUnsavedChanges(form: HTMLFormElement, statusElement?: HTMLElement) {
	let dirty = false;
	const status = statusElement ?? form.ownerDocument.createElement('p');
	status.className = 'form-status';
	status.dataset.unsavedStatus = '';
	status.setAttribute('role', 'status');
	if (!statusElement) form.after(status);
	const mark = () => {
		dirty = true;
		status.textContent = 'Unsaved changes';
	};
	const clear = () => {
		dirty = false;
		status.textContent = '';
	};
	const changed = (event: Event) => {
		const target = event.target as HTMLElement;
		if (target.closest('[data-suggestion]') || (target as HTMLInputElement).name === 'aiInstructions'
			|| target.hasAttribute('data-facet-search') || target.hasAttribute('data-new-collection-name')) return;
		mark();
	};
	form.addEventListener('input', changed);
	form.addEventListener('change', changed);
	for (const control of Array.from(form.elements)) {
		if (!form.contains(control)) control.addEventListener('change', changed);
	}
	window.addEventListener('beforeunload', event => {
		if (dirty) {
			event.preventDefault();
			event.returnValue = '';
		}
	});
	return { mark, clear };
}
