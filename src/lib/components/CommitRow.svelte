<script lang="ts">
	import type { Commit } from '$lib/types/repository';
	import CommitIcon from '$lib/assets/icons/CommitIcon.svelte';
	import RelativeTime from './RelativeTime.svelte';

	let { commit }: { commit: Commit } = $props();
</script>

<div class="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface)] transition-colors">
	<div class="flex items-center gap-3 min-w-0">
		<CommitIcon size={16} color="var(--color-text)" />
		<div class="min-w-0">
			<p class="text-sm text-[var(--color-text)] font-medium truncate">{commit.message}</p>
			<p class="text-xs text-[var(--color-text)] opacity-40 mt-0.5">
				{commit.author} · <RelativeTime date={commit.date} />
			</p>
		</div>
	</div>
	<code class="text-xs px-2 py-1 rounded bg-[var(--color-surface)] text-[var(--color-text)] opacity-60 shrink-0 ml-4 font-mono">
		{commit.short_hash}
	</code>
</div>
