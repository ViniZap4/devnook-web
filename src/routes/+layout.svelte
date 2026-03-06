<script lang="ts">
	import '../app.css';
	import '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';
	import VimMotions from '$lib/components/VimMotions.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let { children } = $props();
	let ready = $state(false);

	onMount(async () => {
		await userStore.init();
		ready = true;
	});
</script>

<NavigationProgress />

<div class="min-h-screen" style="background-color: var(--color-background);">
	{#if ready}
		{@render children()}
	{:else}
		<div class="min-h-screen flex items-center justify-center">
			<Spinner size="lg" />
		</div>
	{/if}
</div>

<CommandPalette />
<Toast />
<VimMotions />
