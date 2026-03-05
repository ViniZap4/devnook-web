<script lang="ts">
	import type { Commit } from '$lib/types/repository';
	import CommitRow from './CommitRow.svelte';

	let { commits }: { commits: Commit[] } = $props();
</script>

<div class="rounded-lg border border-[var(--color-border)] overflow-hidden divide-y divide-white/[0.04]">
	{#each commits as commit}
		<CommitRow {commit} />
	{:else}
		<div class="p-8 text-center text-[var(--color-text)] opacity-40">
			No commits yet.
		</div>
	{/each}
</div>
