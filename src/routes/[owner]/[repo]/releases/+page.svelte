<script lang="ts">
	import { page } from '$app/stores';
	import { releases } from '$lib/services/api';
	import type { Release } from '$lib/types/release';
	import { onMount } from 'svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let items = $state<Release[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			items = await releases.list(owner, repo);
		} catch {
			items = [];
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold" style="color: var(--color-text);">Releases</h2>
		<a
			href="/{owner}/{repo}/releases/new"
			class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:brightness-110"
			style="background-color: var(--color-primary);"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
			New Release
		</a>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading releases...</div>
	{:else if items.length === 0}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
			</svg>
			<p class="text-sm font-medium mb-1" style="color: var(--color-text);">No releases yet</p>
			<p class="text-xs" style="color: var(--color-text-dim);">Create a release to publish versions of your project.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-5">
			{#each items as release, i}
				<div class="rounded-xl border p-6 relative" style="border-color: var(--color-border);">
					{#if i === 0 && !release.is_draft && !release.is_prerelease}
						<div class="absolute -top-2.5 left-4">
							<span class="text-[0.625rem] px-2.5 py-0.5 rounded-full font-medium" style="background-color: var(--color-success); color: white;">Latest</span>
						</div>
					{/if}
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex items-center gap-3 flex-wrap">
								<a href="/{owner}/{repo}/releases/{release.id}" class="text-lg font-bold hover:underline" style="color: var(--color-text);">{release.title}</a>
								<code class="text-xs px-2 py-0.5 rounded-lg" style="background: var(--color-surface-hover); color: var(--color-primary);">{release.tag_name}</code>
							</div>
							<div class="flex items-center gap-2 mt-1.5 text-xs" style="color: var(--color-text-dim);">
								<span>{release.author}</span>
								{#if release.created_at}
									<span>&middot;</span>
									<RelativeTime date={release.created_at} />
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-1.5 shrink-0">
							{#if release.is_prerelease}
								<span class="text-[0.625rem] px-2 py-0.5 rounded-full border" style="border-color: var(--color-warning); color: var(--color-warning);">Pre-release</span>
							{/if}
							{#if release.is_draft}
								<span class="text-[0.625rem] px-2 py-0.5 rounded-full border" style="border-color: var(--color-text-dim); color: var(--color-text-dim);">Draft</span>
							{/if}
						</div>
					</div>
					{#if release.body}
						<div class="mt-4 pt-4 border-t text-sm" style="border-color: var(--color-border); color: var(--color-text);">
							<MarkdownRenderer content={release.body} />
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
