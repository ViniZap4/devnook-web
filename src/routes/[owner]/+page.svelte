<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { User } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import type { Organization } from '$lib/types/organization';
	import PageShell from '$lib/components/PageShell.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	const owner = $derived($page.params.owner!);

	let user = $state<User | null>(null);
	let repos = $state<Repository[]>([]);
	let starredRepos = $state<Repository[]>([]);
	let orgs = $state<Organization[]>([]);
	let loading = $state(true);
	let error = $state('');
	let tab = $state<'repos' | 'starred' | 'orgs'>('repos');

	onMount(async () => {
		try {
			const data = await users.profile(owner);
			user = data.user;
			repos = data.repos;
			orgs = data.orgs || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'User not found';
		} finally {
			loading = false;
		}
	});

	async function loadStarred() {
		if (starredRepos.length > 0) return;
		try {
			starredRepos = await users.starred(owner);
		} catch {
			// ignore
		}
	}

	function switchTab(t: 'repos' | 'starred' | 'orgs') {
		tab = t;
		if (t === 'starred') loadStarred();
	}

	const displayedRepos = $derived(tab === 'repos' ? repos : starredRepos);
</script>

<PageShell maxWidth="max-w-6xl">
	{#if loading}
		<div class="flex flex-col gap-6">
			<div class="flex items-center gap-4">
				<Skeleton width="96px" height="96px" rounded="rounded-full" />
				<div class="flex flex-col gap-2">
					<Skeleton width="160px" height="20px" />
					<Skeleton width="100px" height="14px" />
				</div>
			</div>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<svg class="w-16 h-16 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
			</svg>
			<p class="text-lg" style="color: var(--color-text-dim);">{error}</p>
			<a href="/explore" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">Explore repositories</a>
		</div>
	{:else if user}
		<div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
			<!-- Profile sidebar -->
			<aside class="flex flex-col gap-5">
				<div class="flex items-center lg:flex-col lg:items-start gap-5">
					<Avatar username={user.username} size={96} />
					<div>
						{#if user.full_name}
							<h1 class="text-xl font-bold" style="color: var(--color-text);">{user.full_name}</h1>
						{/if}
						<p class="text-sm" style="color: var(--color-text-dim);">@{user.username}</p>
					</div>
				</div>

				{#if user.bio}
					<p class="text-sm" style="color: var(--color-text);">{user.bio}</p>
				{/if}

				<div class="flex flex-col gap-2.5">
					{#if user.location}
						<div class="flex items-center gap-2 text-sm" style="color: var(--color-text-dim);">
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
							{user.location}
						</div>
					{/if}
					{#if user.email}
						<div class="flex items-center gap-2 text-sm" style="color: var(--color-text-dim);">
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
							{user.email}
						</div>
					{/if}
					{#if user.website}
						<div class="flex items-center gap-2 text-sm" style="color: var(--color-text-dim);">
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
							<a href={user.website} target="_blank" rel="noopener noreferrer" class="hover:underline" style="color: var(--color-primary);">{user.website.replace(/^https?:\/\//, '')}</a>
						</div>
					{/if}
					<div class="flex items-center gap-2 text-xs pt-1" style="color: var(--color-text-dim); opacity: 0.6;">
						<svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
						Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</div>
				</div>
			</aside>

			<!-- Repos -->
			<div>
				<div class="flex items-center gap-1 mb-5 pb-4 border-b rounded-xl border p-1 self-start" style="border-color: var(--color-border);">
					<button
						class="px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
						style="{tab === 'repos' ? 'background-color: var(--color-primary)10; color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
						onclick={() => switchTab('repos')}
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
						Repositories
						<span class="text-xs px-1.5 py-0.5 rounded-full" style="background: var(--color-surface);">{repos.length}</span>
					</button>
					<button
						class="px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
						style="{tab === 'starred' ? 'background-color: var(--color-primary)10; color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
						onclick={() => switchTab('starred')}
					>
						<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
						Starred
					</button>
					{#if orgs.length > 0}
						<button
							class="px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
							style="{tab === 'orgs' ? 'background-color: var(--color-primary)10; color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
							onclick={() => switchTab('orgs')}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
							Organizations
							<span class="text-xs px-1.5 py-0.5 rounded-full" style="background: var(--color-surface);">{orgs.length}</span>
						</button>
					{/if}
				</div>

				{#if tab === 'orgs'}
				{#if orgs.length === 0}
					<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
						<p class="text-sm" style="color: var(--color-text-dim);">No organizations.</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each orgs as org}
							<a href="/orgs/{org.name}" class="card p-4 hover:bg-[var(--color-surface)] transition-colors">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style="background: var(--color-primary)15; color: var(--color-primary);">
										{org.name.charAt(0).toUpperCase()}
									</div>
									<div class="min-w-0">
										<p class="text-sm font-semibold truncate" style="color: var(--color-text);">{org.display_name || org.name}</p>
										{#if org.description}
											<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">{org.description}</p>
										{/if}
									</div>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			{:else if displayedRepos.length === 0}
					<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
						<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
						<p class="text-sm" style="color: var(--color-text-dim);">
							{tab === 'repos' ? 'No public repositories.' : 'No starred repositories.'}
						</p>
					</div>
				{:else}
					<div class="rounded-xl border overflow-hidden divide-y" style="border-color: var(--color-border); --tw-divide-opacity: 1; divide-color: var(--color-border);">
						{#each displayedRepos as repo}
							<a href="/{repo.owner}/{repo.name}" class="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-surface)] group">
								<div class="shrink-0 mt-0.5 opacity-40 group-hover:opacity-70 transition-opacity">
									{#if repo.is_private}
										<LockIcon size={16} />
									{:else}
										<RepoIcon size={16} />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="text-sm font-semibold group-hover:underline" style="color: var(--color-primary);">{repo.name}</span>
										{#if repo.is_private}
											<span class="text-[0.5625rem] px-1.5 py-0.5 rounded-full border border-yellow-500/20 text-yellow-500/60">Private</span>
										{/if}
									</div>
									{#if repo.description}
										<p class="text-sm mt-1" style="color: var(--color-text-dim);">{repo.description}</p>
									{/if}
									<div class="flex items-center gap-3 mt-2">
										{#if repo.stars_count}
											<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
												<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
												{repo.stars_count}
											</span>
										{/if}
										<span class="text-xs" style="color: var(--color-text-dim); opacity: 0.6;">
											Updated <RelativeTime date={repo.updated_at} />
										</span>
									</div>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</PageShell>
