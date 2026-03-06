<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { pulls, repos } from '$lib/services/api';
	import type { Branch } from '$lib/types/repository';
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let branches = $state<Branch[]>([]);
	let title = $state('');
	let body = $state('');
	let headBranch = $state('');
	let baseBranch = $state('');
	let submitting = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			branches = await repos.branches(owner, repo);
			const def = branches.find(b => b.is_default);
			if (def) baseBranch = def.name;

			// Pre-fill from URL params (e.g., from compare page)
			const urlBase = $page.url.searchParams.get('base');
			const urlHead = $page.url.searchParams.get('head');
			if (urlBase && branches.some(b => b.name === urlBase)) baseBranch = urlBase;
			if (urlHead && branches.some(b => b.name === urlHead)) headBranch = urlHead;
		} catch {
			// ignore
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title || !headBranch || !baseBranch) return;
		submitting = true;
		error = '';
		try {
			const result = await pulls.create(owner, repo, { title, body, head_branch: headBranch, base_branch: baseBranch });
			toastStore.success('Pull request created successfully');
			goto(`/${owner}/${repo}/pulls/${result.number}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create pull request';
			toastStore.error(err instanceof Error ? err.message : 'Failed to create pull request');
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-6 max-w-2xl">
	<h2 class="text-lg font-semibold" style="color: var(--color-text);">New Pull Request</h2>

	<div class="flex items-center gap-3 flex-wrap">
		<div class="flex flex-col gap-1">
			<label class="text-xs font-medium" style="color: var(--color-text-dim);">Base</label>
			<select bind:value={baseBranch} class="px-3 py-1.5 text-sm rounded-lg border" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);">
				{#each branches as b}
					<option value={b.name}>{b.name}</option>
				{/each}
			</select>
		</div>
		<span class="mt-4" style="color: var(--color-text-dim);">←</span>
		<div class="flex flex-col gap-1">
			<label class="text-xs font-medium" style="color: var(--color-text-dim);">Compare</label>
			<select bind:value={headBranch} class="px-3 py-1.5 text-sm rounded-lg border" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);">
				<option value="">Select branch</option>
				{#each branches as b}
					<option value={b.name}>{b.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<form onsubmit={handleSubmit} class="flex flex-col gap-4">
		<input
			type="text"
			bind:value={title}
			placeholder="Pull request title"
			class="w-full px-4 py-2.5 text-sm rounded-lg border"
			style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
		/>
		<textarea
			bind:value={body}
			placeholder="Description (optional)"
			rows={8}
			class="w-full px-4 py-2.5 text-sm rounded-lg border resize-y"
			style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
		></textarea>
		{#if error}
			<p class="text-sm" style="color: var(--color-error);">{error}</p>
		{/if}
		<button
			type="submit"
			disabled={submitting || !title || !headBranch || !baseBranch}
			class="self-start px-5 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
			style="background-color: var(--color-primary);"
		>{submitting ? 'Creating...' : 'Create Pull Request'}</button>
	</form>
</div>
