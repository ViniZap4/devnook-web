<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { docs } from '$lib/services/api';
	import type { DocSpace, DocPage } from '$lib/types/doc';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const spaceSlug = $derived($page.params.space!);

	let space = $state<DocSpace | null>(null);
	let pages = $state<DocPage[]>([]);
	let loading = $state(true);
	let showNewPage = $state(false);
	let newTitle = $state('');
	let creating = $state(false);
	let fetchId = 0;

	$effect(() => {
		const _slug = spaceSlug;
		const id = ++fetchId;

		if (!userStore.isLoggedIn) { goto('/'); return; }

		loading = true;
		space = null;
		pages = [];

		Promise.all([
			docs.getSpace(_slug),
			docs.pages(_slug)
		]).then(([s, p]) => {
			if (id !== fetchId) return;
			space = s;
			pages = p;
		}).catch(() => {
			if (id !== fetchId) return;
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	async function createPage() {
		if (!newTitle.trim() || creating) return;
		creating = true;
		try {
			const result = await docs.createPage(spaceSlug, { title: newTitle });
			newTitle = '';
			showNewPage = false;
			goto(`/docs/${spaceSlug}/${result.slug}`);
		} catch {
			// ignore
		} finally {
			creating = false;
		}
	}

	function buildTree(allPages: DocPage[]): DocPage[] {
		const map = new Map<number, DocPage>();
		const roots: DocPage[] = [];
		for (const p of allPages) {
			map.set(p.id, { ...p, children: [] });
		}
		for (const p of allPages) {
			const node = map.get(p.id)!;
			if (p.parent_id && map.has(p.parent_id)) {
				map.get(p.parent_id)!.children!.push(node);
			} else {
				roots.push(node);
			}
		}
		return roots.sort((a, b) => a.position - b.position);
	}

	const pageTree = $derived(buildTree(pages));
</script>

<PageShell maxWidth="max-w-6xl">
	{#if loading}
		<div class="py-16 flex flex-col items-center gap-3">
			<div class="w-6 h-6 border-2 rounded-full animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
		</div>
	{:else if space}
		<div class="flex flex-col gap-6">
			<!-- Header -->
			<div class="flex items-center justify-between page-header">
				<div class="flex items-center gap-3">
					<a href="/docs" class="text-sm animated-link" style="color: var(--color-primary);">Docs</a>
					<span style="color: var(--color-text-dim); opacity: 0.3;">/</span>
					<div class="flex items-center gap-2">
						{#if space.icon}
							<span class="text-lg">{space.icon}</span>
						{/if}
						<h1 class="text-xl font-bold" style="color: var(--color-text);">{space.name}</h1>
					</div>
				</div>
				<button
					class="btn-glow flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
					onclick={() => { showNewPage = !showNewPage; }}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
					New Page
				</button>
			</div>

			{#if space.description}
				<p class="text-sm" style="color: var(--color-text-dim);">{space.description}</p>
			{/if}

			{#if showNewPage}
				<div class="card p-4 flex items-center gap-3 animate-fade-up-sm">
					<input
						type="text"
						bind:value={newTitle}
						placeholder="Page title..."
						class="flex-1 px-3 py-2 text-sm rounded-lg border bg-transparent"
						style="border-color: var(--color-border); color: var(--color-text);"
						onkeydown={(e) => { if (e.key === 'Enter') createPage(); }}
					/>
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40"
						style="background: var(--color-primary);"
						disabled={!newTitle.trim() || creating}
						onclick={createPage}
					>{creating ? '...' : 'Create'}</button>
				</div>
			{/if}

			<!-- Pages grid -->
			{#if pages.length === 0}
				<div class="card p-16 text-center">
					<svg class="w-12 h-12 mx-auto mb-4 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
					<p class="text-sm" style="color: var(--color-text-dim);">No pages yet. Create your first page to start documenting.</p>
					<p class="text-xs mt-1" style="color: var(--color-text-dim); opacity: 0.5;">The editor supports vim keybindings</p>
				</div>
			{:else}
				{#snippet pageItem(p: DocPage, depth: number)}
					<a
						href="/docs/{spaceSlug}/{p.slug}"
						class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
						style="padding-left: {16 + depth * 20}px;"
						onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
						onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
					>
						<span class="text-base shrink-0">{p.icon || '📄'}</span>
						<div class="flex-1 min-w-0">
							<span class="text-sm font-medium truncate block" style="color: var(--color-text);">{p.title}</span>
							<div class="flex items-center gap-2 mt-0.5">
								<span class="text-[0.625rem]" style="color: var(--color-text-dim);">by {p.author_username}</span>
								<span class="text-[0.625rem]" style="color: var(--color-text-dim); opacity: 0.5;"><RelativeTime date={p.updated_at} /></span>
							</div>
						</div>
						{#if !p.is_published}
							<span class="text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0" style="background: var(--color-warning)10; color: var(--color-warning);">Draft</span>
						{/if}
					</a>
					{#if p.children && p.children.length > 0}
						{#each p.children as child}
							{@render pageItem(child, depth + 1)}
						{/each}
					{/if}
				{/snippet}

				<div class="card overflow-hidden divide-y" style="divide-color: var(--color-separator);">
					{#each pageTree as p}
						{@render pageItem(p, 0)}
					{/each}
				</div>
			{/if}

			<!-- Integration links -->
			{#if space.repo_owner || space.org_name}
				<div class="flex items-center gap-3 text-xs" style="color: var(--color-text-dim);">
					<span>Linked to:</span>
					{#if space.repo_owner}
						<a href="/{space.repo_owner}/{space.repo_name}" class="flex items-center gap-1 animated-link" style="color: var(--color-primary);">
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
							{space.repo_owner}/{space.repo_name}
						</a>
					{/if}
					{#if space.org_name}
						<a href="/orgs/{space.org_name}" class="flex items-center gap-1 animated-link" style="color: var(--color-primary);">
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
							{space.org_name}
						</a>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="py-20 text-center">
			<p style="color: var(--color-text-dim);">Space not found</p>
			<a href="/docs" class="text-sm animated-link mt-2 block" style="color: var(--color-primary);">Back to docs</a>
		</div>
	{/if}
</PageShell>
