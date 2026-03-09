<script lang="ts">
	import { page } from '$app/stores';
	import { repos } from '$lib/services/api';
	import type { Tag } from '$lib/types/repository';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let tags = $state<Tag[]>([]);
	let loading = $state(true);
	let fetchId = 0;

	$effect(() => {
		const _owner = owner;
		const _repo = repo;
		const id = ++fetchId;

		loading = true;
		repos.tags(_owner, _repo).then(t => {
			if (id !== fetchId) return;
			tags = t;
		}).catch(() => {
			if (id !== fetchId) return;
			tags = [];
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center gap-1 rounded-xl border p-1 self-start" style="border-color: var(--color-border);">
		<a
			href="/{owner}/{repo}/branches"
			class="px-4 py-2 text-sm rounded-lg transition-colors"
			style="color: var(--color-text-dim);"
		>
			<span class="flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
				Branches
			</span>
		</a>
		<a
			href="/{owner}/{repo}/tags"
			class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
			style="background-color: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);"
		>
			<span class="flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
				Tags
			</span>
		</a>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading tags...</div>
	{:else if tags.length === 0}
		<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">No tags yet.</p>
		</div>
	{:else}
		<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
			{#each tags as tag, i}
				<div class="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--color-surface)] {i > 0 ? 'border-t' : ''}" style="border-color: var(--color-border);">
					<div class="flex items-center gap-3">
						<svg class="w-4 h-4 shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
						</svg>
						<div>
							<span class="font-medium text-sm" style="color: var(--color-text);">{tag.name}</span>
							{#if tag.message}
								<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">{tag.message}</p>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-3 text-xs shrink-0" style="color: var(--color-text-dim);">
						<code class="px-2 py-0.5 rounded-lg" style="background: var(--color-surface-hover);">{tag.hash?.slice(0, 7)}</code>
						{#if tag.date}
							<RelativeTime date={tag.date} />
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
