<script lang="ts">
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { ActivityItem } from '$lib/services/api';
	import RelativeTime from './RelativeTime.svelte';

	let items = $state<ActivityItem[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			items = await users.activity();
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	function icon(type: string) {
		if (type === 'issue') return { color: 'var(--color-success)', label: 'Issue' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', label: 'PR' };
		if (type === 'release') return { color: 'var(--color-primary)', label: 'Release' };
		if (type === 'star') return { color: 'var(--color-warning)', label: 'Star' };
		return { color: 'var(--color-text-dim)', label: type };
	}
</script>

<div class="card overflow-hidden">
	<div class="px-5 py-3.5 border-b" style="border-color: var(--color-border);">
		<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Recent Activity</h2>
	</div>

	{#if loading}
		<div class="py-8 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
	{:else if items.length === 0}
		<div class="py-8 text-center text-sm" style="color: var(--color-text-dim);">No recent activity.</div>
	{:else}
		<div class="divide-y" style="divide-color: var(--color-border);">
			{#each items as item}
				{@const meta = icon(item.type)}
				<div class="px-5 py-3 flex items-start gap-3 hover:bg-[var(--color-surface)] transition-colors">
					<span class="mt-0.5 text-[0.625rem] px-1.5 py-0.5 rounded font-semibold shrink-0" style="background-color: {meta.color}20; color: {meta.color};">
						{meta.label}
					</span>
					<div class="min-w-0 flex-1">
						<a
							href="/{item.repo_owner}/{item.repo_name}{item.number ? (item.type === 'pull_request' ? '/pulls/' : '/issues/') + item.number : ''}"
							class="text-sm font-medium hover:underline truncate block"
							style="color: var(--color-text);"
						>{item.title}</a>
						<div class="flex items-center gap-1.5 mt-0.5 text-xs" style="color: var(--color-text-dim);">
							<span>{item.author}</span>
							<span>·</span>
							<a href="/{item.repo_owner}/{item.repo_name}" class="hover:underline">{item.repo_owner}/{item.repo_name}</a>
							<span>·</span>
							<RelativeTime date={item.created_at} />
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
