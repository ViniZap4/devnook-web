<script lang="ts">
	import { onMount } from 'svelte';
	import { explore } from '$lib/services/api';

	interface TrendingRepo {
		owner: string;
		name: string;
		description?: string;
		stars: number;
		forks: number;
		language?: string;
	}

	let items = $state<TrendingRepo[]>([]);
	let loading = $state(true);

	const langColors: Record<string, string> = {
		JavaScript: '#f1e05a',
		TypeScript: '#3178c6',
		Python: '#3572a5',
		Go: '#00add8',
		Rust: '#dea584',
		Java: '#b07219',
		C: '#555555',
		'C++': '#f34b7d',
		Ruby: '#701516',
		Swift: '#f05138',
		Kotlin: '#a97bff',
		Svelte: '#ff3e00',
	};

	onMount(async () => {
		try {
			const result = await explore.repos({ sort: 'stars' });
			items = (result.repos || []).slice(0, 5).map((r: any) => ({
				owner: r.owner,
				name: r.name,
				description: r.description || '',
				stars: r.stars_count || 0,
				forks: r.forks_count || 0,
				language: r.language || '',
			}));
		} catch { items = []; }
		finally { loading = false; }
	});
</script>

<div class="trending-card">
	<div class="card-header">
		<svg class="w-4 h-4" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
		<h3 class="text-[15px] font-semibold" style="color: var(--color-text);">Trending Repos</h3>
	</div>

	{#if loading}
		<div class="py-8 text-center text-[13px]" style="color: var(--color-text-dim);">Loading...</div>
	{:else if items.length === 0}
		<div class="py-8 text-center text-[13px]" style="color: var(--color-text-dim);">No repos yet</div>
	{:else}
		{#each items as repo, i}
			<a href="/{repo.owner}/{repo.name}" class="repo-item" class:last={i === items.length - 1}>
				<div class="flex items-start justify-between">
					<div class="min-w-0 flex-1">
						<span class="text-[14px] font-medium" style="color: var(--color-text);">{repo.owner}/{repo.name}</span>
						{#if repo.description}
							<p class="text-[12px] mt-0.5 line-clamp-1" style="color: var(--color-text-dim);">{repo.description}</p>
						{/if}
					</div>
					{#if repo.language}
						{@const color = langColors[repo.language] || '#8b8b8b'}
						<span class="lang-badge" style="background: {color}20; color: {color};">{repo.language}</span>
					{/if}
				</div>
				<div class="flex items-center gap-3 mt-2 text-[12px]" style="color: var(--color-text-dim);">
					<span class="flex items-center gap-1">
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
						{repo.stars}
					</span>
					<span class="flex items-center gap-1">
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
						{repo.forks}
					</span>
				</div>
			</a>
		{/each}
	{/if}

	<a href="/explore" class="view-all">
		View Global Rankings
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
	</a>
</div>

<style>
	.trending-card {
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		transition: border-color 0.2s;
	}
	.trending-card:hover {
		border-color: rgba(255, 255, 255, 0.12);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px;
	}

	.repo-item {
		display: block;
		padding: 12px 16px;
		border-bottom: 1px solid var(--glass-border);
		text-decoration: none;
		transition: background 0.15s;
	}
	.repo-item:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.repo-item:hover span:first-child {
		color: var(--color-primary) !important;
	}
	.repo-item.last {
		border-bottom: none;
	}

	.lang-badge {
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		flex-shrink: 0;
	}

	.view-all {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 12px 16px;
		font-size: 14px;
		color: var(--color-primary);
		text-decoration: none;
		border-top: 1px solid var(--glass-border);
		transition: color 0.15s;
	}
	.view-all:hover {
		color: #22d3ee;
	}
</style>
