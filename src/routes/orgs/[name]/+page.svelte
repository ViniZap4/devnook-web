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

	const orgName = $derived($page.params.name!);

	let org = $state<Organization | null>(null);
	let members = $state<OrgMember[]>([]);
	let repos = $state<Repository[]>([]);
	let loading = $state(true);

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
</script>

<PageShell>
	{#if loading}
		<div class="flex flex-col gap-6">
			<div class="flex items-center gap-4">
				<Skeleton width="64px" height="64px" rounded="rounded-xl" />
				<div class="flex flex-col gap-2">
					<Skeleton width="180px" height="24px" />
					<Skeleton width="120px" height="14px" />
				</div>
			</div>
		</div>
	{:else if org}
		<div class="flex flex-col gap-8">
			<div class="flex items-start justify-between">
				<OrgHeader {org} />
				<a
					href="/orgs/{orgName}/settings"
					class="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] opacity-50 hover:opacity-100 hover:bg-[var(--color-surface)] transition-all"
				>
					Settings
				</a>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div class="lg:col-span-2">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50">
							Repositories
							<span class="ml-1 px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-xs normal-case">{repos.length}</span>
						</h2>
					</div>
					{#if repos.length === 0}
						<div class="card p-12 text-center">
							<RepoIcon size={32} color="var(--color-text)" />
							<p class="text-sm text-[var(--color-text)] opacity-30 mt-4">No repositories yet.</p>
						</div>
					{:else}
						<div class="flex flex-col gap-3">
							{#each repos as repo}
								<a href="/{orgName}/{repo.name}" class="card p-5 hover:border-[var(--color-primary)] transition-colors group">
									<div class="flex items-center justify-between gap-4">
										<div class="flex items-center gap-3 min-w-0">
											<RepoIcon size={16} color="var(--color-text)" />
											<span class="text-sm font-semibold group-hover:underline" style="color: var(--color-primary);">{repo.name}</span>
											{#if repo.is_private}
												<Badge label="Private" variant="warning" />
											{/if}
										</div>
										<span class="text-xs text-[var(--color-text)] opacity-20 shrink-0">
											<RelativeTime date={repo.updated_at} />
										</span>
									</div>
									{#if repo.description}
										<p class="text-xs text-[var(--color-text)] opacity-30 mt-1.5 ml-7">{repo.description}</p>
									{/if}
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<div>
					<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50 mb-4">
						Members
						<span class="ml-1 px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-xs normal-case">{members.length}</span>
					</h2>
					<OrgMemberList {members} />
				</div>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<p class="text-[var(--color-text)] opacity-40 text-lg">Organization not found.</p>
			<a href="/dashboard" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">Back to dashboard</a>
		</div>
	{/if}
</PageShell>
