<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { issues as issuesApi, labels as labelsApi } from '$lib/services/api';
	import type { Issue, Label } from '$lib/types/issue';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let openIssues = $state<Issue[]>([]);
	let closedIssues = $state<Issue[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const [open, closed] = await Promise.all([
				issuesApi.list(owner, repoName, { state: 'open' }),
				issuesApi.list(owner, repoName, { state: 'closed' })
			]);
			openIssues = open;
			closedIssues = closed;
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	function getLabelColor(label: Label) {
		return label.color.startsWith('#') ? label.color : `#${label.color}`;
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between page-header">
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-info) 12%, transparent);">
				<svg class="w-4.5 h-4.5" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
			</div>
			<div>
				<h2 class="text-lg font-bold gradient-text">Issue Board</h2>
				<p class="text-xs" style="color: var(--color-text-dim);">{openIssues.length + closedIssues.length} total issues</p>
			</div>
		</div>
		<a
			href="/{owner}/{repoName}/issues"
			class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl glass-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
			style="color: var(--color-text-dim);"
		>
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
			List view
		</a>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each Array(2) as _, col}
				<div class="flex flex-col gap-2 card-animate stagger-{col + 1}">
					<div class="glass-subtle rounded-xl px-4 py-3">
						<div class="w-16 h-4 skeleton-loading rounded"></div>
					</div>
					{#each Array(3) as _}
						<div class="card p-3">
							<div class="w-full h-4 skeleton-loading rounded mb-2"></div>
							<div class="w-2/3 h-3 skeleton-loading rounded"></div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
			<!-- Open column -->
			<div class="flex flex-col gap-2 animate-fade-up">
				<div class="glass-subtle rounded-xl px-4 py-3 flex items-center gap-2">
					<div class="w-2 h-2 rounded-full live-dot" style="background: var(--color-success);"></div>
					<span class="text-sm font-bold" style="color: var(--color-success);">Open</span>
					<span class="text-[10px] px-2 py-0.5 rounded-full ml-auto font-semibold" style="background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success);">{openIssues.length}</span>
				</div>
				{#each openIssues as issue, i}
					<a
						href="/{owner}/{repoName}/issues/{issue.number}"
						class="card card-hover p-3.5 card-animate stagger-{Math.min(i + 1, 6)} group"
					>
						<div class="flex items-start gap-2 mb-1.5">
							<span class="text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 mt-0.5" style="background: color-mix(in srgb, var(--color-success) 10%, transparent); color: var(--color-success);">#{issue.number}</span>
							<span class="text-sm font-medium group-hover:underline leading-snug" style="color: var(--color-text);">{issue.title}</span>
						</div>
						{#if issue.labels && issue.labels.length > 0}
							<div class="flex flex-wrap gap-1 mb-2 ml-8">
								{#each issue.labels as label}
									<span
										class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
										style="background: {getLabelColor(label)}18; color: {getLabelColor(label)}; border: 1px solid {getLabelColor(label)}30;"
									>{label.name}</span>
								{/each}
							</div>
						{/if}
						<div class="flex items-center gap-2 text-[11px] ml-8" style="color: var(--color-text-dim);">
							<span>{issue.author}</span>
							<span class="opacity-30">&middot;</span>
							<RelativeTime date={issue.created_at} />
							{#if issue.assignee}
								<span class="opacity-30">&middot;</span>
								<span class="flex items-center gap-1">
									<svg class="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
									{issue.assignee}
								</span>
							{/if}
						</div>
					</a>
				{/each}
				{#if openIssues.length === 0}
					<div class="card p-8 text-center">
						<p class="text-xs" style="color: var(--color-text-dim);">No open issues</p>
					</div>
				{/if}
			</div>

			<!-- Closed column -->
			<div class="flex flex-col gap-2 animate-fade-up stagger-2">
				<div class="glass-subtle rounded-xl px-4 py-3 flex items-center gap-2">
					<svg class="w-3.5 h-3.5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					<span class="text-sm font-bold" style="color: var(--color-primary);">Closed</span>
					<span class="text-[10px] px-2 py-0.5 rounded-full ml-auto font-semibold" style="background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary);">{closedIssues.length}</span>
				</div>
				{#each closedIssues as issue, i}
					<a
						href="/{owner}/{repoName}/issues/{issue.number}"
						class="card card-hover p-3.5 card-animate stagger-{Math.min(i + 1, 6)} group"
					>
						<div class="flex items-start gap-2 mb-1.5">
							<span class="text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 mt-0.5" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary);">#{issue.number}</span>
							<span class="text-sm font-medium group-hover:underline leading-snug" style="color: var(--color-text);">{issue.title}</span>
						</div>
						{#if issue.labels && issue.labels.length > 0}
							<div class="flex flex-wrap gap-1 mb-2 ml-8">
								{#each issue.labels as label}
									<span
										class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
										style="background: {getLabelColor(label)}18; color: {getLabelColor(label)}; border: 1px solid {getLabelColor(label)}30;"
									>{label.name}</span>
								{/each}
							</div>
						{/if}
						<div class="flex items-center gap-2 text-[11px] ml-8" style="color: var(--color-text-dim);">
							<span>{issue.author}</span>
							<span class="opacity-30">&middot;</span>
							<RelativeTime date={issue.created_at} />
						</div>
					</a>
				{/each}
				{#if closedIssues.length === 0}
					<div class="card p-8 text-center">
						<p class="text-xs" style="color: var(--color-text-dim);">No closed issues</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
