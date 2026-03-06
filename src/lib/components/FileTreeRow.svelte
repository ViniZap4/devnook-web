<script lang="ts">
	import type { TreeEntry } from '$lib/types/repository';
	import FolderIcon from '$lib/assets/icons/FolderIcon.svelte';
	import FileIcon from '$lib/assets/icons/FileIcon.svelte';

	let { entry, owner, repo, ref, delay = 0 }: {
		entry: TreeEntry;
		owner: string;
		repo: string;
		ref: string;
		delay?: number;
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

<tr
	class="row-animate hover-slide transition-colors last:border-b-0 group"
	style="border-bottom: 1px solid var(--color-separator); animation-delay: {delay}s;"
	onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--color-primary) 3%, transparent)'; }}
	onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
>
	<td class="px-4 py-2.5">
		<a href={href} class="flex items-center gap-3" style="color: var(--color-text);">
			<span class="transition-transform duration-300 group-hover:scale-110">
				{#if entry.type === 'tree'}
					<FolderIcon size={16} color="var(--color-primary)" />
				{:else}
					<FileIcon size={16} />
				{/if}
			</span>
			<span class="transition-colors duration-200" style={entry.type === 'tree' ? 'color: var(--color-primary);' : ''}>
				<span class="group-hover:underline">{entry.name}</span>
			</span>
		</a>
	</td>
	<td class="px-4 py-2.5 text-right text-xs opacity-40 text-[var(--color-text)]">
		{formatSize(entry.size)}
	</td>
</tr>
