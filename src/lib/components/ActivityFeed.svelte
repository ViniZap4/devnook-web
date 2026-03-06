<script lang="ts">
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { ActivityItem } from '$lib/services/api';
	import RelativeTime from './RelativeTime.svelte';
	import Spinner from './Spinner.svelte';

	let items = $state<ActivityItem[]>([]);
	let loading = $state(true);
	let visible = $state(false);

	onMount(async () => {
		try {
			items = await users.activity();
		} catch {
			// ignore
		} finally {
			loading = false;
			requestAnimationFrame(() => { visible = true; });
		}
	});

	function icon(type: string) {
		if (type === 'issue') return { color: 'var(--color-success)', label: 'Issue', svg: '<circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/>' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', label: 'PR', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>' };
		if (type === 'release') return { color: 'var(--color-primary)', label: 'Release', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>' };
		if (type === 'star') return { color: 'var(--color-warning)', label: 'Star', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>' };
		return { color: 'var(--color-text-dim)', label: type, svg: '<circle cx="12" cy="12" r="3"/>' };
	}
</script>

<div class="card overflow-hidden">
	<div class="px-5 py-3.5 border-b flex items-center gap-2" style="border-color: var(--color-border);">
		<div class="relative">
			<div class="w-1.5 h-1.5 rounded-full" style="background-color: var(--color-success);"></div>
			<div class="absolute inset-0 w-1.5 h-1.5 rounded-full live-dot" style="background-color: var(--color-success); opacity: 0.4;"></div>
		</div>
		<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Recent Activity</h2>
	</div>

	{#if loading}
		<div class="py-8 flex flex-col items-center gap-3">
			<Spinner size="sm" />
			<span class="text-xs" style="color: var(--color-text-dim);">Loading activity...</span>
		</div>
	{:else if items.length === 0}
		<div class="py-8 text-center">
			<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">No recent activity.</p>
		</div>
	{:else}
		<div class="divide-y" style="divide-color: var(--color-border);">
			{#each items as item, i}
				{@const meta = icon(item.type)}
				<div
					class="px-5 py-3 flex items-start gap-3 transition-all duration-300 group"
					style="
						opacity: {visible ? 1 : 0};
						transform: {visible ? 'translateX(0)' : 'translateX(12px)'};
						transition-delay: {i * 50}ms;
					"
					onmouseenter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
					onmouseleave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
				>
					<div class="mt-0.5 shrink-0 transition-transform duration-200 group-hover:scale-110">
						<svg class="w-4 h-4" style="color: {meta.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							{@html meta.svg}
						</svg>
					</div>
					<div class="min-w-0 flex-1">
						<a
							href="/{item.repo_owner}/{item.repo_name}{item.number ? (item.type === 'pull_request' ? '/pulls/' : '/issues/') + item.number : ''}"
							class="text-sm font-medium truncate block animated-link"
							style="color: var(--color-text);"
						>{item.title}</a>
						<div class="flex items-center gap-1.5 mt-0.5 text-xs" style="color: var(--color-text-dim);">
							<span>{item.author}</span>
							<span style="opacity: 0.3;">·</span>
							<a href="/{item.repo_owner}/{item.repo_name}" class="animated-link">{item.repo_owner}/{item.repo_name}</a>
							<span style="opacity: 0.3;">·</span>
							<RelativeTime date={item.created_at} />
						</div>
					</div>
					<span
						class="mt-0.5 text-[0.5625rem] px-1.5 py-0.5 rounded-full font-semibold shrink-0 transition-all duration-200 group-hover:scale-105"
						style="background-color: {meta.color}15; color: {meta.color}; border: 1px solid {meta.color}20;"
					>
						{meta.label}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
