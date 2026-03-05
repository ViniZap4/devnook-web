<script lang="ts">
	import '../app.css';
	import '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';

	let { children } = $props();
	let ready = $state(false);

	onMount(async () => {
		await userStore.init();
		ready = true;
	});
</script>

<div class="min-h-screen" style="background-color: var(--color-background);">
	{#if ready}
		{@render children()}
	{:else}
		<div class="min-h-screen flex items-center justify-center">
			<div class="w-8 h-8 rounded-full border-2 animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
		</div>
	{/if}
</div>

<CommandPalette />
