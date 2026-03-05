<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { User } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import PageShell from '$lib/components/PageShell.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	const owner = $derived($page.params.owner!);

	let user = $state<User | null>(null);
	let repos = $state<Repository[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const data = await users.profile(owner);
			user = data.user;
			repos = data.repos;
		} catch (err) {
			error = err instanceof Error ? err.message : 'User not found';
		} finally {
			loading = false;
		}
	});
</script>

<PageShell>
	{#if loading}
		<div class="flex flex-col gap-6">
			<div class="flex items-center gap-4">
				<Skeleton width="80px" height="80px" rounded="rounded-full" />
				<div class="flex flex-col gap-2">
					<Skeleton width="160px" height="20px" />
					<Skeleton width="100px" height="14px" />
				</div>
			</div>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<p class="text-[var(--color-text)] opacity-50">{error}</p>
			<a href="/explore" class="text-sm hover:underline" style="color: var(--color-primary);">Explore repositories</a>
		</div>
	{:else if user}
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
			<!-- Profile sidebar -->
			<div class="lg:col-span-1">
				<div class="flex flex-col items-center lg:items-start gap-4">
					<Avatar username={user.username} size={120} />
					<div class="text-center lg:text-left">
						{#if user.full_name}
							<h1 class="text-[var(--color-text)] text-xl font-bold">{user.full_name}</h1>
						{/if}
						<p class="text-sm text-[var(--color-text)] opacity-40">@{user.username}</p>
					</div>
					{#if user.email}
						<div class="flex items-center gap-2 text-sm text-[var(--color-text)] opacity-30">
							<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809v6.442Zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z"/></svg>
							{user.email}
						</div>
					{/if}
					<p class="text-xs text-[var(--color-text)] opacity-20">
						Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</p>
				</div>
			</div>

			<!-- Repos -->
			<div class="lg:col-span-3">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50">
						Public repositories
						<span class="ml-1 px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-xs normal-case">{repos.length}</span>
					</h2>
				</div>

				{#if repos.length === 0}
					<div class="card p-12 text-center">
						<RepoIcon size={32} color="var(--color-text)" />
						<p class="text-sm text-[var(--color-text)] opacity-30 mt-4">No public repositories.</p>
					</div>
				{:else}
					<div class="flex flex-col gap-3">
						{#each repos as repo}
							<a href="/{repo.owner}/{repo.name}" class="card p-5 hover:border-[var(--color-primary)] transition-colors group">
								<div class="flex items-start justify-between gap-4">
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<RepoIcon size={16} color="var(--color-text)" />
											<span class="text-sm font-bold group-hover:underline" style="color: var(--color-primary);">{repo.name}</span>
										</div>
										{#if repo.description}
											<p class="text-sm text-[var(--color-text)] opacity-40 mt-1.5">{repo.description}</p>
										{/if}
									</div>
									<span class="text-xs text-[var(--color-text)] opacity-15 shrink-0">
										<RelativeTime date={repo.updated_at} />
									</span>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</PageShell>
