<script lang="ts">
	let { width = '100%', height = '1rem', rounded = 'rounded' }: {
		width?: string;
		height?: string;
		rounded?: string;
	} = $props();
</script>

<div
	class="animate-pulse bg-[var(--color-surface-hover)] {rounded}"
	style="width: {width}; height: {height};"
></div>
