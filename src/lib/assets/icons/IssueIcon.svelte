<script lang="ts">
	let { size = 16, color = 'currentColor', state = 'open' }: { size?: number; color?: string; state?: string } = $props();
</script>

{#if state === 'closed'}
<svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
	<path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z" />
</svg>
{:else}
<svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
	<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
	<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
</svg>
{/if}
