<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { issuesStore } from '$lib/stores/issues.svelte';
	import IssueList from '$lib/components/IssueList.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let stateFilter = $state<'open' | 'closed'>('open');

	onMount(() => {
		issuesStore.load(owner, repoName, stateFilter);
	});

	function switchState(s: 'open' | 'closed') {
		stateFilter = s;
		issuesStore.load(owner, repoName, s);
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-1 rounded-xl border p-1" style="border-color: var(--color-border);">
			<button
				class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
				style="
					color: {stateFilter === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'};
					background: {stateFilter === 'open' ? 'var(--color-success)10' : 'transparent'};
					font-weight: {stateFilter === 'open' ? '600' : '400'};
				"
				onclick={() => switchState('open')}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" /></svg>
				Open
			</button>
			<button
				class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
				style="
					color: {stateFilter === 'closed' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
					background: {stateFilter === 'closed' ? 'var(--color-primary)10' : 'transparent'};
					font-weight: {stateFilter === 'closed' ? '600' : '400'};
				"
				onclick={() => switchState('closed')}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				Closed
			</button>
		</div>
		<a
			href="/{owner}/{repoName}/issues/new"
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:brightness-110"
			style="background-color: var(--color-primary);"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
			New Issue
		</a>
	</div>

	{#if issuesStore.loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading issues...</div>
	{:else if issuesStore.issues.length === 0}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
			</svg>
			<p class="text-sm font-medium mb-1" style="color: var(--color-text);">No {stateFilter} issues</p>
			<p class="text-xs" style="color: var(--color-text-dim);">
				{#if stateFilter === 'open'}
					Great work! There are no open issues right now.
				{:else}
					No closed issues yet.
				{/if}
			</p>
		</div>
	{:else}
		<IssueList issues={issuesStore.issues} {owner} repo={repoName} />
	{/if}
</div>
