<script lang="ts">
	import Modal from './Modal.svelte';

	let { open, onClose, onAdd }: {
		open: boolean;
		onClose: () => void;
		onAdd: (username: string) => Promise<void>;
	} = $props();

	let username = $state('');
	let submitting = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!username.trim()) return;
		submitting = true;
		error = '';
		try {
			await onAdd(username.trim());
			username = '';
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add member';
		} finally {
			submitting = false;
		}
	}
</script>

{#if open}
	<Modal open={true} onclose={onClose}>
		<h3 class="text-[var(--color-text)] font-semibold mb-4">Add member</h3>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<input
				type="text"
				bind:value={username}
				placeholder="Username"
				class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--color-primary)]"
				required
			/>
			{#if error}
				<p class="text-sm text-red-400">{error}</p>
			{/if}
			<button
				type="submit"
				disabled={submitting || !username.trim()}
				class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
				style="background-color: var(--color-primary);"
			>
				{submitting ? 'Adding...' : 'Add member'}
			</button>
		</form>
	</Modal>
{/if}
