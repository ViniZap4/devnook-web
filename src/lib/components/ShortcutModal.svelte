<script lang="ts">
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import Modal from './Modal.svelte';

	let { open = false, onclose }: { open: boolean; onclose: () => void } = $props();

	const editing = $derived(shortcutsStore.editShortcut);
	const modalTitle = $derived(editing ? 'Edit Shortcut' : 'Create Shortcut');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		const title = formData.get('title') as string;
		const url = formData.get('url') as string;

		try {
			if (editing) {
				await shortcutsStore.update(editing.id, title, url);
			} else {
				await shortcutsStore.create(title, url);
			}
			(event.target as HTMLFormElement).reset();
			onclose();
		} catch {
			// error shown via toast in store
		}
	}
</script>

<Modal {open} title={modalTitle} {onclose}>
	<form class="flex flex-col gap-4" onsubmit={handleSubmit}>
		<label class="field">
			<span class="field-label">Name</span>
			<input class="field-input" type="text" placeholder="My site" name="title" value={editing?.title ?? ''} required />
		</label>

		<label class="field">
			<span class="field-label">URL</span>
			<input class="field-input" type="url" name="url" placeholder="https://example.com" value={editing?.url ?? ''} pattern="https://.*" required />
		</label>

		<button class="submit-btn" type="submit">{editing ? 'Save changes' : 'Create'}</button>
	</form>
</Modal>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.field-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text);
		opacity: 0.6;
	}
	.field-input {
		padding: 0.625rem 0.75rem;
		background: var(--color-surface-hover);
		border: 1px solid var(--color-surface-hover);
		border-radius: 0.625rem;
		color: var(--color-text);
		font-size: 0.9375rem;
		transition: border-color 0.2s, background-color 0.2s;
	}
	.field-input::placeholder {
		color: var(--color-text);
		opacity: 0.25;
	}
	.field-input:focus {
		border-color: var(--color-border);
		background: var(--color-surface-hover);
	}
	.submit-btn {
		margin-top: 0.25rem;
		padding: 0.625rem;
		border-radius: 0.625rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #fff;
		background-color: var(--color-primary);
		transition: opacity 0.15s, transform 0.15s;
	}
	.submit-btn:hover {
		opacity: 0.85;
		transform: translateY(-1px);
	}
</style>
