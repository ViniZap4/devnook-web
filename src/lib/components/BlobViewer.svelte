<script lang="ts">
	import type { BlobContent } from '$lib/types/repository';
	import Breadcrumb from './Breadcrumb.svelte';

	let { blob, owner, repo, ref }: {
		blob: BlobContent;
		owner: string;
		repo: string;
		ref: string;
	} = $props();

	const lines = $derived(blob.content ? blob.content.split('\n') : []);

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="flex flex-col gap-3">
	<Breadcrumb {owner} {repo} path={blob.path} {ref} />

	<div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
		<div class="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
			<span class="text-xs text-[var(--color-text)] opacity-50">
				{lines.length} lines · {formatSize(blob.size)}
			</span>
		</div>

		{#if blob.binary}
			<div class="p-8 text-center text-[var(--color-text)] opacity-50">
				Binary file not shown.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-xs font-mono">
					<tbody>
						{#each lines as line, i}
							<tr class="hover:bg-[var(--color-surface)]">
								<td class="px-3 py-0.5 text-right select-none opacity-30 text-[var(--color-text)] w-1 whitespace-nowrap border-r border-[var(--color-border)]">
									{i + 1}
								</td>
								<td class="px-4 py-0.5 whitespace-pre text-[var(--color-text)]">
									{line}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
