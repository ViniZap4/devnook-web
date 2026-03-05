<script lang="ts">
	let { width = '100%', height = '1rem', rounded = 'rounded' }: {
		width?: string;
		height?: string;
		rounded?: string;
	} = $props();
</script>

<div
	class="animate-pulse bg-white/[0.06] {rounded}"
	style="width: {width}; height: {height};"
></div>
