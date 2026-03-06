<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { orgs, repos as reposApi } from '$lib/services/api';
	import type { Organization, OrgMember } from '$lib/types/organization';
	import type { Repository } from '$lib/types/repository';
	import PageShell from '$lib/components/PageShell.svelte';
	import OrgHeader from '$lib/components/OrgHeader.svelte';
	import OrgMemberList from '$lib/components/OrgMemberList.svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	const orgName = $derived($page.params.name!);

	let org = $state<Organization | null>(null);
	let members = $state<OrgMember[]>([]);
	let repos = $state<Repository[]>([]);
	let loading = $state(true);

	// Create repo form
	let showCreateRepo = $state(false);
	let newRepoName = $state('');
	let newRepoDesc = $state('');
	let newRepoPrivate = $state(false);
	let creatingRepo = $state(false);
	let createRepoError = $state('');

	// Stats
	let activeTab = $state<'repos' | 'members'>('repos');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		try {
			const [orgData, membersData, reposData] = await Promise.all([
				orgs.get(orgName),
				orgs.members(orgName),
				orgs.repos(orgName)
			]);
			org = orgData;
			members = membersData;
			repos = reposData;
		} catch {
			// handled below
		} finally {
			loading = false;
		}
	});

	async function createRepo(e: Event) {
		e.preventDefault();
		if (!newRepoName.trim()) return;
		creatingRepo = true;
		createRepoError = '';
		try {
			const result = await orgs.createRepo(orgName, {
				name: newRepoName.trim(),
				description: newRepoDesc,
				is_private: newRepoPrivate
			});
			toastStore.success('Repository created successfully');
			goto(`/${orgName}/${result.name}`);
		} catch (err) {
			createRepoError = err instanceof Error ? err.message : 'Failed to create repository';
			toastStore.error(err instanceof Error ? err.message : 'Failed to create repository');
		} finally {
			creatingRepo = false;
		}
	}
</script>

<PageShell>
	{#if loading}
		<div class="flex flex-col gap-6 card-animate">
			<div class="flex items-center gap-4">
				<Skeleton width="64px" height="64px" rounded="rounded-xl" />
				<div class="flex flex-col gap-2">
					<Skeleton width="180px" height="24px" />
					<Skeleton width="120px" height="14px" />
				</div>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div class="lg:col-span-2 flex flex-col gap-3">
					{#each Array(3) as _}
						<Skeleton width="100%" height="72px" rounded="rounded-2xl" />
					{/each}
				</div>
				<Skeleton width="100%" height="200px" rounded="rounded-2xl" />
			</div>
		</div>
	{:else if org}
		<div class="flex flex-col gap-8 content-reveal">
			<!-- Header -->
			<div class="flex items-start justify-between page-header">
				<OrgHeader {org} />
				<div class="flex items-center gap-2">
					<button
						onclick={() => { showCreateRepo = !showCreateRepo; }}
						class="btn-glow flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
						style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
						New Repo
					</button>
					<a
						href="/orgs/{orgName}/settings"
						class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl glass-subtle press-scale transition-all duration-200"
						style="color: var(--color-text-dim);"
						onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; }}
						onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)'; }}
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
						Settings
					</a>
				</div>
			</div>

			<!-- Overview stats -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 card-animate stagger-1">
				<div class="stat-card p-4 text-center">
					<p class="text-2xl font-bold gradient-text">{repos.length}</p>
					<p class="text-xs mt-1" style="color: var(--color-text-dim);">Repositories</p>
				</div>
				<div class="stat-card p-4 text-center">
					<p class="text-2xl font-bold" style="color: var(--color-secondary);">{members.length}</p>
					<p class="text-xs mt-1" style="color: var(--color-text-dim);">Members</p>
				</div>
				<div class="stat-card p-4 text-center">
					<p class="text-2xl font-bold" style="color: var(--color-success);">{repos.filter(r => !r.is_private).length}</p>
					<p class="text-xs mt-1" style="color: var(--color-text-dim);">Public</p>
				</div>
				<div class="stat-card p-4 text-center">
					<p class="text-2xl font-bold" style="color: var(--color-warning);">{repos.filter(r => r.is_private).length}</p>
					<p class="text-xs mt-1" style="color: var(--color-text-dim);">Private</p>
				</div>
			</div>

			<!-- Create repo form -->
			{#if showCreateRepo}
				<form onsubmit={createRepo} class="card p-6 animate-fade-up-sm">
					<h3 class="text-sm font-semibold mb-4" style="color: var(--color-text);">Create a new repository</h3>

					{#if createRepoError}
						<div class="px-4 py-3 mb-4 text-sm rounded-xl animate-pop-in" style="background: color-mix(in srgb, var(--color-error) 8%, transparent); border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent); color: var(--color-error);">
							{createRepoError}
						</div>
					{/if}

					<div class="flex flex-col gap-4 max-w-lg">
						<div>
							<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Repository name</label>
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium" style="color: var(--color-text-dim);">{orgName} /</span>
								<input
									type="text"
									bind:value={newRepoName}
									placeholder="my-project"
									class="flex-1 px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
									style="border-color: var(--color-border); color: var(--color-text);"
									required
								/>
							</div>
						</div>
						<div>
							<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Description (optional)</label>
							<input
								type="text"
								bind:value={newRepoDesc}
								placeholder="Short description of your repository"
								class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
								style="border-color: var(--color-border); color: var(--color-text);"
							/>
						</div>

						<!-- Visibility -->
						<div class="flex items-center justify-between p-4 rounded-xl" style="border: 1px solid var(--color-border); background: color-mix(in srgb, var(--color-surface) 50%, transparent);">
							<div class="flex items-center gap-3">
								{#if newRepoPrivate}
									<svg class="w-5 h-5" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
								{:else}
									<svg class="w-5 h-5" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								{/if}
								<div>
									<p class="text-sm font-medium" style="color: var(--color-text);">{newRepoPrivate ? 'Private' : 'Public'}</p>
									<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">{newRepoPrivate ? 'Only org members can see this' : 'Anyone can see this repository'}</p>
								</div>
							</div>
							<button
								type="button"
								class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
								style="background-color: {newRepoPrivate ? 'var(--color-warning)' : 'var(--color-success)'};"
								onclick={() => { newRepoPrivate = !newRepoPrivate; }}
							>
								<span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" style="transform: translateX({newRepoPrivate ? '20px' : '0'});"></span>
							</button>
						</div>

						<div class="flex items-center gap-3">
							<button
								type="submit"
								disabled={creatingRepo || !newRepoName.trim()}
								class="btn-glow px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
								style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
							>{creatingRepo ? 'Creating...' : 'Create repository'}</button>
							<button
								type="button"
								onclick={() => { showCreateRepo = false; createRepoError = ''; }}
								class="px-4 py-2.5 text-sm rounded-xl glass-subtle transition-all hover:scale-[1.02]"
								style="color: var(--color-text-dim);"
							>Cancel</button>
						</div>
					</div>
				</form>
			{/if}

			<!-- Tab navigation -->
			<div class="flex items-center gap-1 glass-subtle rounded-xl p-1 card-animate stagger-2">
				<button
					class="flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all duration-300"
					style="
						color: {activeTab === 'repos' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {activeTab === 'repos' ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
						font-weight: {activeTab === 'repos' ? '600' : '400'};
					"
					onclick={() => { activeTab = 'repos'; }}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
					Repositories
					<span class="px-1.5 py-0.5 rounded-md text-[0.625rem] font-mono" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent);">{repos.length}</span>
				</button>
				<button
					class="flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all duration-300"
					style="
						color: {activeTab === 'members' ? 'var(--color-secondary)' : 'var(--color-text-dim)'};
						background: {activeTab === 'members' ? 'color-mix(in srgb, var(--color-secondary) 12%, transparent)' : 'transparent'};
						font-weight: {activeTab === 'members' ? '600' : '400'};
					"
					onclick={() => { activeTab = 'members'; }}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
					Members
					<span class="px-1.5 py-0.5 rounded-md text-[0.625rem] font-mono" style="background: color-mix(in srgb, var(--color-secondary) 10%, transparent);">{members.length}</span>
				</button>
			</div>

			<!-- Tab content -->
			{#if activeTab === 'repos'}
				<div class="content-reveal">
					{#if repos.length === 0}
						<div class="card p-12 text-center card-animate">
							<div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent);">
								<RepoIcon size={32} color="var(--color-primary)" />
							</div>
							<p class="text-sm font-medium" style="color: var(--color-text);">No repositories yet</p>
							<p class="text-xs mt-1 mb-4" style="color: var(--color-text-dim);">Create a repository to get started.</p>
							<button
								onclick={() => { showCreateRepo = true; }}
								class="btn-glow inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white"
								style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
								Create your first repo
							</button>
						</div>
					{:else}
						<div class="flex flex-col gap-3">
							{#each repos as repo, i}
								<a
									href="/{orgName}/{repo.name}"
									class="card-hover p-5 group card-animate hover-lift"
									style="animation-delay: {0.05 + i * 0.05}s;"
								>
									<div class="flex items-center justify-between gap-4">
										<div class="flex items-center gap-3 min-w-0">
											<div class="transition-transform duration-300 group-hover:scale-110">
												<RepoIcon size={16} color="var(--color-primary)" />
											</div>
											<span class="text-sm font-semibold group-hover:underline" style="color: var(--color-primary);">{repo.name}</span>
											{#if repo.is_private}
												<Badge label="Private" variant="warning" />
											{/if}
										</div>
										<div class="flex items-center gap-3">
											{#if repo.stars_count}
												<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
													<svg class="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
													{repo.stars_count}
												</span>
											{/if}
											<span class="text-xs shrink-0" style="color: var(--color-text-dim);">
												<RelativeTime date={repo.updated_at} />
											</span>
											<svg class="w-4 h-4 opacity-0 group-hover:opacity-40 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
										</div>
									</div>
									{#if repo.description}
										<p class="text-xs mt-1.5 ml-7" style="color: var(--color-text-dim);">{repo.description}</p>
									{/if}
									{#if repo.topics && repo.topics.length > 0}
										<div class="flex flex-wrap gap-1 mt-2 ml-7">
											{#each repo.topics.slice(0, 5) as topic}
												<span class="text-[0.5625rem] px-2 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">{topic}</span>
											{/each}
										</div>
									{/if}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="content-reveal">
					<OrgMemberList {members} />
				</div>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-20 gap-4 card-animate">
			<div class="w-16 h-16 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-error) 8%, transparent);">
				<svg class="w-8 h-8 opacity-40" style="color: var(--color-error);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
			</div>
			<p class="text-lg font-medium" style="color: var(--color-text);">Organization not found</p>
			<a href="/dashboard" class="text-sm font-medium animated-link" style="color: var(--color-primary);">Back to dashboard</a>
		</div>
	{/if}
</PageShell>
