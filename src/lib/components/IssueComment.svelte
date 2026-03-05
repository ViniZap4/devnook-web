<script lang="ts">
	import type { IssueComment } from '$lib/types/issue';
	import RelativeTime from './RelativeTime.svelte';
	import MarkdownRenderer from './MarkdownRenderer.svelte';

	let { comment }: { comment: IssueComment } = $props();
</script>

<div class="rounded-lg border border-white/[0.06] overflow-hidden">
	<div class="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
		<span class="text-sm text-[var(--color-text)] font-medium">{comment.author}</span>
		<span class="text-xs text-[var(--color-text)] opacity-40">
			commented <RelativeTime date={comment.created_at} />
		</span>
	</div>
	<div class="p-4 text-[var(--color-text)]">
		<MarkdownRenderer content={comment.body} />
	</div>
</div>
