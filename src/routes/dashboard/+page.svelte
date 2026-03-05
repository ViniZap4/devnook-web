<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import ShortCutsBox from '$lib/components/ShortCutsBox.svelte';
	import AppearanceSection from '$lib/components/AppearanceSection.svelte';
	import ReposSection from '$lib/components/ReposSection.svelte';
	import OrgsSection from '$lib/components/OrgsSection.svelte';
	import StatsCards from '$lib/components/StatsCards.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let ready = $state(false);

	onMount(async () => {
		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}
		// User already loaded by init() — just load shortcuts
		await shortcutsStore.load();
		ready = true;
	});
</script>

{#if ready}
<PageShell>
	<!-- Welcome header -->
	<div class="flex items-center gap-4 mb-8">
		<Avatar username={userStore.user?.username ?? '?'} size={48} />
		<div>
			<h1 class="text-[var(--color-text)] text-xl font-bold">
				{#if userStore.user?.full_name}
					Welcome back, {userStore.user.full_name.split(' ')[0]}
				{:else}
					Welcome back
				{/if}
			</h1>
			<p class="text-sm text-[var(--color-text)] opacity-30">@{userStore.user?.username}</p>
		</div>
	</div>

	<!-- Stats -->
	<div class="mb-8">
		<StatsCards />
	</div>

	<!-- Two column layout -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Main column -->
		<div class="lg:col-span-2 flex flex-col gap-8">
			<ReposSection />
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-8">
			<OrgsSection />
			<ShortCutsBox />
			<AppearanceSection />
		</div>
	</div>
</PageShell>
{/if}
