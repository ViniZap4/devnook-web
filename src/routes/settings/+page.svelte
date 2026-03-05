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
	let bio = $state('');
	let location = $state('');
	let website = $state('');
	let saving = $state(false);
	let saved = $state(false);

	// Password
	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let changingPassword = $state(false);
	let passwordChanged = $state(false);
	let passwordError = $state('');

	onMount(() => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		if (userStore.user) {
			fullName = userStore.user.full_name;
			email = userStore.user.email;
			bio = userStore.user.bio || '';
			location = userStore.user.location || '';
			website = userStore.user.website || '';
		}
	});

	async function handleSave(e: Event) {
		e.preventDefault();
		saving = true;
		saved = false;
		try {
			await users.updateProfile({ full_name: fullName, email, avatar_url: '', bio, location, website });
			await userStore.fetchUser();
			saved = true;
			setTimeout(() => { saved = false; }, 3000);
		} catch {
			// ignore
		} finally {
			saving = false;
		}
	}

	async function handlePasswordChange(e: Event) {
		e.preventDefault();
		passwordError = '';
		if (newPassword !== confirmPassword) {
			passwordError = 'Passwords do not match';
			return;
		}
		if (newPassword.length < 6) {
			passwordError = 'Password must be at least 6 characters';
			return;
		}
		changingPassword = true;
		passwordChanged = false;
		try {
			await users.changePassword({ old_password: oldPassword, new_password: newPassword });
			oldPassword = ''; newPassword = ''; confirmPassword = '';
			passwordChanged = true;
			setTimeout(() => { passwordChanged = false; }, 3000);
		} catch (err) {
			passwordError = err instanceof Error ? err.message : 'Failed to change password';
		} finally {
			changingPassword = false;
		}
	}
</script>

<PageShell maxWidth="max-w-4xl">
	<div class="flex flex-col gap-8">
		<!-- Header -->
		<div class="flex items-center justify-between pb-6 border-b" style="border-color: var(--color-separator);">
			<div>
				<h1 class="text-2xl font-bold" style="color: var(--color-text);">Settings</h1>
				<p class="text-sm mt-1" style="color: var(--color-text-dim);">Manage your account and preferences</p>
			</div>
		</div>

		<!-- Profile Section -->
		<section class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
			<div>
				<h2 class="text-sm font-semibold" style="color: var(--color-text);">Public Profile</h2>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">Your profile information visible to others</p>
			</div>
			<div class="rounded-xl border p-6" style="border-color: var(--color-border); background-color: var(--color-surface);">
				<div class="flex items-center gap-4 mb-6 pb-6 border-b" style="border-color: var(--color-border);">
					<Avatar username={userStore.user?.username ?? '?'} size={56} />
					<div>
						<p class="font-semibold text-sm" style="color: var(--color-text);">@{userStore.user?.username}</p>
						<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">
							Member since {userStore.user?.created_at ? new Date(userStore.user.created_at).toLocaleDateString() : ''}
						</p>
					</div>
				</div>
				<form onsubmit={handleSave} class="flex flex-col gap-5">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label for="full-name" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Full name</label>
							<input
								id="full-name"
								type="text"
								bind:value={fullName}
								class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]"
								style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);"
							/>
						</div>
						<div>
							<label for="email" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Email</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]"
								style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);"
							/>
						</div>
					</div>
					<div>
						<label for="bio" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Bio</label>
						<textarea
							id="bio"
							bind:value={bio}
							rows={3}
							placeholder="Tell us about yourself..."
							class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)] resize-y"
							style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);"
						></textarea>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label for="location" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Location</label>
							<input
								id="location"
								type="text"
								bind:value={location}
								placeholder="City, Country"
								class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]"
								style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);"
							/>
						</div>
						<div>
							<label for="website" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Website</label>
							<input
								id="website"
								type="url"
								bind:value={website}
								placeholder="https://..."
								class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]"
								style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);"
							/>
						</div>
					</div>
					<div class="flex items-center gap-3 pt-2">
						<button
							type="submit"
							disabled={saving}
							class="px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all disabled:opacity-40 hover:brightness-110"
							style="background-color: var(--color-primary);"
						>
							{saving ? 'Saving...' : 'Save changes'}
						</button>
						{#if saved}
							<span class="text-sm font-medium animate-fade-in" style="color: var(--color-success);">Saved!</span>
						{/if}
					</div>
				</form>
			</div>
		</section>

		<!-- Password Section -->
		<section class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
			<div>
				<h2 class="text-sm font-semibold" style="color: var(--color-text);">Password</h2>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">Update your account password</p>
			</div>
			<div class="rounded-xl border p-6" style="border-color: var(--color-border); background-color: var(--color-surface);">
				<form onsubmit={handlePasswordChange} class="flex flex-col gap-4 max-w-sm">
					<div>
						<label for="old-pass" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Current password</label>
						<input id="old-pass" type="password" bind:value={oldPassword} class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);" />
					</div>
					<div>
						<label for="new-pass" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">New password</label>
						<input id="new-pass" type="password" bind:value={newPassword} class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);" />
					</div>
					<div>
						<label for="confirm-pass" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Confirm new password</label>
						<input id="confirm-pass" type="password" bind:value={confirmPassword} class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background-color: var(--color-background); color: var(--color-text);" />
					</div>
					{#if passwordError}
						<p class="text-xs" style="color: var(--color-error);">{passwordError}</p>
					{/if}
					<div class="flex items-center gap-3">
						<button type="submit" disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword} class="px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all disabled:opacity-40 hover:brightness-110" style="background-color: var(--color-primary);">{changingPassword ? 'Changing...' : 'Change password'}</button>
						{#if passwordChanged}
							<span class="text-sm font-medium animate-fade-in" style="color: var(--color-success);">Password updated!</span>
						{/if}
					</div>
				</form>
			</div>
		</section>

		<!-- SSH Keys Section -->
		<section class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
			<div>
				<h2 class="text-sm font-semibold" style="color: var(--color-text);">SSH Keys</h2>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">Authentication keys for git over SSH</p>
			</div>
			<div class="rounded-xl border p-6" style="border-color: var(--color-border); background-color: var(--color-surface);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm" style="color: var(--color-text);">Manage your SSH keys for secure git access.</p>
						<p class="text-xs mt-1" style="color: var(--color-text-dim);">SSH keys allow you to push and pull without entering your password.</p>
					</div>
					<a
						href="/settings/keys"
						class="shrink-0 px-4 py-2 text-sm font-medium rounded-xl border transition-colors hover:bg-[var(--color-surface-hover)]"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						Manage Keys
					</a>
				</div>
			</div>
		</section>

		<!-- Appearance Section -->
		<section class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
			<div>
				<h2 class="text-sm font-semibold" style="color: var(--color-text);">Appearance</h2>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">Theme and visual customization</p>
			</div>
			<div class="rounded-xl border p-6" style="border-color: var(--color-border); background-color: var(--color-surface);">
				<AppearanceSection />
			</div>
		</section>
	</div>
</PageShell>
