<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import IssueIcon from '$lib/assets/icons/IssueIcon.svelte';
	import RelativeTime from './RelativeTime.svelte';

	let { issue, owner, repo }: { issue: Issue; owner: string; repo: string } = $props();
</script>

<a href="/{owner}/{repo}/issues/{issue.number}" class="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
	<div class="mt-0.5">
		<IssueIcon
			size={16}
			state={issue.state}
			color={issue.state === 'open' ? '#3fb950' : '#8b949e'}
		/>
	</div>
	<div class="min-w-0 flex-1">
		<p class="text-sm font-medium text-[var(--color-text)] hover:underline">{issue.title}</p>
		<p class="text-xs text-[var(--color-text)] opacity-40 mt-0.5">
			#{issue.number} opened <RelativeTime date={issue.created_at} /> by {issue.author}
		</p>
	</div>
</a>
