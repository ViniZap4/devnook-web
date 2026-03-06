<script lang="ts">
	let { size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' } = $props();

	const sizes: Record<string, string> = {
		xs: 'w-4 h-4',
		sm: 'w-5 h-5',
		md: 'w-6 h-6',
		lg: 'w-8 h-8'
	};
</script>

<div
	class="{sizes[size]} border-2 rounded-full animate-spin"
	style="border-color: var(--color-border); border-top-color: var(--color-primary);"
></div>
