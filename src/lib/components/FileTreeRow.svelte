<script lang="ts">
	import type { TreeEntry } from '$lib/types/repository';
	import FolderIcon from '$lib/assets/icons/FolderIcon.svelte';
	import FileIcon from '$lib/assets/icons/FileIcon.svelte';

	let { entry, owner, repo, ref }: {
		entry: TreeEntry;
		owner: string;
		repo: string;
		ref: string;
	} = $props();

	const href = $derived(
		entry.type === 'tree'
			? `/${owner}/${repo}/tree/${ref}/${entry.path}`
			: `/${owner}/${repo}/blob/${ref}/${entry.path}`
	);

	function formatSize(bytes?: number): string {
		if (!bytes) return '';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<tr class="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors last:border-b-0">
	<td class="px-4 py-2.5">
		<a href={href} class="flex items-center gap-3" style="color: var(--color-text);">
			{#if entry.type === 'tree'}
				<FolderIcon size={16} color="var(--palette-0, #58a6ff)" />
			{:else}
				<FileIcon size={16} />
			{/if}
			<span class="hover:underline" style={entry.type === 'tree' ? 'color: var(--palette-0);' : ''}>
				{entry.name}
			</span>
		</a>
	</td>
	<td class="px-4 py-2.5 text-right text-xs opacity-40 text-[var(--color-text)]">
		{formatSize(entry.size)}
	</td>
</tr>
