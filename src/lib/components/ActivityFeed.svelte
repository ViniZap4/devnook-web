<script lang="ts">
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { ActivityItem } from '$lib/services/api';
	import Avatar from './Avatar.svelte';
	import Spinner from './Spinner.svelte';

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

	function meta(type: string) {
		if (type === 'issue') return { color: 'var(--color-success)', bg: 'var(--color-success-subtle)', label: 'Issue', verb: 'opened an issue' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', bg: 'var(--color-secondary-subtle, rgba(139, 92, 246, 0.15))', label: 'PR', verb: 'opened a PR' };
		if (type === 'release') return { color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)', label: 'Release', verb: 'published a release' };
		if (type === 'star') return { color: 'var(--color-warning)', bg: 'var(--color-warning-subtle)', label: 'Star', verb: 'starred' };
		if (type === 'push') return { color: 'var(--color-info)', bg: 'var(--color-info-subtle)', label: 'Push', verb: 'pushed to' };
		return { color: 'var(--color-text-dim)', bg: 'rgba(255, 255, 255, 0.06)', label: type, verb: 'acted in' };
	}

	function timeAgo(dateStr: string): string {
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = now - then;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const months = Math.floor(days / 30);
		const years = Math.floor(days / 365);

		if (seconds < 60) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 30) return `${days}d ago`;
		if (months < 12) return `${months}mo ago`;
		return `${years}y ago`;
	}
</script>

<div class="card overflow-hidden animate-fade-up">
	<div class="px-5 py-3.5 border-b flex items-center gap-2" style="border-color: var(--glass-border);">
		<div class="w-1.5 h-1.5 rounded-full" style="background-color: var(--color-success);"></div>
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
		<div>
			{#each items as item}
				{@const m = meta(item.type)}
				<div class="flex items-start gap-3 px-5 py-4" style="border-bottom: 1px solid var(--glass-border);">
					<Avatar username={item.author} size={32} />
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="text-sm font-medium" style="color: var(--color-text);">{item.author}</span>
							<span class="text-xs" style="color: var(--color-text-dim);">
								{m.verb} in
								<a href="/{item.repo_owner}/{item.repo_name}" class="font-medium hover:underline" style="color: var(--color-primary);">
									{item.repo_owner}/{item.repo_name}
								</a>
							</span>
							<span class="text-xs ml-auto shrink-0" style="color: var(--color-text-dim);">{timeAgo(item.created_at)}</span>
						</div>
						{#if item.title}
							<p class="text-sm mt-1 truncate" style="color: var(--color-text);">{item.title}</p>
						{/if}
					</div>
					<span class="shrink-0 text-[10px] px-2 py-1 rounded-full font-medium" style="background: {m.bg}; color: {m.color};">{m.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
