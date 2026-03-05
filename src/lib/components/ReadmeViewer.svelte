<script lang="ts">
	import MarkdownRenderer from './MarkdownRenderer.svelte';
	import FileIcon from '$lib/assets/icons/FileIcon.svelte';

	let { name, content }: { name: string; content: string } = $props();
</script>

<div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
	<div class="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
		<FileIcon size={14} />
		<span class="text-sm text-[var(--color-text)] font-medium">{name}</span>
	</div>
	<div class="p-6 text-[var(--color-text)]">
		<MarkdownRenderer {content} />
	</div>
</div>
