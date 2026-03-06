<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import IssueRow from './IssueRow.svelte';

	let { issues, owner, repo }: { issues: Issue[]; owner: string; repo: string } = $props();
</script>

<div class="card overflow-hidden content-reveal">
	{#each issues as issue, i}
		<div
			class="row-animate"
			style="animation-delay: {Math.min(i * 0.04, 0.4)}s; border-bottom: 1px solid var(--color-border);"
		>
			<IssueRow {issue} {owner} {repo} />
		</div>
	{:else}
		<div class="p-12 text-center" style="color: var(--color-text-dim);">
			No issues found.
		</div>
	{/each}
</div>
