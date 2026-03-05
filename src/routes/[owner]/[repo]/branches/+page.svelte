<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { Branch } from '$lib/types/repository';
	import BranchList from '$lib/components/BranchList.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let branches = $state<Branch[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			branches = await repos.branches(owner, repoName);
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center gap-1 rounded-xl border p-1 self-start" style="border-color: var(--color-border);">
		<a
			href="/{owner}/{repoName}/branches"
			class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
			style="background-color: var(--color-primary)10; color: var(--color-primary);"
		>
			<span class="flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
				Branches
			</span>
		</a>
		<a
			href="/{owner}/{repoName}/tags"
			class="px-4 py-2 text-sm rounded-lg transition-colors"
			style="color: var(--color-text-dim);"
		>
			<span class="flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
				Tags
			</span>
		</a>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading branches...</div>
	{:else if branches.length === 0}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">No branches found.</p>
		</div>
	{:else}
		<BranchList {branches} />
	{/if}
</div>
