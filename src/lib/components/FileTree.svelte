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

	// Sort: directories first, then files, alphabetically
	const sorted = $derived([...entries].sort((a, b) => {
		if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
		return a.name.localeCompare(b.name);
	}));
</script>

<div class="rounded-xl border border-white/[0.06] overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
		<span class="text-xs text-[var(--color-text)] opacity-40">
			{sorted.filter(e => e.type === 'tree').length} directories, {sorted.filter(e => e.type === 'blob').length} files
		</span>
	</div>
	<table class="w-full text-sm">
		<tbody>
			{#each sorted as entry}
				<FileTreeRow {entry} {owner} {repo} {ref} />
			{/each}
		</tbody>
	</table>
</div>
