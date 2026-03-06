<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { users } from '$lib/services/api';
	import PageShell from '$lib/components/PageShell.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import AppearanceSection from '$lib/components/AppearanceSection.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

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

	// Status
	let statusEmoji = $state('');
	let statusMessage = $state('');
	let statusBusy = $state(false);
	let savingStatus = $state(false);

	let activeSection = $state<'profile' | 'status' | 'password' | 'ssh' | 'appearance'>('profile');

	const sections = [
		{ id: 'profile' as const, label: 'Public Profile', icon: 'user' },
		{ id: 'status' as const, label: 'Status', icon: 'status' },
		{ id: 'password' as const, label: 'Password', icon: 'lock' },
		{ id: 'ssh' as const, label: 'SSH Keys', icon: 'key' },
		{ id: 'appearance' as const, label: 'Appearance', icon: 'palette' },
	];

	const statusPresets = [
		{ emoji: '🏠', message: 'Working from home' },
		{ emoji: '🚀', message: 'Shipping code' },
		{ emoji: '🎯', message: 'Focusing' },
		{ emoji: '🌴', message: 'On vacation' },
		{ emoji: '🤒', message: 'Out sick' },
		{ emoji: '⛔', message: 'Do not disturb', busy: true },
	];

	onMount(() => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		if (userStore.user) {
			fullName = userStore.user.full_name;
			email = userStore.user.email;
			bio = userStore.user.bio || '';
			location = userStore.user.location || '';
			website = userStore.user.website || '';
			// Load current status
			users.getStatus(userStore.user.username).then(s => {
				statusEmoji = s.emoji || '';
				statusMessage = s.message || '';
				statusBusy = s.busy || false;
			}).catch(() => {});
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
			toastStore.success('Profile updated');
			setTimeout(() => { saved = false; }, 3000);
		} catch {
			toastStore.error('Failed to update profile');
		} finally {
			saving = false;
		}
	}

	async function handleStatusSave() {
		savingStatus = true;
		try {
			await users.setStatus({ emoji: statusEmoji, message: statusMessage, busy: statusBusy });
			toastStore.success('Status updated');
		} catch {
			toastStore.error('Failed to update status');
		} finally {
			savingStatus = false;
		}
	}

	async function handleStatusClear() {
		savingStatus = true;
		try {
			await users.clearStatus();
			statusEmoji = '';
			statusMessage = '';
			statusBusy = false;
			toastStore.success('Status cleared');
		} catch {
			toastStore.error('Failed to clear status');
		} finally {
			savingStatus = false;
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
			toastStore.success('Password changed');
			setTimeout(() => { passwordChanged = false; }, 3000);
		} catch (err) {
			passwordError = err instanceof Error ? err.message : 'Failed to change password';
		} finally {
			changingPassword = false;
		}
	}
</script>

<PageShell maxWidth="max-w-5xl">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex items-center justify-between pb-5 border-b animate-fade-up" style="border-color: var(--color-separator);">
			<div>
				<h1 class="text-2xl font-bold gradient-text">Settings</h1>
				<p class="text-sm mt-1" style="color: var(--color-text-dim);">Manage your account and preferences</p>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
			<!-- Sidebar -->
			<nav class="flex flex-col gap-0.5">
				{#each sections as section}
					{@const active = activeSection === section.id}
					<button
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
						style="color: {active ? 'var(--color-primary)' : 'var(--color-text-dim)'}; background: {active ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'}; font-weight: {active ? '600' : '400'};"
						onclick={() => { activeSection = section.id; }}
						onmouseenter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
						onmouseleave={(e) => { if (!active) e.currentTarget.style.background = active ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'; }}
					>
						{#if section.icon === 'user'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
						{:else if section.icon === 'status'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						{:else if section.icon === 'lock'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
						{:else if section.icon === 'key'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
						{:else if section.icon === 'palette'}
							<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
						{/if}
						{section.label}
					</button>
				{/each}
			</nav>

			<!-- Content -->
			<div class="min-w-0">
				{#if activeSection === 'profile'}
					<div class="card p-6 animate-fade-up">
						<div class="flex items-center gap-4 mb-6 pb-6 border-b" style="border-color: var(--color-border);">
							<div class="relative group">
								<div class="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style="background: linear-gradient(135deg, var(--color-primary)30, var(--color-secondary)20); filter: blur(8px);"></div>
								<div class="relative">
									<Avatar username={userStore.user?.username ?? '?'} size={56} />
								</div>
							</div>
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
										class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
									/>
								</div>
								<div>
									<label for="email" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Email</label>
									<input
										id="email"
										type="email"
										bind:value={email}
										class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
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
									class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)] resize-y"
									style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
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
										class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
									/>
								</div>
								<div>
									<label for="website" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Website</label>
									<input
										id="website"
										type="url"
										bind:value={website}
										placeholder="https://..."
										class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
									/>
								</div>
							</div>
							<div class="flex items-center gap-3 pt-2">
								<button
									type="submit"
									disabled={saving}
									class="btn-glow px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
									style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
								>
									{saving ? 'Saving...' : 'Save changes'}
								</button>
								{#if saved}
									<span class="text-sm font-medium animate-fade-in" style="color: var(--color-success);">Saved!</span>
								{/if}
							</div>
						</form>
					</div>
				{:else if activeSection === 'status'}
					<div class="card p-6 animate-fade-up">
						<h2 class="text-sm font-semibold mb-1" style="color: var(--color-text);">Your Status</h2>
						<p class="text-xs mb-6" style="color: var(--color-text-dim);">Let others know what you're up to. Set "Busy" to indicate you may not respond quickly.</p>

						<!-- Current status preview -->
						{#if statusEmoji || statusMessage}
							<div class="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-xl" style="background: color-mix(in srgb, var(--color-surface) 60%, transparent); border: 1px solid var(--color-border);">
								{#if statusEmoji}<span class="text-lg">{statusEmoji}</span>{/if}
								<span class="text-sm" style="color: var(--color-text);">{statusMessage || 'No message'}</span>
								{#if statusBusy}
									<span class="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-medium ml-auto" style="background: color-mix(in srgb, var(--color-warning) 15%, transparent); color: var(--color-warning);">Busy</span>
								{/if}
							</div>
						{/if}

						<!-- Presets -->
						<div class="mb-5">
							<p class="text-xs font-medium mb-2.5" style="color: var(--color-text-dim);">Quick presets</p>
							<div class="flex flex-wrap gap-1.5">
								{#each statusPresets as preset}
									<button
										class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:scale-[1.02]"
										style="border: 1px solid var(--color-border); color: var(--color-text); background: {statusMessage === preset.message ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent'};"
										onclick={() => { statusEmoji = preset.emoji; statusMessage = preset.message; statusBusy = preset.busy || false; }}
									>
										<span>{preset.emoji}</span>
										{preset.message}
									</button>
								{/each}
							</div>
						</div>

						<!-- Custom status form -->
						<div class="flex flex-col gap-4 max-w-md">
							<div class="grid grid-cols-[64px_1fr] gap-3">
								<div>
									<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Emoji</label>
									<input
										type="text"
										bind:value={statusEmoji}
										placeholder="😊"
										maxlength="2"
										class="w-full px-3 py-2.5 text-sm text-center rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); color: var(--color-text);"
									/>
								</div>
								<div>
									<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">What's happening?</label>
									<input
										type="text"
										bind:value={statusMessage}
										placeholder="Working on something cool..."
										maxlength="80"
										class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
										style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);"
									/>
								</div>
							</div>

							<!-- Busy toggle -->
							<label class="flex items-center gap-3 cursor-pointer">
								<div class="relative">
									<input type="checkbox" bind:checked={statusBusy} class="sr-only peer" />
									<div class="w-9 h-5 rounded-full transition-colors duration-200 peer-checked:bg-[var(--color-warning)]" style="background: var(--color-border);"></div>
									<div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4"></div>
								</div>
								<div>
									<span class="text-sm font-medium" style="color: var(--color-text);">Do not disturb</span>
									<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Others will see that you may be slow to respond</p>
								</div>
							</label>

							<div class="flex items-center gap-3 pt-2">
								<button
									onclick={handleStatusSave}
									disabled={savingStatus}
									class="btn-glow px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
									style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
								>{savingStatus ? 'Saving...' : 'Set status'}</button>
								{#if statusEmoji || statusMessage}
									<button
										onclick={handleStatusClear}
										disabled={savingStatus}
										class="px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 hover:scale-[1.02]"
										style="border-color: var(--color-border); color: var(--color-text-dim);"
									>Clear status</button>
								{/if}
							</div>
						</div>
					</div>
				{:else if activeSection === 'password'}
					<div class="card p-6 animate-fade-up">
						<h2 class="text-sm font-semibold mb-1" style="color: var(--color-text);">Change Password</h2>
						<p class="text-xs mb-6" style="color: var(--color-text-dim);">Update your account password</p>
						<form onsubmit={handlePasswordChange} class="flex flex-col gap-4 max-w-sm">
							<div>
								<label for="old-pass" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Current password</label>
								<input id="old-pass" type="password" bind:value={oldPassword} class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);" />
							</div>
							<div>
								<label for="new-pass" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">New password</label>
								<input id="new-pass" type="password" bind:value={newPassword} class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);" />
							</div>
							<div>
								<label for="confirm-pass" class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Confirm new password</label>
								<input id="confirm-pass" type="password" bind:value={confirmPassword} class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-background) 80%, transparent); backdrop-filter: blur(8px); color: var(--color-text);" />
							</div>
							{#if passwordError}
								<p class="text-xs animate-fade-in" style="color: var(--color-error);">{passwordError}</p>
							{/if}
							<div class="flex items-center gap-3">
								<button
									type="submit"
									disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
									class="btn-glow px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
									style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
								>{changingPassword ? 'Changing...' : 'Change password'}</button>
								{#if passwordChanged}
									<span class="text-sm font-medium animate-fade-in" style="color: var(--color-success);">Password updated!</span>
								{/if}
							</div>
						</form>
					</div>
				{:else if activeSection === 'ssh'}
					<div class="card p-6 animate-fade-up">
						<h2 class="text-sm font-semibold mb-1" style="color: var(--color-text);">SSH Keys</h2>
						<p class="text-xs mb-6" style="color: var(--color-text-dim);">Authentication keys for git over SSH</p>
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm" style="color: var(--color-text);">Manage your SSH keys for secure git access.</p>
								<p class="text-xs mt-1" style="color: var(--color-text-dim);">SSH keys allow you to push and pull without entering your password.</p>
							</div>
							<a
								href="/settings/keys"
								class="shrink-0 px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
								style="border-color: var(--color-border); color: var(--color-text); background: color-mix(in srgb, var(--color-surface) 60%, transparent);"
								onmouseenter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
								onmouseleave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
							>
								Manage Keys
							</a>
						</div>
					</div>
				{:else if activeSection === 'appearance'}
					<div class="card p-6 animate-fade-up">
						<h2 class="text-sm font-semibold mb-1" style="color: var(--color-text);">Appearance</h2>
						<p class="text-xs mb-6" style="color: var(--color-text-dim);">Theme and visual customization</p>
						<AppearanceSection />
					</div>
				{/if}
			</div>
		</div>
	</div>
</PageShell>
