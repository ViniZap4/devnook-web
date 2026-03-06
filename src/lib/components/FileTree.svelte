<script lang="ts">
	import type { TreeEntry } from '$lib/types/repository';
	import FileTreeRow from './FileTreeRow.svelte';

	let { entries, owner, repo, ref, currentPath = '' }: {
		entries: TreeEntry[];
		owner: string;
		repo: string;
		ref: string;
		currentPath?: string;
	} = $props();

	const sorted = $derived([...entries].sort((a, b) => {
		if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
		return a.name.localeCompare(b.name);
	}));
</script>

<div class="card overflow-hidden content-reveal">
	<div
		class="flex items-center justify-between px-4 py-2.5 glass-subtle"
		style="border-bottom: 1px solid var(--color-border);"
	>
		<span class="text-xs font-medium" style="color: var(--color-text-dim);">
			<span style="color: var(--color-primary);">{sorted.filter(e => e.type === 'tree').length}</span> directories,
			<span style="color: var(--color-secondary);">{sorted.filter(e => e.type === 'blob').length}</span> files
		</span>
	</div>
	<table class="w-full text-sm">
		<tbody>
			{#each sorted as entry, i}
				<FileTreeRow {entry} {owner} {repo} {ref} delay={Math.min(i * 0.03, 0.3)} />
			{/each}
		</tbody>
	</table>
</div>
