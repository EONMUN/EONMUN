import { slugify } from './slug';

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export function setFacetValues(form: HTMLFormElement, name: string, values: string[]) {
	const picker = [...form.querySelectorAll<HTMLElement>('[data-facet-picker]')]
		.find(element => element.dataset.name === name);
	picker?.dispatchEvent(new CustomEvent('facet-values', { detail: values }));
}

export function attachFacetPickers(form: HTMLFormElement) {
	for (const root of form.querySelectorAll<HTMLElement>('[data-facet-picker]')) {
		const name = root.dataset.name!;
		const limit = name === 'tags' ? 12 : 20;
		const maxLength = name === 'tags' ? 40 : 80;
		let values: string[] = JSON.parse(root.dataset.values || '[]');
		const options: string[] = JSON.parse(root.dataset.options || '[]');
		const input = root.querySelector<HTMLInputElement>('[data-facet-search]')!;
		const chips = root.querySelector<HTMLElement>('[data-facet-chips]')!;
		const results = root.querySelector<HTMLElement>('[data-facet-options]')!;
		const status = root.querySelector<HTMLElement>('[data-facet-status]')!;
		const valid = (value: string) => value.length <= maxLength && (name !== 'tags' || Boolean(slugify(value)));
		const includes = (value: string) => values.some(selected => normalize(selected) === normalize(value));

		const changed = () => {
			render();
			form.dispatchEvent(new Event('change', { bubbles: true }));
		};
		const add = (value: string) => {
			value = value.trim();
			if (!value || includes(value)) return;
			if (values.length >= limit || !valid(value)) {
				status.textContent = name === 'tags' && !slugify(value)
					? 'Tags must contain letters or numbers.'
					: `Choose up to ${limit} values, each at most ${maxLength} characters.`;
				return;
			}
			values.push(value);
			input.value = '';
			status.textContent = '';
			changed();
			input.focus();
			search();
		};
		const render = () => {
			chips.replaceChildren();
			for (const value of values) {
				const hidden = document.createElement('input');
				hidden.type = 'hidden';
				hidden.name = name;
				hidden.value = value;
				const remove = document.createElement('button');
				remove.type = 'button';
				remove.textContent = `${value} ×`;
				remove.setAttribute('aria-label', `Remove ${value}`);
				remove.addEventListener('click', () => {
					values = values.filter(selected => selected !== value);
					changed();
					input.focus();
					search();
				});
				chips.append(hidden, remove);
			}
		};
		const search = () => {
			results.replaceChildren();
			const query = normalize(input.value);
			results.hidden = !query;
			if (!query) return;
			const matches = options.filter(value => normalize(value).includes(query) && !includes(value));
			const button = (label: string, value: string) => {
				const choice = document.createElement('button');
				choice.type = 'button';
				choice.textContent = label;
				choice.addEventListener('click', () => add(value));
				choice.addEventListener('keydown', event => {
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						(choice.nextElementSibling as HTMLElement)?.focus();
					}
					if (event.key === 'ArrowUp') {
						event.preventDefault();
						((choice.previousElementSibling as HTMLElement) || input).focus();
					}
					if (event.key === 'Escape') {
						results.hidden = true;
						input.focus();
					}
				});
				results.append(choice);
			};
			matches.slice(0, 30).forEach(value => button(value, value));
			if (![...options, ...values].some(value => normalize(value) === query)) {
				button(`Add “${input.value.trim()}”`, input.value);
			}
			if (!results.childElementCount) {
				const empty = document.createElement('p');
				empty.className = 'hint';
				empty.textContent = 'Already selected.';
				results.append(empty);
			}
		};
		input.addEventListener('input', search);
		input.addEventListener('keydown', event => {
			if (event.key === 'Enter') {
				event.preventDefault();
				(results.querySelector('button') as HTMLButtonElement)?.click();
			}
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				(results.querySelector('button') as HTMLButtonElement)?.focus();
			}
			if (event.key === 'Escape') results.hidden = true;
		});
		root.addEventListener('facet-values', event => {
			values = [];
			for (const value of (event as CustomEvent<string[]>).detail) {
				const trimmed = value.trim();
				if (trimmed && valid(trimmed) && values.length < limit && !includes(trimmed)) values.push(trimmed);
			}
			changed();
		});
		render();
	}
}
