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

<tr class="border-b border-[var(--color-separator)] hover:bg-[var(--color-surface)] transition-colors last:border-b-0">
	<td class="px-4 py-2.5">
		<a href={href} class="flex items-center gap-3" style="color: var(--color-text);">
			{#if entry.type === 'tree'}
				<FolderIcon size={16} color="var(--color-primary)" />
			{:else}
				<FileIcon size={16} />
			{/if}
			<span class="hover:underline" style={entry.type === 'tree' ? 'color: var(--color-primary);' : ''}>
				{entry.name}
			</span>
		</a>
	</td>
	<td class="px-4 py-2.5 text-right text-xs opacity-40 text-[var(--color-text)]">
		{formatSize(entry.size)}
	</td>
</tr>
