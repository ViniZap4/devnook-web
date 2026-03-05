<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import IssueRow from './IssueRow.svelte';

	let { issues, owner, repo }: { issues: Issue[]; owner: string; repo: string } = $props();
</script>

<div class="rounded-lg border border-[var(--color-border)] overflow-hidden divide-y divide-white/[0.04]">
	{#each issues as issue}
		<IssueRow {issue} {owner} {repo} />
	{:else}
		<div class="p-8 text-center text-[var(--color-text)] opacity-40">
			No issues found.
		</div>
	{/each}
</div>
