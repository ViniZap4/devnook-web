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

	let displayName = $state('');
	let description = $state('');
	let saving = $state(false);
	let saved = $state(false);

	let activeSection = $state<'general' | 'members' | 'danger'>('general');

	const sections = [
		{ id: 'general' as const, label: 'General', icon: 'settings' },
		{ id: 'members' as const, label: 'Members', icon: 'people' },
		{ id: 'danger' as const, label: 'Danger Zone', icon: 'danger' },
	];

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		try {
			const [org, mems] = await Promise.all([
				orgs.get(orgName),
				orgs.members(orgName)
			]);
			members = mems;
			displayName = org.display_name || '';
			description = org.description || '';
		} catch {
			// handled below
		} finally {
			loading = false;
		}
	});

	async function handleSaveOrg(e: Event) {
		e.preventDefault();
		saving = true;
		saved = false;
		try {
			await orgs.update(orgName, { display_name: displayName, description });
			saved = true;
			setTimeout(() => { saved = false; }, 3000);
		} catch {
			// ignore
		} finally {
			saving = false;
		}
	}

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

<PageShell maxWidth="max-w-5xl">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex items-center justify-between pb-5 border-b" style="border-color: var(--color-border);">
			<div>
				<h1 class="text-xl font-bold" style="color: var(--color-text);">{orgName} — Settings</h1>
				<p class="text-sm mt-1" style="color: var(--color-text-dim);">Manage organization members and settings</p>
			</div>
			<a href="/orgs/{orgName}" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">
				Back to {orgName}
			</a>
		</div>

		{#if loading}
			<div class="py-12 text-center" style="color: var(--color-text-dim);">Loading...</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
				<!-- Sidebar -->
				<nav class="flex flex-col gap-0.5">
					{#each sections as section}
						{@const active = activeSection === section.id}
						<button
							class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
							style="color: {active ? (section.id === 'danger' ? 'var(--color-error)' : 'var(--color-primary)') : 'var(--color-text-dim)'}; background: {active ? (section.id === 'danger' ? 'color-mix(in srgb, var(--color-error) 10%, transparent)' : 'color-mix(in srgb, var(--color-primary) 10%, transparent)') : 'transparent'}; font-weight: {active ? '600' : '400'};"
							onclick={() => { activeSection = section.id; }}
							onmouseenter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
							onmouseleave={(e) => { if (!active) e.currentTarget.style.background = active ? (section.id === 'danger' ? 'color-mix(in srgb, var(--color-error) 10%, transparent)' : 'color-mix(in srgb, var(--color-primary) 10%, transparent)') : 'transparent'; }}
						>
							{#if section.icon === 'settings'}
								<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
							{:else if section.icon === 'people'}
								<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
							{:else if section.icon === 'danger'}
								<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
							{/if}
							{section.label}
						</button>
					{/each}
				</nav>

				<!-- Content -->
				<div class="min-w-0">
					{#if activeSection === 'general'}
						<div class="card p-6 animate-fade-up">
							<h2 class="text-sm font-semibold mb-1" style="color: var(--color-text);">Organization Profile</h2>
							<p class="text-xs mb-6" style="color: var(--color-text-dim);">Update display name and description</p>
							<form onsubmit={handleSaveOrg} class="flex flex-col gap-5 max-w-lg">
								<div>
									<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Display name</label>
									<input
										type="text"
										bind:value={displayName}
										class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
									/>
								</div>
								<div>
									<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Description</label>
									<textarea
										bind:value={description}
										rows={3}
										class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)] resize-y"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
									></textarea>
								</div>
								<div class="flex items-center gap-3">
									<button
										type="submit"
										disabled={saving}
										class="btn-glow px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
										style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
									>{saving ? 'Saving...' : 'Save changes'}</button>
									{#if saved}
										<span class="text-sm font-medium animate-fade-in" style="color: var(--color-success);">Saved!</span>
									{/if}
								</div>
							</form>
						</div>
					{:else if activeSection === 'members'}
						<div class="card p-6 animate-fade-up">
							<div class="flex items-center justify-between mb-6">
								<div>
									<h2 class="text-sm font-semibold" style="color: var(--color-text);">Members</h2>
									<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">{members.length} member{members.length !== 1 ? 's' : ''}</p>
								</div>
								<button
									onclick={() => { showAddMember = true; }}
									class="btn-glow px-4 py-2 text-sm font-medium rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
									style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
								>
									Add member
								</button>
							</div>
							<OrgMemberList {members} onRemove={removeMember} />
						</div>
					{:else if activeSection === 'danger'}
						<div class="card p-6 animate-fade-up" style="border-color: color-mix(in srgb, var(--color-error) 30%, var(--color-border));">
							<h2 class="text-sm font-semibold mb-1" style="color: var(--color-error);">Danger Zone</h2>
							<p class="text-xs mb-6" style="color: var(--color-text-dim);">
								Deleting an organization will permanently remove all its repositories and members.
							</p>
							<div class="flex flex-col gap-3 max-w-sm">
								<input
									type="text"
									bind:value={confirmDelete}
									placeholder="Type organization name to confirm"
									class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-error)]"
									style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
								/>
								<button
									onclick={deleteOrg}
									disabled={confirmDelete !== orgName || deleting}
									class="px-4 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
								>
									{deleting ? 'Deleting...' : 'Delete this organization'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</PageShell>

<AddMemberModal open={showAddMember} onClose={() => { showAddMember = false; }} onAdd={addMember} />
