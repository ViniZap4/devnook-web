<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';

	let { username, size = 32 }: { username: string; size?: number } = $props();

	const initials = $derived(username.substring(0, 2).toUpperCase());
</script>

<div
	class="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
	style="width: {size}px; height: {size}px; font-size: {size * 0.38}px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));"
>
	{initials}
</div>
