<script lang="ts">
	import type { Commit } from '$lib/types/repository';
	import CommitIcon from '$lib/assets/icons/CommitIcon.svelte';
	import RelativeTime from './RelativeTime.svelte';

	let { commit, owner = '', repo = '' }: { commit: Commit; owner?: string; repo?: string } = $props();
</script>

<div class="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface)] transition-colors">
	<div class="flex items-center gap-3 min-w-0">
		<CommitIcon size={16} color="var(--color-text)" />
		<div class="min-w-0">
			<p class="text-sm text-[var(--color-text)] font-medium truncate">{commit.message}</p>
			<p class="text-xs text-[var(--color-text)] opacity-40 mt-0.5">
				{commit.author} · <RelativeTime date={commit.date} />
			</p>
		</div>
	</div>
	{#if owner && repo}
		<a href="/{owner}/{repo}/commits/{commit.hash}" class="text-xs px-2 py-1 rounded bg-[var(--color-surface)] shrink-0 ml-4 font-mono hover:underline" style="color: var(--color-primary);">
			{commit.short_hash}
		</a>
	{:else}
		<code class="text-xs px-2 py-1 rounded bg-[var(--color-surface)] text-[var(--color-text)] opacity-60 shrink-0 ml-4 font-mono">
			{commit.short_hash}
		</code>
	{/if}
</div>
