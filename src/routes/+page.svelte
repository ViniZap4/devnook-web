<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	let mode = $state<'loading' | 'setup' | 'login'>('loading');
	let error = $state('');
	let submitting = $state(false);

	onMount(async () => {
		if (userStore.isLoggedIn) {
			goto('/dashboard');
			return;
		}
		await userStore.checkSetup();
		mode = userStore.needsSetup ? 'setup' : 'login';
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		submitting = true;
		const fd = new FormData(e.target as HTMLFormElement);
		try {
			await userStore.login(fd.get('username') as string, fd.get('password') as string);
			goto('/dashboard');
		} catch (err: any) {
			error = err.message;
		} finally {
			submitting = false;
		}
	}

	async function handleSetup(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		submitting = true;
		const fd = new FormData(e.target as HTMLFormElement);
		try {
			await userStore.setup({
				username: fd.get('username') as string,
				email: fd.get('email') as string,
				password: fd.get('password') as string,
				full_name: fd.get('full_name') as string
			});
			goto('/dashboard');
		} catch (err: any) {
			error = err.message;
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex items-center justify-center min-h-screen">
	{#if mode === 'loading'}
		<p class="text-[var(--color-text)] opacity-50">Connecting...</p>
	{:else}
		<div class="card p-8 w-full max-w-sm animate-fade-in">
			<div class="flex items-center gap-2 mb-6">
				<div class="w-2.5 h-2.5 rounded-full" style="background-color: #{themeStore.colors[0]};"></div>
				<span class="text-[var(--color-text)] font-semibold tracking-tight text-lg">Dev Nook</span>
			</div>

			{#if mode === 'setup'}
				<p class="text-[var(--color-text)] opacity-60 text-sm mb-5">First-run setup — create admin account</p>
				<form class="flex flex-col gap-3" onsubmit={handleSetup}>
					<input class="auth-input" type="text" name="username" placeholder="Username" required />
					<input class="auth-input" type="email" name="email" placeholder="Email" required />
					<input class="auth-input" type="password" name="password" placeholder="Password" required />
					<input class="auth-input" type="text" name="full_name" placeholder="Full name" />
					<button class="auth-btn" type="submit" disabled={submitting}>
						{submitting ? 'Creating...' : 'Create Admin'}
					</button>
				</form>
			{:else}
				<p class="text-[var(--color-text)] opacity-60 text-sm mb-5">Sign in to your account</p>
				<form class="flex flex-col gap-3" onsubmit={handleLogin}>
					<input class="auth-input" type="text" name="username" placeholder="Username" required />
					<input class="auth-input" type="password" name="password" placeholder="Password" required />
					<button class="auth-btn" type="submit" disabled={submitting}>
						{submitting ? 'Signing in...' : 'Sign in'}
					</button>
				</form>
			{/if}

			{#if error}
				<p class="text-red-400 text-sm mt-3">{error}</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.auth-input {
		padding: 0.625rem 0.75rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.625rem;
		color: var(--color-text);
		font-size: 0.9375rem;
		transition: border-color 0.2s, background-color 0.2s;
	}
	.auth-input::placeholder {
		color: var(--color-text);
		opacity: 0.25;
	}
	.auth-input:focus {
		border-color: rgba(255, 255, 255, 0.25);
		background: rgba(255, 255, 255, 0.08);
		outline: none;
	}
	.auth-btn {
		margin-top: 0.25rem;
		padding: 0.625rem;
		border-radius: 0.625rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #fff;
		background-color: var(--palette-0);
		transition: opacity 0.15s, transform 0.15s;
	}
	.auth-btn:hover:not(:disabled) {
		opacity: 0.85;
		transform: translateY(-1px);
	}
	.auth-btn:disabled {
		opacity: 0.5;
	}
</style>
