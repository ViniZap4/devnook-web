<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos, issues as issuesApi, pulls as pullsApi } from '$lib/services/api';
	import type { Contributor, LanguageStat } from '$lib/services/api';
	import type { Commit } from '$lib/types/repository';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let contributors = $state<Contributor[]>([]);
	let languages = $state<LanguageStat[]>([]);
	let recentCommits = $state<Commit[]>([]);
	let openIssueCount = $state(0);
	let closedIssueCount = $state(0);
	let openPRCount = $state(0);
	let mergedPRCount = $state(0);
	let loading = $state(true);
	let activeTab = $state<'overview' | 'contributors' | 'languages'>('overview');

	onMount(async () => {
		try {
			const [contribs, langs, commits, openIssues, closedIssues, openPRs, closedPRs] = await Promise.allSettled([
				repos.contributors(owner, repoName),
				repos.languages(owner, repoName),
				repos.commits(owner, repoName),
				issuesApi.list(owner, repoName, { state: 'open' }),
				issuesApi.list(owner, repoName, { state: 'closed' }),
				pullsApi.list(owner, repoName, 'open'),
				pullsApi.list(owner, repoName, 'closed')
			]);
			if (contribs.status === 'fulfilled') contributors = contribs.value;
			if (langs.status === 'fulfilled') languages = langs.value;
			if (commits.status === 'fulfilled') recentCommits = commits.value;
			if (openIssues.status === 'fulfilled') openIssueCount = openIssues.value.length;
			if (closedIssues.status === 'fulfilled') closedIssueCount = closedIssues.value.length;
			if (openPRs.status === 'fulfilled') openPRCount = openPRs.value.length;
			if (closedPRs.status === 'fulfilled') mergedPRCount = closedPRs.value.length;
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	const totalCommits = $derived(contributors.reduce((sum, c) => sum + c.commits, 0));
	const totalIssues = $derived(openIssueCount + closedIssueCount);
	const totalPRs = $derived(openPRCount + mergedPRCount);

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-3 page-header">
		<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-secondary) 12%, transparent);">
			<svg class="w-4.5 h-4.5" style="color: var(--color-secondary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
		</div>
		<div>
			<h2 class="text-lg font-bold gradient-text">Insights</h2>
			<p class="text-xs" style="color: var(--color-text-dim);">Repository analytics and activity</p>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
			{#each Array(4) as _, i}
				<div class="card p-5 card-animate stagger-{i + 1}">
					<div class="w-10 h-6 skeleton-loading rounded mb-2"></div>
					<div class="w-16 h-3 skeleton-loading rounded"></div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Stats cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
			<div class="stat-card p-5 text-center card-animate stagger-1">
				<p class="text-3xl font-extrabold gradient-text">{totalCommits}</p>
				<p class="text-[11px] font-medium mt-1.5 uppercase tracking-wider" style="color: var(--color-text-dim);">Commits</p>
			</div>
			<div class="stat-card p-5 text-center card-animate stagger-2">
				<p class="text-3xl font-extrabold" style="color: var(--color-text);">{contributors.length}</p>
				<p class="text-[11px] font-medium mt-1.5 uppercase tracking-wider" style="color: var(--color-text-dim);">Contributors</p>
			</div>
			<div class="stat-card p-5 text-center card-animate stagger-3">
				<p class="text-3xl font-extrabold" style="color: var(--color-success);">{totalIssues}</p>
				<p class="text-[11px] font-medium mt-1.5 uppercase tracking-wider" style="color: var(--color-text-dim);">Issues</p>
				<p class="text-[10px] mt-0.5" style="color: var(--color-success); opacity: 0.7;">{openIssueCount} open</p>
			</div>
			<div class="stat-card p-5 text-center card-animate stagger-4">
				<p class="text-3xl font-extrabold" style="color: var(--color-accent);">{totalPRs}</p>
				<p class="text-[11px] font-medium mt-1.5 uppercase tracking-wider" style="color: var(--color-text-dim);">Pull Requests</p>
				<p class="text-[10px] mt-0.5" style="color: var(--color-accent); opacity: 0.7;">{openPRCount} open</p>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex items-center gap-1 glass-subtle rounded-xl p-1 self-start animate-fade-up stagger-5">
			{#each [{ id: 'overview', label: 'Overview' }, { id: 'contributors', label: 'Contributors' }, { id: 'languages', label: 'Languages' }] as tab}
				<button
					class="px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300"
					style="
						color: {activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {activeTab === tab.id ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
					"
					onclick={() => activeTab = tab.id as typeof activeTab}
				>{tab.label}</button>
			{/each}
		</div>

		{#if activeTab === 'overview'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
				<!-- Recent commits -->
				<div class="card p-5">
					<h3 class="text-sm font-bold mb-3" style="color: var(--color-text);">Recent Commits</h3>
					<div class="flex flex-col gap-1">
						{#each recentCommits.slice(0, 10) as commit}
							<a
								href="/{owner}/{repoName}/commits/{commit.hash}"
								class="flex items-start gap-3 p-2 rounded-lg transition-all hover:bg-[var(--color-surface-hover)] group"
							>
								<span class="font-mono text-[11px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md group-hover:underline" style="color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, transparent);">{commit.short_hash}</span>
								<div class="min-w-0 flex-1">
									<p class="text-xs truncate leading-relaxed" style="color: var(--color-text);">{commit.message.split('\n')[0]}</p>
									<p class="text-[11px] mt-0.5" style="color: var(--color-text-dim); opacity: 0.6;">{commit.author}</p>
								</div>
							</a>
						{/each}
						{#if recentCommits.length === 0}
							<p class="text-xs p-4 text-center" style="color: var(--color-text-dim);">No commits yet.</p>
						{/if}
					</div>
				</div>

				<!-- Breakdowns -->
				<div class="flex flex-col gap-5">
					<div class="card p-5">
						<h3 class="text-sm font-bold mb-3" style="color: var(--color-text);">Issue Breakdown</h3>
						{#if totalIssues > 0}
							<div class="w-full h-2.5 rounded-full overflow-hidden flex" style="background: var(--color-surface-hover);">
								<div class="h-full transition-all duration-700" style="width: {(openIssueCount / totalIssues) * 100}%; background: var(--color-success); border-radius: {closedIssueCount === 0 ? '9999px' : '9999px 0 0 9999px'};"></div>
								<div class="h-full transition-all duration-700" style="width: {(closedIssueCount / totalIssues) * 100}%; background: var(--color-primary); border-radius: {openIssueCount === 0 ? '9999px' : '0 9999px 9999px 0'};"></div>
							</div>
							<div class="flex items-center gap-4 mt-2.5 text-xs" style="color: var(--color-text-dim);">
								<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-success);"></span> {openIssueCount} open</span>
								<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-primary);"></span> {closedIssueCount} closed</span>
							</div>
						{:else}
							<p class="text-xs" style="color: var(--color-text-dim);">No issues.</p>
						{/if}
					</div>
					<div class="card p-5">
						<h3 class="text-sm font-bold mb-3" style="color: var(--color-text);">Pull Request Breakdown</h3>
						{#if totalPRs > 0}
							<div class="w-full h-2.5 rounded-full overflow-hidden flex" style="background: var(--color-surface-hover);">
								<div class="h-full transition-all duration-700" style="width: {(openPRCount / totalPRs) * 100}%; background: var(--color-accent); border-radius: {mergedPRCount === 0 ? '9999px' : '9999px 0 0 9999px'};"></div>
								<div class="h-full transition-all duration-700" style="width: {(mergedPRCount / totalPRs) * 100}%; background: var(--color-primary); border-radius: {openPRCount === 0 ? '9999px' : '0 9999px 9999px 0'};"></div>
							</div>
							<div class="flex items-center gap-4 mt-2.5 text-xs" style="color: var(--color-text-dim);">
								<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-accent);"></span> {openPRCount} open</span>
								<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-primary);"></span> {mergedPRCount} closed</span>
							</div>
						{:else}
							<p class="text-xs" style="color: var(--color-text-dim);">No pull requests.</p>
						{/if}
					</div>
				</div>
			</div>

		{:else if activeTab === 'contributors'}
			<div class="flex flex-col gap-2 animate-fade-up">
				{#each contributors as contributor, i}
					{@const pct = totalCommits > 0 ? (contributor.commits / totalCommits) * 100 : 0}
					<div class="card p-4 card-animate stagger-{Math.min(i + 1, 8)}">
						<div class="flex items-center gap-3">
							<span class="text-[11px] font-mono w-7 text-right font-bold" style="color: {i < 3 ? 'var(--color-primary)' : 'var(--color-text-dim)'};">#{i + 1}</span>
							<div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-accent) 12%, transparent)); color: var(--color-primary);">
								{contributor.name[0].toUpperCase()}
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between mb-1.5">
									<span class="text-sm font-semibold truncate" style="color: var(--color-text);">{contributor.name}</span>
									<span class="text-[11px] shrink-0 ml-2 font-mono" style="color: var(--color-text-dim);">{contributor.commits} <span class="opacity-50">({pct.toFixed(1)}%)</span></span>
								</div>
								<div class="w-full h-1.5 rounded-full overflow-hidden" style="background: var(--color-surface-hover);">
									<div class="h-full rounded-full transition-all duration-700" style="width: {pct}%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent));"></div>
								</div>
							</div>
						</div>
					</div>
				{/each}
				{#if contributors.length === 0}
					<div class="card p-12 text-center">
						<p class="text-sm" style="color: var(--color-text-dim);">No contributors found.</p>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'languages'}
			<div class="flex flex-col gap-5 animate-fade-up">
				{#if languages.length > 0}
					<!-- Language bar -->
					<div class="card p-5">
						<div class="w-full h-3.5 rounded-full overflow-hidden flex">
							{#each languages as lang, i}
								<div
									class="h-full transition-all duration-500 hover:brightness-125 cursor-pointer"
									class:rounded-l-full={i === 0}
									class:rounded-r-full={i === languages.length - 1}
									style="width: {lang.percentage}%; background: {lang.color};"
									title="{lang.name}: {lang.percentage.toFixed(1)}%"
								></div>
							{/each}
						</div>
					</div>
					<!-- Language list -->
					<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
						{#each languages as lang, i}
							<div class="card p-3.5 card-animate stagger-{Math.min(i + 1, 8)}">
								<div class="flex items-center gap-2.5">
									<span class="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-1" style="background: {lang.color}; --tw-ring-color: {lang.color}30; --tw-ring-offset-color: var(--color-background);"></span>
									<div class="min-w-0 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-sm font-semibold truncate" style="color: var(--color-text);">{lang.name}</span>
											<span class="text-xs font-mono ml-2" style="color: var(--color-text-dim);">{lang.percentage.toFixed(1)}%</span>
										</div>
										<p class="text-[11px]" style="color: var(--color-text-dim); opacity: 0.6;">{formatBytes(lang.bytes)}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="card p-12 text-center">
						<p class="text-sm" style="color: var(--color-text-dim);">No language data available.</p>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
