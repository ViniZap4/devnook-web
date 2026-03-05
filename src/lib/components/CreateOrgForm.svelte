<script lang="ts">
	import { orgsStore } from '$lib/stores/orgs.svelte';
	import { goto } from '$app/navigation';

	let name = $state('');
	let displayName = $state('');
	let description = $state('');
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;
		error = '';
		submitting = true;
		try {
			await orgsStore.create({ name: name.trim(), display_name: displayName, description });
			goto(`/orgs/${name.trim()}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create organization';
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6 max-w-lg">
	<div>
		<label for="org-name" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Organization name
		</label>
		<input
			id="org-name"
			type="text"
			bind:value={name}
			placeholder="my-org"
			class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--color-primary)]"
			required
		/>
	</div>

	<div>
		<label for="org-display" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Display name <span class="opacity-40">(optional)</span>
		</label>
		<input
			id="org-display"
			type="text"
			bind:value={displayName}
			placeholder="My Organization"
			class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--color-primary)]"
		/>
	</div>

	<div>
		<label for="org-desc" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Description <span class="opacity-40">(optional)</span>
		</label>
		<input
			id="org-desc"
			type="text"
			bind:value={description}
			placeholder="A short description"
			class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--color-primary)]"
		/>
	</div>

	{#if error}
		<p class="text-sm text-red-400">{error}</p>
	{/if}

	<button
		type="submit"
		disabled={submitting || !name.trim()}
		class="px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
		style="background-color: var(--color-primary);"
	>
		{submitting ? 'Creating...' : 'Create organization'}
	</button>
</form>
