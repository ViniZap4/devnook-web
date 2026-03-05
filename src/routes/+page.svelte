<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';

	type Mode = 'setup' | 'login' | 'register';

	// init() already ran — derive initial mode immediately, no extra spinner
	let mode = $state<Mode>(userStore.needsSetup ? 'setup' : 'login');
	let error = $state('');
	let submitting = $state(false);

	onMount(() => {
		if (userStore.isLoggedIn) {
			goto('/dashboard');
		}
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		submitting = true;
		const fd = new FormData(e.target as HTMLFormElement);
		try {
			await userStore.login(fd.get('username') as string, fd.get('password') as string);
			goto('/dashboard');
		} catch (err) {
			error = friendlyError(err);
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
		} catch (err) {
			error = friendlyError(err);
		} finally {
			submitting = false;
		}
	}

	async function handleRegister(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		submitting = true;
		const fd = new FormData(e.target as HTMLFormElement);
		try {
			await userStore.register({
				username: fd.get('username') as string,
				email: fd.get('email') as string,
				password: fd.get('password') as string,
				full_name: fd.get('full_name') as string
			});
			goto('/dashboard');
		} catch (err) {
			error = friendlyError(err);
		} finally {
			submitting = false;
		}
	}

	function switchMode(m: Mode) {
		mode = m;
		error = '';
	}

	function friendlyError(err: unknown): string {
		if (err instanceof TypeError) return 'Unable to connect to the server.';
		if (err instanceof Error) return err.message;
		return 'Something went wrong.';
	}
</script>

<div class="min-h-screen flex">
	<!-- Left side — branding -->
	<div class="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden" style="background: linear-gradient(135deg, var(--color-primary)15, var(--color-secondary)10);">
		<div class="absolute inset-0 noise-bg-medium opacity-50"></div>

		<!-- Animated orbs -->
		<div class="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-float" style="background: var(--color-primary); opacity: 0.06;"></div>
		<div class="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl" style="background: var(--color-secondary); opacity: 0.05; animation: float 4s ease-in-out infinite 1s;"></div>

		<div class="relative z-10 max-w-md px-12 text-center">
			<div class="flex items-center justify-center gap-3 mb-8 animate-fade-up">
				<div class="relative">
					<div class="w-5 h-5 rounded-full transition-transform duration-300" style="background-color: var(--color-primary);"></div>
					<div class="absolute inset-0 w-5 h-5 rounded-full live-dot" style="background-color: var(--color-primary); opacity: 0.4;"></div>
				</div>
				<span style="color: var(--color-text);" class="font-bold text-3xl tracking-tight">Dev Nook</span>
			</div>
			<p class="text-[var(--color-text)] opacity-50 text-lg leading-relaxed mb-10 animate-fade-up stagger-2">
				Your self-hosted developer platform. Git hosting, issue tracking, and team collaboration — all in one place.
			</p>
			<div class="grid grid-cols-3 gap-4 animate-fade-up stagger-3">
				<div class="card p-4 text-center group">
					<div class="text-2xl mb-1 transition-transform duration-300 group-hover:scale-110" style="color: var(--color-primary);">
						<svg class="w-6 h-6 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/></svg>
					</div>
					<p class="text-xs text-[var(--color-text)] opacity-40">Repositories</p>
				</div>
				<div class="card p-4 text-center group">
					<div class="text-2xl mb-1 transition-transform duration-300 group-hover:scale-110" style="color: var(--color-primary);">
						<svg class="w-6 h-6 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg>
					</div>
					<p class="text-xs text-[var(--color-text)] opacity-40">Issues</p>
				</div>
				<div class="card p-4 text-center group">
					<div class="text-2xl mb-1 transition-transform duration-300 group-hover:scale-110" style="color: var(--color-primary);">
						<svg class="w-6 h-6 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.64 1.094c.487.325.778.862.778 1.44v5.59A1.75 1.75 0 0 1 14.75 16Z"/></svg>
					</div>
					<p class="text-xs text-[var(--color-text)] opacity-40">Teams</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Right side — auth form -->
	<div class="flex-1 flex items-center justify-center px-6">
		<div class="w-full max-w-sm animate-fade-up">
			<!-- Mobile branding -->
			<div class="flex items-center gap-2 mb-8 lg:hidden">
				<div class="relative">
					<div class="w-3 h-3 rounded-full" style="background-color: var(--color-primary);"></div>
					<div class="absolute inset-0 w-3 h-3 rounded-full live-dot" style="background-color: var(--color-primary); opacity: 0.4;"></div>
				</div>
				<span class="text-[var(--color-text)] font-bold text-xl tracking-tight">Dev Nook</span>
			</div>

			{#if mode === 'setup'}
				<div class="mb-8">
					<h1 class="text-[var(--color-text)] text-2xl font-bold mb-2">Welcome</h1>
					<p class="text-[var(--color-text)] opacity-40 text-sm">Create the admin account to get started.</p>
				</div>
				<form class="flex flex-col gap-4" onsubmit={handleSetup}>
					<div class="animate-fade-up-sm stagger-1">
						<label for="setup-username" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Username</label>
						<input class="auth-input" id="setup-username" type="text" name="username" placeholder="admin" required />
					</div>
					<div class="animate-fade-up-sm stagger-2">
						<label for="setup-email" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Email</label>
						<input class="auth-input" id="setup-email" type="email" name="email" placeholder="admin@example.com" required />
					</div>
					<div class="animate-fade-up-sm stagger-3">
						<label for="setup-password" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Password</label>
						<input class="auth-input" id="setup-password" type="password" name="password" placeholder="Choose a strong password" required />
					</div>
					<div class="animate-fade-up-sm stagger-4">
						<label for="setup-fullname" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Full name <span class="opacity-50">(optional)</span></label>
						<input class="auth-input" id="setup-fullname" type="text" name="full_name" placeholder="Your name" />
					</div>
					{#if error}
						<div class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-bounce-subtle">
							<p class="text-red-400 text-sm">{error}</p>
						</div>
					{/if}
					<button class="auth-btn" type="submit" disabled={submitting}>
						{#if submitting}
							<span class="flex items-center justify-center gap-2">
								<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
								Creating account...
							</span>
						{:else}
							Create Admin Account
						{/if}
					</button>
				</form>

			{:else if mode === 'register'}
				<div class="mb-8">
					<h1 class="text-[var(--color-text)] text-2xl font-bold mb-2">Create an account</h1>
					<p class="text-[var(--color-text)] opacity-40 text-sm">Join this Dev Nook instance.</p>
				</div>
				<form class="flex flex-col gap-4" onsubmit={handleRegister}>
					<div class="animate-fade-up-sm stagger-1">
						<label for="reg-username" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Username</label>
						<input class="auth-input" id="reg-username" type="text" name="username" placeholder="Choose a username" required />
					</div>
					<div class="animate-fade-up-sm stagger-2">
						<label for="reg-email" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Email</label>
						<input class="auth-input" id="reg-email" type="email" name="email" placeholder="you@example.com" required />
					</div>
					<div class="animate-fade-up-sm stagger-3">
						<label for="reg-password" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Password</label>
						<input class="auth-input" id="reg-password" type="password" name="password" placeholder="Choose a strong password" required />
					</div>
					<div class="animate-fade-up-sm stagger-4">
						<label for="reg-fullname" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Full name <span class="opacity-50">(optional)</span></label>
						<input class="auth-input" id="reg-fullname" type="text" name="full_name" placeholder="Your name" />
					</div>
					{#if error}
						<div class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-bounce-subtle">
							<p class="text-red-400 text-sm">{error}</p>
						</div>
					{/if}
					<button class="auth-btn" type="submit" disabled={submitting}>
						{#if submitting}
							<span class="flex items-center justify-center gap-2">
								<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
								Creating account...
							</span>
						{:else}
							Create Account
						{/if}
					</button>
				</form>
				<p class="text-center text-sm text-[var(--color-text)] opacity-40 mt-6">
					Already have an account?
					<button class="font-medium animated-link" style="color: var(--color-primary);" onclick={() => switchMode('login')}>Sign in</button>
				</p>

			{:else}
				<div class="mb-8">
					<h1 class="text-[var(--color-text)] text-2xl font-bold mb-2">Sign in</h1>
					<p class="text-[var(--color-text)] opacity-40 text-sm">Enter your credentials to continue.</p>
				</div>
				<form class="flex flex-col gap-4" onsubmit={handleLogin}>
					<div class="animate-fade-up-sm stagger-1">
						<label for="login-username" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Username</label>
						<input class="auth-input" id="login-username" type="text" name="username" placeholder="Enter username" required />
					</div>
					<div class="animate-fade-up-sm stagger-2">
						<label for="login-password" class="block text-xs font-medium text-[var(--color-text)] opacity-60 mb-1.5">Password</label>
						<input class="auth-input" id="login-password" type="password" name="password" placeholder="Enter password" required />
					</div>
					{#if error}
						<div class="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-bounce-subtle">
							<p class="text-red-400 text-sm">{error}</p>
						</div>
					{/if}
					<button class="auth-btn btn-glow" type="submit" disabled={submitting}>
						{#if submitting}
							<span class="flex items-center justify-center gap-2">
								<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
								Signing in...
							</span>
						{:else}
							Sign in
						{/if}
					</button>
				</form>
				<p class="text-center text-sm text-[var(--color-text)] opacity-40 mt-6">
					Don't have an account?
					<button class="font-medium animated-link" style="color: var(--color-primary);" onclick={() => switchMode('register')}>Create one</button>
				</p>
			{/if}

			<p class="text-center text-xs text-[var(--color-text)] opacity-20 mt-10">Dev Nook — Self-hosted developer platform</p>
		</div>
	</div>
</div>

<style>
	.auth-input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-surface-hover);
		border-radius: 0.75rem;
		color: var(--color-text);
		font-size: 0.875rem;
		transition: border-color 0.25s, background-color 0.25s, box-shadow 0.25s, transform 0.15s;
	}
	.auth-input::placeholder {
		color: var(--color-text);
		opacity: 0.2;
	}
	.auth-input:focus {
		border-color: var(--color-primary);
		background: var(--color-surface-hover);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
		outline: none;
		transform: translateY(-1px);
	}
	.auth-btn {
		margin-top: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #fff;
		background-color: var(--color-primary);
		transition: opacity 0.2s, transform 0.2s, box-shadow 0.3s;
	}
	.auth-btn:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-2px);
		box-shadow: 0 4px 20px color-mix(in srgb, var(--color-primary) 30%, transparent);
	}
	.auth-btn:active:not(:disabled) {
		transform: translateY(0) scale(0.98);
	}
	.auth-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
