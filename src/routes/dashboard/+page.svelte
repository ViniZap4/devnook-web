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
		await shortcutsStore.load();
		ready = true;
	});
</script>

{#if ready}
<PageShell maxWidth="max-w-6xl">
	<!-- Welcome header -->
	<div class="flex items-center justify-between mb-8 pb-6 border-b" style="border-color: var(--color-separator);">
		<div class="flex items-center gap-4">
			<Avatar username={userStore.user?.username ?? '?'} size={52} />
			<div>
				<h1 class="text-xl font-bold" style="color: var(--color-text);">
					{#if userStore.user?.full_name}
						Welcome back, {userStore.user.full_name.split(' ')[0]}
					{:else}
						Welcome back
					{/if}
				</h1>
				<p class="text-sm mt-0.5" style="color: var(--color-text-dim);">@{userStore.user?.username}</p>
			</div>
		</div>
		<div class="hidden sm:flex items-center gap-2">
			<a href="/new" class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors" style="background-color: var(--color-primary); color: white;">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Repository
			</a>
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
		<div class="flex flex-col gap-6">
			<OrgsSection />
			<ShortCutsBox />
			<div class="card p-6">
				<h2 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: var(--color-text-dim);">Appearance</h2>
				<AppearanceSection />
			</div>
		</div>
	</div>
</PageShell>
{/if}
