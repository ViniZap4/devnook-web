<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import UserBox from '$lib/components/UserBox.svelte';
	import ShortCutsBox from '$lib/components/ShortCutsBox.svelte';
	import AppearanceSection from '$lib/components/AppearanceSection.svelte';

	let ready = $state(false);

	onMount(async () => {
		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}
		await Promise.all([userStore.fetchUser(), shortcutsStore.load()]);
		ready = true;
	});
</script>

{#if ready}
	<Navbar />
	<main class="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-5">
		<UserBox />
		<ShortCutsBox />
		<AppearanceSection />
	</main>
{/if}
