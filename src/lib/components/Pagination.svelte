<script lang="ts">
	let { page = 1, hasMore = false, onPageChange }: {
		page?: number;
		hasMore?: boolean;
		onPageChange: (page: number) => void;
	} = $props();
</script>

{#if page > 1 || hasMore}
<div class="flex items-center justify-center gap-3 mt-6">
	<button
		class="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
		disabled={page <= 1}
		onclick={() => onPageChange(page - 1)}
	>
		Previous
	</button>
	<span class="text-sm text-[var(--color-text)] opacity-50">Page {page}</span>
	<button
		class="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
		disabled={!hasMore}
		onclick={() => onPageChange(page + 1)}
	>
		Next
	</button>
</div>
{/if}
