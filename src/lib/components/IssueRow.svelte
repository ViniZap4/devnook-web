<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import IssueIcon from '$lib/assets/icons/IssueIcon.svelte';
	import RelativeTime from './RelativeTime.svelte';

	let { issue, owner, repo }: { issue: Issue; owner: string; repo: string } = $props();
</script>

<a
	href="/{owner}/{repo}/issues/{issue.number}"
	class="flex items-start gap-3 px-5 py-3.5 hover-slide group transition-all duration-200"
	style="background: transparent;"
	onmouseenter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 4%, transparent)'; }}
	onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
>
	<div class="mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110">
		<IssueIcon
			size={16}
			state={issue.state}
			color={issue.state === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'}
		/>
	</div>
	<div class="min-w-0 flex-1">
		<span class="text-sm font-medium transition-colors duration-200" style="color: var(--color-text);">
			<span class="group-hover:underline">{issue.title}</span>
		</span>
		{#if issue.labels && issue.labels.length > 0}
			{#each issue.labels as label}
				<span
					class="inline-flex ml-1.5 text-[0.625rem] px-2 py-0.5 rounded-full align-middle font-medium transition-all duration-200 hover:scale-105"
					style="background-color: {label.color}18; color: {label.color}; border: 1px solid {label.color}30;"
				>{label.name}</span>
			{/each}
		{/if}
		<p class="text-xs mt-1 transition-colors duration-200" style="color: var(--color-text-dim);">
			#{issue.number} opened <RelativeTime date={issue.created_at} /> by {issue.author}
		</p>
	</div>
	<div class="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
		<svg class="w-4 h-4" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
	</div>
</a>
