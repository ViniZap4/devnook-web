<script lang="ts">
	import { reposStore } from '$lib/stores/repos.svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';

	let name = $state('');
	let description = $state('');
	let isPrivate = $state(false);
	let error = $state('');
	let submitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;
		error = '';
		submitting = true;
		try {
			await reposStore.create({ name: name.trim(), description, is_private: isPrivate });
			goto(`/${userStore.user?.username}/${name.trim()}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create repository';
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6 max-w-lg">
	<div>
		<label for="repo-name" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Repository name
		</label>
		<input
			id="repo-name"
			type="text"
			bind:value={name}
			placeholder="my-project"
			class="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--palette-0)]"
			required
		/>
	</div>

	<div>
		<label for="repo-desc" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Description <span class="opacity-40">(optional)</span>
		</label>
		<input
			id="repo-desc"
			type="text"
			bind:value={description}
			placeholder="A short description"
			class="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--palette-0)]"
		/>
	</div>

	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={() => { isPrivate = !isPrivate; }}
			class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isPrivate ? 'bg-[var(--palette-0)]' : 'bg-white/20'}"
			aria-label="Toggle repository visibility"
		>
			<span class="inline-block h-4 w-4 rounded-full bg-white transition-transform {isPrivate ? 'translate-x-6' : 'translate-x-1'}"></span>
		</button>
		<span class="text-sm text-[var(--color-text)]">{isPrivate ? 'Private' : 'Public'}</span>
	</div>

	{#if error}
		<p class="text-sm text-red-400">{error}</p>
	{/if}

	<button
		type="submit"
		disabled={submitting || !name.trim()}
		class="px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
		style="background-color: var(--palette-0);"
	>
		{submitting ? 'Creating...' : 'Create repository'}
	</button>
</form>
