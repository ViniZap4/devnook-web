<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import ShortCutsBox from '$lib/components/ShortCutsBox.svelte';
	import ReposSection from '$lib/components/ReposSection.svelte';
	import OrgsSection from '$lib/components/OrgsSection.svelte';
	import StatsCards from '$lib/components/StatsCards.svelte';
	import ActivityFeed from '$lib/components/ActivityFeed.svelte';
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

	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}
</script>

{#if ready}
<PageShell maxWidth="max-w-[1600px]">
	<!-- Welcome header -->
	<div class="flex items-center justify-between mb-10 pb-8 border-b animate-fade-up" style="border-color: var(--color-separator);">
		<div class="flex items-center gap-5">
			<div class="relative group">
				<div class="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 19%, transparent), color-mix(in srgb, var(--color-secondary) 12%, transparent)); filter: blur(8px);"></div>
				<div class="relative transition-transform duration-300 group-hover:scale-105">
					<Avatar username={userStore.user?.username ?? '?'} size={56} />
				</div>
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight" style="color: var(--color-text);">
					{#if userStore.user?.full_name}
						{getGreeting()}, {userStore.user.full_name.split(' ')[0]}
					{:else}
						{getGreeting()}
					{/if}
				</h1>
				<p class="text-sm mt-1" style="color: var(--color-text-dim);">
					@{userStore.user?.username}
					<span class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[0.625rem] font-medium" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">
						<span class="w-1.5 h-1.5 rounded-full live-dot" style="background: var(--color-success);"></span>
						Online
					</span>
				</p>
			</div>
		</div>
		<div class="hidden sm:flex items-center gap-3">
			<a href="/new" class="btn-glow flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: white;">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Repository
			</a>
		</div>
	</div>

	<!-- Stats -->
	<div class="mb-10 animate-fade-up stagger-1">
		<StatsCards />
	</div>

	<!-- Main grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
		<!-- Main column -->
		<div class="lg:col-span-8 flex flex-col gap-8 animate-fade-up stagger-2">
			<ReposSection />
			<ActivityFeed />
		</div>

		<!-- Sidebar -->
		<div class="lg:col-span-4 flex flex-col gap-6 animate-fade-up stagger-3">
			<OrgsSection />
			<ShortCutsBox />
		</div>
	</div>
</PageShell>
{/if}
