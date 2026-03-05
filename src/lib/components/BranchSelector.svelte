<script lang="ts">
	import type { Branch } from '$lib/types/repository';
	import BranchIcon from '$lib/assets/icons/BranchIcon.svelte';

	let { branches, currentRef, owner, repo, basePath = '' }: {
		branches: Branch[];
		currentRef: string;
		owner: string;
		repo: string;
		basePath?: string;
	} = $props();

	let open = $state(false);
</script>

<div class="relative">
	<button
		class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
		onclick={() => { open = !open; }}
	>
		<BranchIcon size={14} />
		<span class="font-medium">{currentRef}</span>
		<svg class="w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="currentColor">
			<path d="M6 8.825a.5.5 0 0 1-.354-.146l-3.5-3.5a.5.5 0 1 1 .708-.708L6 7.618l3.146-3.147a.5.5 0 1 1 .708.708l-3.5 3.5A.5.5 0 0 1 6 8.825Z" />
		</svg>
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-40" onclick={() => { open = false; }} onkeydown={() => {}}></div>
		<div class="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-xl">
			<div class="p-2 border-b border-[var(--color-border)]">
				<p class="text-xs text-[var(--color-text)] opacity-50 px-2">Switch branch</p>
			</div>
			<div class="max-h-60 overflow-y-auto p-1">
				{#each branches as branch}
					<a
						href="/{owner}/{repo}{basePath ? '/' + basePath + '/' + branch.name : ''}{basePath ? '' : ''}"
						class="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors {branch.name === currentRef ? 'bg-[var(--color-surface)] font-medium' : 'hover:bg-[var(--color-surface)]'}"
						style="color: var(--color-text);"
						onclick={() => { open = false; }}
					>
						<BranchIcon size={12} />
						{branch.name}
						{#if branch.is_default}
							<span class="text-xs opacity-40 ml-auto">default</span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
