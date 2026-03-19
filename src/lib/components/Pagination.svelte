<script lang="ts">
	let { page = 1, totalPages, hasMore, onPageChange }: {
		page?: number;
		totalPages?: number;
		hasMore?: boolean;
		onPageChange: (page: number) => void;
	} = $props();

	const canGoNext = $derived(totalPages != null ? page < totalPages : hasMore === true);
	const shouldShow = $derived(totalPages != null ? totalPages > 1 : (page > 1 || hasMore === true));
</script>

{#if shouldShow}
<div class="flex items-center justify-center gap-3 mt-6">
	<button
		class="px-4 py-2 text-sm rounded-xl border transition-all duration-200 hover:border-[var(--color-primary-subtle)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
		style="border-color: var(--glass-border); color: var(--color-text); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
		disabled={page <= 1}
		onclick={() => onPageChange(page - 1)}
	>
		Previous
	</button>
	<span
		class="text-sm font-medium px-3 py-1 rounded-lg"
		style="color: var(--color-text-dim); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
	>
		{#if totalPages != null}
			{page} / {totalPages}
		{:else}
			Page {page}
		{/if}
	</span>
	<button
		class="px-4 py-2 text-sm rounded-xl border transition-all duration-200 hover:border-[var(--color-primary-subtle)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
		style="border-color: var(--glass-border); color: var(--color-text); background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
		disabled={!canGoNext}
		onclick={() => onPageChange(page + 1)}
	>
		Next
	</button>
</div>
{/if}
