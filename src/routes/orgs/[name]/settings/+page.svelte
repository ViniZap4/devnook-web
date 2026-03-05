<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { orgs } from '$lib/services/api';
	import type { OrgMember } from '$lib/types/organization';
	import PageShell from '$lib/components/PageShell.svelte';
	import OrgMemberList from '$lib/components/OrgMemberList.svelte';
	import AddMemberModal from '$lib/components/AddMemberModal.svelte';

	const orgName = $derived($page.params.name!);

	let members = $state<OrgMember[]>([]);
	let loading = $state(true);
	let showAddMember = $state(false);
	let confirmDelete = $state('');
	let deleting = $state(false);

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		try {
			members = await orgs.members(orgName);
		} catch {
			// handled below
		} finally {
			loading = false;
		}
	});

	async function addMember(username: string) {
		await orgs.addMember(orgName, { username });
		members = await orgs.members(orgName);
	}

	async function removeMember(username: string) {
		await orgs.removeMember(orgName, username);
		members = members.filter((m) => m.username !== username);
	}

	async function deleteOrg() {
		if (confirmDelete !== orgName) return;
		deleting = true;
		try {
			await orgs.remove(orgName);
			goto('/dashboard');
		} catch {
			deleting = false;
		}
	}
</script>

<PageShell maxWidth="max-w-3xl">
	<div class="flex items-center justify-between mb-8 pb-6 border-b border-[var(--color-border)]">
		<div>
			<h1 class="text-[var(--color-text)] text-xl font-bold">{orgName} — Settings</h1>
			<p class="text-sm text-[var(--color-text)] opacity-30 mt-1">Manage organization members and settings</p>
		</div>
		<a href="/orgs/{orgName}" class="text-sm hover:underline" style="color: var(--color-primary);">
			Back to {orgName}
		</a>
	</div>

	{#if loading}
		<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
	{:else}
		<div class="flex flex-col gap-10">
			<!-- Members -->
			<section>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50">Members</h2>
					<button
						onclick={() => { showAddMember = true; }}
						class="px-3 py-1.5 text-xs font-medium rounded-lg text-white"
						style="background-color: var(--color-primary);"
					>
						Add member
					</button>
				</div>
				<OrgMemberList {members} onRemove={removeMember} />
			</section>

			<!-- Danger Zone -->
			<section>
				<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider text-red-400 opacity-70 mb-4">Danger Zone</h2>
				<div class="rounded-xl border border-red-500/20 p-6">
					<p class="text-sm text-[var(--color-text)] opacity-50 mb-4">
						Deleting an organization will permanently remove all its repositories and members.
					</p>
					<div class="flex flex-col gap-3 max-w-sm">
						<input
							type="text"
							bind:value={confirmDelete}
							placeholder="Type organization name to confirm"
							class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-20"
						/>
						<button
							onclick={deleteOrg}
							disabled={confirmDelete !== orgName || deleting}
							class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
						>
							{deleting ? 'Deleting...' : 'Delete this organization'}
						</button>
					</div>
				</div>
			</section>
		</div>
	{/if}
</PageShell>

<AddMemberModal open={showAddMember} onClose={() => { showAddMember = false; }} onAdd={addMember} />
