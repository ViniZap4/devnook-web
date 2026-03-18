<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import { users } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import type { User } from '$lib/services/api';
	import PageShell from '$lib/components/PageShell.svelte';
	import ShortCutsBox from '$lib/components/ShortCutsBox.svelte';
	import ReposSection from '$lib/components/ReposSection.svelte';
	import OrgsSection from '$lib/components/OrgsSection.svelte';
	import StatsCards from '$lib/components/StatsCards.svelte';
	import ActivityFeed from '$lib/components/ActivityFeed.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let ready = $state(false);
	let starredRepos = $state<Repository[]>([]);
	let starredLoading = $state(true);
	let following = $state<User[]>([]);
	let followingLoading = $state(true);

	onMount(async () => {
		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}
		await shortcutsStore.load();
		ready = true;

		// Load starred repos
		if (userStore.user?.username) {
			users.starred(userStore.user.username)
				.then((repos) => { starredRepos = repos; })
				.catch(() => {})
				.finally(() => { starredLoading = false; });

			// Load following list
			users.following(userStore.user.username)
				.then((list) => { following = list; })
				.catch(() => {})
				.finally(() => { followingLoading = false; });
		} else {
			starredLoading = false;
			followingLoading = false;
		}
	});

	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	const formattedDate = $derived.by(() => {
		const now = new Date();
		return now.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	});

	const quickActions = [
		{
			label: 'New Repository',
			href: '/new',
			icon: 'repo',
			color: '#8b5cf6'
		},
		{
			label: 'New Organization',
			href: '/orgs/new',
			icon: 'org',
			color: '#3fb950'
		},
		{
			label: 'Explore Repos',
			href: '/explore',
			icon: 'explore',
			color: '#06b6d4'
		},
		{
			label: 'Messages',
			href: '/messages',
			icon: 'message',
			color: '#e3b341'
		}
	];

	const quickLinks = $derived([
		{
			label: 'Your Profile',
			href: `/${userStore.user?.username}`,
			icon: 'profile'
		},
		{
			label: 'Your Stars',
			href: `/${userStore.user?.username}?tab=stars`,
			icon: 'star'
		},
		{
			label: 'Your Organizations',
			href: '/orgs',
			icon: 'org'
		},
		{
			label: 'Settings',
			href: '/settings',
			icon: 'settings'
		}
	]);
</script>

{#if ready}
<PageShell width="wide">
	{#snippet rightPanel()}
		<div class="flex flex-col gap-5">
			<OrgsSection />
			<ShortCutsBox />

			<!-- Quick Links -->
			<section class="animate-fade-up stagger-3">
				<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-70 mb-4">Quick Links</h2>
				<div class="card overflow-hidden">
					{#each quickLinks as link}
						<a
							href={link.href}
							class="flex items-center gap-3 px-4 py-3 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
							style="border-bottom: 1px solid var(--glass-border);"
						>
							<div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background: rgba(255, 255, 255, 0.06);">
								{#if link.icon === 'profile'}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								{:else if link.icon === 'star'}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
									</svg>
								{:else if link.icon === 'org'}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
								{:else}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								{/if}
							</div>
							<span class="text-sm text-[var(--color-text)] opacity-70 group-hover:opacity-100 transition-opacity duration-150">{link.label}</span>
							<svg class="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity duration-150" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</a>
					{/each}
				</div>
			</section>
		</div>
	{/snippet}

	<!-- Welcome header -->
	<div class="flex items-center justify-between mb-6 animate-fade-up stagger-1">
		<div class="flex items-center gap-4">
			{#if userStore.user?.username}
				<Avatar username={userStore.user.username} size={48} />
			{/if}
			<div>
				<h1 class="text-lg font-semibold" style="color: var(--color-text);">
					{getGreeting()}{#if userStore.user?.full_name}, {userStore.user.full_name.split(' ')[0]}{/if}
				</h1>
				<div class="flex items-center gap-3 mt-0.5">
					<p class="text-xs" style="color: var(--color-text-dim);">@{userStore.user?.username}</p>
					<span class="w-1 h-1 rounded-full" style="background: var(--color-text-dim); opacity: 0.3;"></span>
					<p class="text-xs" style="color: var(--color-text-dim);">{formattedDate}</p>
				</div>
			</div>
		</div>
		<div class="hidden sm:flex items-center gap-3">
			<a href="/new" class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors hover:brightness-110" style="background: var(--color-primary); color: white;">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Repository
			</a>
		</div>
	</div>

	<!-- Quick Actions Row -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up stagger-2">
		{#each quickActions as action}
			<a href={action.href} class="card-glow p-4 flex flex-col items-center gap-2.5 text-center group transition-all duration-200 hover:scale-[1.02]">
				<div
					class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
					style="background: linear-gradient(135deg, color-mix(in srgb, {action.color} 20%, transparent), color-mix(in srgb, {action.color} 5%, transparent));"
				>
					{#if action.icon === 'repo'}
						<svg class="w-5 h-5" style="color: {action.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
					{:else if action.icon === 'org'}
						<svg class="w-5 h-5" style="color: {action.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					{:else if action.icon === 'explore'}
						<svg class="w-5 h-5" style="color: {action.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					{:else}
						<svg class="w-5 h-5" style="color: {action.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
					{/if}
				</div>
				<span class="text-xs font-medium" style="color: var(--color-text-dim);">{action.label}</span>
			</a>
		{/each}
	</div>

	<StatsCards />

	<div class="mt-8 flex flex-col gap-6">
		<ReposSection />

		<!-- Following / People Section -->
		<section class="animate-fade-up stagger-4">
			<div class="card overflow-hidden">
				<div class="px-5 py-3.5 border-b flex items-center justify-between" style="border-color: var(--glass-border);">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">People</h2>
					</div>
					<a href="/explore" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--glass-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--glass-border-hover)] transition-all duration-200">
						Explore
					</a>
				</div>

				{#if followingLoading}
					<div class="p-5">
						<div class="flex items-center gap-3">
							{#each Array(5) as _}
								<div class="w-10 h-10 rounded-full animate-pulse" style="background: rgba(255, 255, 255, 0.06);"></div>
							{/each}
						</div>
					</div>
				{:else if following.length === 0}
					<div class="py-8 text-center">
						<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<p class="text-sm" style="color: var(--color-text-dim);">You're not following anyone yet.</p>
						<a href="/explore" class="inline-block mt-2 text-xs font-medium animated-link" style="color: var(--color-primary);">Discover people to follow</a>
					</div>
				{:else}
					<div class="p-5">
						<div class="flex flex-wrap gap-3">
							{#each following.slice(0, 12) as person}
								<a
									href="/{person.username}"
									class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150 hover:bg-[rgba(255,255,255,0.03)] group"
									title={person.full_name || person.username}
								>
									<Avatar username={person.username} size={40} />
									<span class="text-[11px] font-medium truncate max-w-[60px]" style="color: var(--color-text-dim);">
										{person.username}
									</span>
								</a>
							{/each}
						</div>
						{#if following.length > 12}
							<div class="mt-3 text-center">
								<a href="/{userStore.user?.username}?tab=following" class="text-xs font-medium animated-link" style="color: var(--color-primary);">
									View all {following.length} people
								</a>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</section>

		<!-- Recently Starred Repos -->
		<section class="animate-fade-up stagger-5">
			<div class="card overflow-hidden">
				<div class="px-5 py-3.5 border-b flex items-center justify-between" style="border-color: var(--glass-border);">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
						</svg>
						<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Recently Starred</h2>
					</div>
					{#if userStore.user?.username}
						<a href="/{userStore.user.username}?tab=stars" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--glass-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--glass-border-hover)] transition-all duration-200">
							View all
						</a>
					{/if}
				</div>

				{#if starredLoading}
					<div class="p-5 flex flex-col gap-3">
						{#each Array(3) as _, i}
							<div class="flex items-center gap-3" style="animation: fade-up 0.3s ease both; animation-delay: {i * 100}ms;">
								<div class="w-8 h-8 rounded-lg animate-pulse" style="background: rgba(255, 255, 255, 0.06);"></div>
								<div class="flex-1">
									<div class="h-3 rounded animate-pulse mb-1.5" style="background: rgba(255, 255, 255, 0.06); width: 60%;"></div>
									<div class="h-2.5 rounded animate-pulse" style="background: rgba(255, 255, 255, 0.06); width: 40%;"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if starredRepos.length === 0}
					<div class="py-8 text-center">
						<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
						</svg>
						<p class="text-sm" style="color: var(--color-text-dim);">No starred repositories yet.</p>
						<a href="/explore" class="inline-block mt-2 text-xs font-medium animated-link" style="color: var(--color-primary);">Explore repositories</a>
					</div>
				{:else}
					<div>
						{#each starredRepos.slice(0, 5) as repo}
							<a
								href="/{repo.owner}/{repo.name}"
								class="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
								style="border-bottom: 1px solid var(--glass-border);"
							>
								<div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: rgba(255, 255, 255, 0.06);">
									<svg class="w-4 h-4" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
									</svg>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium text-[var(--color-text)] group-hover:underline truncate">
											{repo.owner}/{repo.name}
										</span>
										{#if repo.is_private}
											<span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style="background: var(--color-warning-subtle); color: var(--color-warning);">Private</span>
										{/if}
									</div>
									{#if repo.description}
										<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">{repo.description}</p>
									{/if}
								</div>
								<div class="flex items-center gap-1 shrink-0 text-xs" style="color: var(--color-text-dim);">
									<svg class="w-3 h-3" style="color: var(--color-warning);" fill="currentColor" viewBox="0 0 24 24">
										<path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
									</svg>
									{repo.stars_count ?? 0}
								</div>
							</a>
						{/each}
					</div>
					{#if starredRepos.length > 5}
						<div class="px-5 py-3 text-center" style="border-top: 1px solid var(--glass-border);">
							<a href="/{userStore.user?.username}?tab=stars" class="text-xs font-medium animated-link" style="color: var(--color-primary);">
								View all {starredRepos.length} starred repositories
							</a>
						</div>
					{/if}
				{/if}
			</div>
		</section>

		<ActivityFeed />
	</div>

	<!-- Inline sidebar content for screens without right panel -->
	<div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 3xl:hidden">
		<OrgsSection />
		<ShortCutsBox />

		<!-- Quick Links (inline for mobile) -->
		<section>
			<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-70 mb-4">Quick Links</h2>
			<div class="card overflow-hidden">
				{#each quickLinks as link}
					<a
						href={link.href}
						class="flex items-center gap-3 px-4 py-3 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
						style="border-bottom: 1px solid var(--glass-border);"
					>
						<div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background: rgba(255, 255, 255, 0.06);">
							{#if link.icon === 'profile'}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							{:else if link.icon === 'star'}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
								</svg>
							{:else if link.icon === 'org'}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
							{:else}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							{/if}
						</div>
						<span class="text-sm text-[var(--color-text)] opacity-70 group-hover:opacity-100 transition-opacity duration-150">{link.label}</span>
					</a>
				{/each}
			</div>
		</section>
	</div>
</PageShell>
{/if}
