<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { users } from '$lib/services/api';
	import PageShell from '$lib/components/PageShell.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import AppearanceSection from '$lib/components/AppearanceSection.svelte';

	let fullName = $state('');
	let email = $state('');
	let saving = $state(false);
	let saved = $state(false);

	onMount(() => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		// User already loaded by init()
		if (userStore.user) {
			fullName = userStore.user.full_name;
			email = userStore.user.email;
		}
	});

	async function handleSave(e: Event) {
		e.preventDefault();
		saving = true;
		saved = false;
		try {
			await users.updateProfile({ full_name: fullName, email, avatar_url: '' });
			await userStore.fetchUser();
			saved = true;
			setTimeout(() => { saved = false; }, 3000);
		} catch {
			// ignore
		} finally {
			saving = false;
		}
	}
</script>

<PageShell maxWidth="max-w-3xl">
	<div class="flex flex-col gap-10">
		<div>
			<h1 class="text-[var(--color-text)] text-2xl font-bold">Settings</h1>
			<p class="text-sm text-[var(--color-text)] opacity-40 mt-1">Manage your account and preferences</p>
		</div>

		<!-- Profile -->
		<section>
			<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50 mb-4">Profile</h2>
			<div class="card p-6">
				<div class="flex items-center gap-4 mb-6">
					<Avatar username={userStore.user?.username ?? '?'} size={56} />
					<div>
						<p class="text-[var(--color-text)] font-semibold">@{userStore.user?.username}</p>
						<p class="text-xs text-[var(--color-text)] opacity-30">
							Member since {userStore.user?.created_at ? new Date(userStore.user.created_at).toLocaleDateString() : ''}
						</p>
					</div>
				</div>
				<form onsubmit={handleSave} class="flex flex-col gap-4 max-w-md">
					<div>
						<label for="full-name" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Full name</label>
						<input
							id="full-name"
							type="text"
							bind:value={fullName}
							class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-primary)] transition-colors"
						/>
					</div>
					<div>
						<label for="email" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-primary)] transition-colors"
						/>
					</div>
					<div class="flex items-center gap-3">
						<button
							type="submit"
							disabled={saving}
							class="px-5 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
							style="background-color: var(--color-primary);"
						>
							{saving ? 'Saving...' : 'Save changes'}
						</button>
						{#if saved}
							<span class="text-sm text-green-400 animate-fade-in">Saved!</span>
						{/if}
					</div>
				</form>
			</div>
		</section>

		<!-- Appearance -->
		<section>
			<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50 mb-4">Appearance</h2>
			<div class="card p-6">
				<AppearanceSection />
			</div>
		</section>
	</div>
</PageShell>
