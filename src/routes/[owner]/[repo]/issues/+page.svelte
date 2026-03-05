<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { issuesStore } from '$lib/stores/issues.svelte';
	import { labels as labelsApi, milestones as milestonesApi } from '$lib/services/api';
	import type { Label, Milestone } from '$lib/types/issue';
	import IssueList from '$lib/components/IssueList.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let stateFilter = $state<'open' | 'closed'>('open');
	let labelFilter = $state('');
	let milestoneFilter = $state('');
	let assigneeFilter = $state('');
	let searchQuery = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;

	let repoLabels = $state<Label[]>([]);
	let repoMilestones = $state<Milestone[]>([]);
	let showFilters = $state(false);

	onMount(async () => {
		await loadIssues();
		try {
			const [l, m] = await Promise.all([
				labelsApi.list(owner, repoName),
				milestonesApi.list(owner, repoName)
			]);
			repoLabels = l;
			repoMilestones = m;
		} catch {
			// ignore
		}
	});

	function loadIssues() {
		return issuesStore.load(owner, repoName, {
			state: stateFilter,
			labels: labelFilter || undefined,
			milestone: milestoneFilter || undefined,
			assignee: assigneeFilter || undefined,
			q: searchQuery || undefined
		});
	}

	function switchState(s: 'open' | 'closed') {
		stateFilter = s;
		loadIssues();
	}

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => loadIssues(), 300);
	}

	function applyFilter() {
		loadIssues();
	}

	function clearFilters() {
		labelFilter = '';
		milestoneFilter = '';
		assigneeFilter = '';
		searchQuery = '';
		loadIssues();
	}

	const hasFilters = $derived(!!labelFilter || !!milestoneFilter || !!assigneeFilter || !!searchQuery);
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-2">
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
			<button
				class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border transition-colors hover:bg-[var(--color-surface)]"
				style="border-color: var(--color-border); color: {showFilters ? 'var(--color-primary)' : 'var(--color-text-dim)'};"
				onclick={() => { showFilters = !showFilters; }}
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
				Filters
				{#if hasFilters}
					<span class="w-1.5 h-1.5 rounded-full" style="background-color: var(--color-primary);"></span>
				{/if}
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

	{#if showFilters}
		<div class="rounded-xl border p-4 flex flex-col gap-3" style="border-color: var(--color-border); background-color: var(--color-surface);">
			<div class="flex items-center gap-3 flex-wrap">
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearchInput}
					placeholder="Search issues..."
					class="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:border-[var(--color-primary)]"
					style="border-color: var(--color-border); color: var(--color-text);"
				/>
				{#if repoLabels.length > 0}
					<select
						bind:value={labelFilter}
						onchange={applyFilter}
						class="px-3 py-2 text-sm rounded-lg border bg-transparent transition-colors"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						<option value="">All labels</option>
						{#each repoLabels as label}
							<option value={label.name}>{label.name}</option>
						{/each}
					</select>
				{/if}
				{#if repoMilestones.length > 0}
					<select
						bind:value={milestoneFilter}
						onchange={applyFilter}
						class="px-3 py-2 text-sm rounded-lg border bg-transparent transition-colors"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						<option value="">All milestones</option>
						{#each repoMilestones as m}
							<option value={String(m.id)}>{m.title}</option>
						{/each}
					</select>
				{/if}
				<input
					type="text"
					bind:value={assigneeFilter}
					placeholder="Assignee username"
					class="px-3 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:border-[var(--color-primary)]"
					style="border-color: var(--color-border); color: var(--color-text); width: 150px;"
					onchange={applyFilter}
				/>
			</div>
			{#if hasFilters}
				<button class="self-start text-xs hover:underline" style="color: var(--color-primary);" onclick={clearFilters}>
					Clear all filters
				</button>
			{/if}
		</div>
	{/if}

	{#if issuesStore.loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading issues...</div>
	{:else if issuesStore.issues.length === 0}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
			</svg>
			<p class="text-sm font-medium mb-1" style="color: var(--color-text);">No {stateFilter} issues</p>
			<p class="text-xs" style="color: var(--color-text-dim);">
				{#if hasFilters}
					Try adjusting your filters.
				{:else if stateFilter === 'open'}
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
