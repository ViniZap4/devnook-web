<script lang="ts">
	import { page } from '$app/stores';
	import { pulls } from '$lib/services/api';
	import type { PullRequest } from '$lib/types/pull_request';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let prs = $state<PullRequest[]>([]);
	let loading = $state(true);
	let stateFilter = $state<'open' | 'closed'>('open');

	$effect(() => {
		void owner;
		void repo;
		fetchPRs();
	});

	async function fetchPRs() {
		loading = true;
		try {
			prs = await pulls.list(owner, repo, stateFilter);
		} catch {
			prs = [];
		} finally {
			loading = false;
		}
	}

	function switchState(s: 'open' | 'closed') {
		stateFilter = s;
		fetchPRs();
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
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
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
			href="/{owner}/{repo}/pulls/new"
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:brightness-110"
			style="background-color: var(--color-primary);"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
			New Pull Request
		</a>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading pull requests...</div>
	{:else if prs.length === 0}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
			</svg>
			<p class="text-sm font-medium mb-1" style="color: var(--color-text);">No {stateFilter} pull requests</p>
			<p class="text-xs" style="color: var(--color-text-dim);">
				{#if stateFilter === 'open'}
					There are no open pull requests right now.
				{:else}
					No closed pull requests yet.
				{/if}
			</p>
		</div>
	{:else}
		<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
			{#each prs as pr, i}
				<a
					href="/{owner}/{repo}/pulls/{pr.number}"
					class="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--color-surface)] {i > 0 ? 'border-t' : ''}"
					style="border-color: var(--color-border);"
				>
					<div class="mt-0.5 shrink-0">
						{#if pr.state === 'merged'}
							<svg class="w-4 h-4" style="color: var(--color-secondary);" fill="currentColor" viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
						{:else if pr.state === 'open'}
							<svg class="w-4 h-4" style="color: var(--color-success);" fill="currentColor" viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
						{:else}
							<svg class="w-4 h-4" style="color: var(--color-error);" fill="currentColor" viewBox="0 0 16 16"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<span class="font-medium text-sm" style="color: var(--color-text);">{pr.title}</span>
						<div class="flex items-center gap-2 mt-1 flex-wrap">
							<span class="text-xs" style="color: var(--color-text-dim);">#{pr.number}</span>
							<span class="text-xs" style="color: var(--color-text-dim);">by {pr.author}</span>
							<span class="text-xs px-1.5 py-0.5 rounded font-mono" style="background-color: var(--color-surface-hover); color: var(--color-text-dim);">{pr.head_branch}</span>
							<svg class="w-3 h-3" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
							<span class="text-xs px-1.5 py-0.5 rounded font-mono" style="background-color: var(--color-surface-hover); color: var(--color-text-dim);">{pr.base_branch}</span>
							{#if pr.created_at}
								<span class="text-xs" style="color: var(--color-text-dim); opacity: 0.6;"><RelativeTime date={pr.created_at} /></span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
