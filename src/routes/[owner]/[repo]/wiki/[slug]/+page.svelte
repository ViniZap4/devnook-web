<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const slug = $derived($page.params.slug!);

	let content = $state('');
	let loading = $state(true);
	let notFound = $state(false);

	onMount(async () => {
		try {
			const blob = await repos.blob(owner, repoName, 'main', `wiki/${slug}.md`);
			content = blob.content;
		} catch {
			notFound = true;
		} finally {
			loading = false;
		}
	});

	function renderMarkdown(md: string): string {
		return md
			.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2" style="color: var(--color-text);">$1</h3>')
			.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2" style="color: var(--color-text);">$1</h2>')
			.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 gradient-text">$1</h1>')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded-md text-xs font-mono" style="background: var(--color-surface-hover); color: var(--color-primary);">$1</code>')
			.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="animated-link" style="color: var(--color-primary);">$1</a>')
			.replace(/^\- (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed" style="color: var(--color-text);">$1</li>')
			.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm leading-relaxed" style="color: var(--color-text);">$1</li>')
			.replace(/\n\n/g, '<br/><br/>')
			.replace(/^(?!<[hla-z])(.*[^\n>])$/gm, '<p class="text-sm leading-relaxed" style="color: var(--color-text);">$1</p>');
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between page-header">
		<div class="flex items-center gap-2 text-sm">
			<a href="/{owner}/{repoName}/wiki" class="animated-link font-medium" style="color: var(--color-primary);">Wiki</a>
			<svg class="w-3 h-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
			<h2 class="font-bold" style="color: var(--color-text);">{slug.replace(/-/g, ' ')}</h2>
		</div>
		{#if !notFound}
			<a
				href="/{owner}/{repoName}/wiki/{slug}/edit"
				class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl glass-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
				style="color: var(--color-text-dim);"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
				Edit
			</a>
		{/if}
	</div>

	{#if loading}
		<div class="card p-6 card-animate">
			<div class="flex flex-col gap-3">
				<div class="w-1/3 h-6 skeleton-loading rounded"></div>
				<div class="w-full h-4 skeleton-loading rounded"></div>
				<div class="w-4/5 h-4 skeleton-loading rounded"></div>
				<div class="w-2/3 h-4 skeleton-loading rounded"></div>
			</div>
		</div>
	{:else if notFound}
		<div class="card p-16 text-center card-animate">
			<div class="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-warning) 8%, transparent);">
				<svg class="w-7 h-7 opacity-30" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			</div>
			<p class="text-sm font-semibold mb-1" style="color: var(--color-text);">Page not found</p>
			<p class="text-xs mb-5" style="color: var(--color-text-dim);">This wiki page doesn't exist yet.</p>
			<a
				href="/{owner}/{repoName}/wiki/new"
				class="btn-glow inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02]"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
			>
				Create this page
			</a>
		</div>
	{:else}
		<div class="card p-6 animate-fade-up">
			{@html renderMarkdown(content)}
		</div>
	{/if}
</div>
