<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { TreeEntry } from '$lib/types/repository';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let wikiPages = $state<TreeEntry[]>([]);
	let loading = $state(true);
	let hasWiki = $state(false);

	onMount(async () => {
		try {
			const tree = await repos.tree(owner, repoName, 'main', 'wiki');
			wikiPages = tree.filter(e => e.type === 'blob' && e.name.endsWith('.md')).sort((a, b) => {
				if (a.name === 'Home.md') return -1;
				if (b.name === 'Home.md') return 1;
				return a.name.localeCompare(b.name);
			});
			hasWiki = true;
		} catch {
			hasWiki = false;
		} finally {
			loading = false;
		}
	});

	function pageSlug(entry: TreeEntry): string {
		return entry.name.replace(/\.md$/, '');
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between page-header">
		<div class="flex items-center gap-3">
			<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-info) 12%, transparent);">
				<svg class="w-4.5 h-4.5" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
			</div>
			<div>
				<h2 class="text-lg font-bold gradient-text">Wiki</h2>
				{#if hasWiki}
					<p class="text-xs" style="color: var(--color-text-dim);">{wikiPages.length} {wikiPages.length === 1 ? 'page' : 'pages'}</p>
				{/if}
			</div>
		</div>
		<a
			href="/{owner}/{repoName}/wiki/new"
			class="btn-glow flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
			style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
			New Page
		</a>
	</div>

	{#if loading}
		<div class="card overflow-hidden card-animate">
			{#each Array(4) as _, i}
				<div class="flex items-center gap-3 px-5 py-4 {i > 0 ? 'border-t' : ''}" style="border-color: var(--color-border);">
					<div class="w-5 h-5 skeleton-loading rounded"></div>
					<div class="w-40 h-4 skeleton-loading rounded"></div>
				</div>
			{/each}
		</div>
	{:else if !hasWiki || wikiPages.length === 0}
		<div class="card p-16 text-center card-animate">
			<div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-info) 8%, transparent);">
				<svg class="w-8 h-8 opacity-30" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
			</div>
			<p class="text-sm font-semibold mb-1" style="color: var(--color-text);">No wiki pages yet</p>
			<p class="text-xs mb-5" style="color: var(--color-text-dim);">Create the first page to get started with your wiki.</p>
			<a
				href="/{owner}/{repoName}/wiki/new"
				class="btn-glow inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02]"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
			>
				Create Home page
			</a>
		</div>
	{:else}
		<div class="card overflow-hidden card-animate">
			{#each wikiPages as entry, i}
				{@const slug = pageSlug(entry)}
				<a
					href="/{owner}/{repoName}/wiki/{slug}"
					class="flex items-center justify-between px-5 py-3.5 transition-all hover:bg-[var(--color-surface-hover)] group {i > 0 ? 'border-t' : ''}"
					style="border-color: var(--color-border);"
				>
					<div class="flex items-center gap-3">
						<div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: color-mix(in srgb, var(--color-info) 8%, transparent);">
							<svg class="w-3.5 h-3.5 opacity-50" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
						</div>
						<span class="text-sm font-medium group-hover:underline" style="color: var(--color-text);">
							{slug === 'Home' ? 'Home (start page)' : slug.replace(/-/g, ' ')}
						</span>
						{#if slug === 'Home'}
							<span class="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary);">Home</span>
						{/if}
					</div>
					<svg class="w-4 h-4 opacity-0 group-hover:opacity-40 transition-all group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
				</a>
			{/each}
		</div>
	{/if}
</div>
