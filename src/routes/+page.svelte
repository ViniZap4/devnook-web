<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';

	type Mode = 'setup' | 'login' | 'register';

	let mode = $state<Mode>(userStore.needsSetup ? 'setup' : 'login');
	let error = $state('');
	let submitting = $state(false);
	let mounted = $state(false);
	let redirecting = $state(false);

	onMount(() => {
		if (userStore.isLoggedIn) {
			redirecting = true;
			goto('/dashboard');
			return;
		}
		requestAnimationFrame(() => { mounted = true; });
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

{#if redirecting}
	<div class="min-h-screen flex items-center justify-center" style="background-color: var(--color-background);">
		<div class="w-8 h-8 rounded-full border-2 animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
	</div>
{:else}
<div class="min-h-screen flex relative overflow-hidden" style="background-color: var(--color-background);">
	<!-- Organic floating background orbs -->
	<div class="bg-orb bg-orb-1" style="position: absolute;"></div>
	<div class="bg-orb bg-orb-2" style="position: absolute;"></div>
	<div class="bg-orb bg-orb-3" style="position: absolute;"></div>

	<!-- Left side — branding -->
	<div class="hidden lg:flex lg:w-1/2 items-center justify-center relative">
		<div class="relative z-10 max-w-lg px-16 text-center">
			<div
				class="flex items-center justify-center gap-4 mb-10 transition-all duration-700"
				style="opacity: {mounted ? 1 : 0}; transform: {mounted ? 'translateY(0)' : 'translateY(20px)'};"
			>
				<div class="relative">
					<div class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));"></div>
					<div class="absolute inset-0 w-8 h-8 rounded-full live-dot" style="background: var(--color-primary); opacity: 0.3;"></div>
				</div>
				<span class="font-bold text-4xl tracking-tight gradient-text-animated">Dev Nook</span>
			</div>
			<p
				class="text-lg leading-relaxed mb-12 transition-all duration-700 delay-100"
				style="color: var(--color-text-dim); opacity: {mounted ? 1 : 0}; transform: {mounted ? 'translateY(0)' : 'translateY(20px)'};"
			>
				Your self-hosted developer platform.<br />
				<span class="text-shimmer font-medium">Git hosting, issue tracking, and collaboration.</span>
			</p>

			<!-- Feature cards -->
			<div
				class="grid grid-cols-3 gap-4 transition-all duration-700 delay-200"
				style="opacity: {mounted ? 1 : 0}; transform: {mounted ? 'translateY(0)' : 'translateY(20px)'};"
			>
				<div class="card-glow p-5 text-center group cursor-default">
					<div class="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 mb-2" style="color: var(--color-primary);">
						<svg class="w-7 h-7 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/></svg>
					</div>
					<p class="text-xs font-medium" style="color: var(--color-text-dim);">Repositories</p>
				</div>
				<div class="card-glow p-5 text-center group cursor-default">
					<div class="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 mb-2" style="color: var(--color-secondary);">
						<svg class="w-7 h-7 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg>
					</div>
					<p class="text-xs font-medium" style="color: var(--color-text-dim);">Issues</p>
				</div>
				<div class="card-glow p-5 text-center group cursor-default">
					<div class="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 mb-2" style="color: var(--color-accent);">
						<svg class="w-7 h-7 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
					</div>
					<p class="text-xs font-medium" style="color: var(--color-text-dim);">Teams</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Right side — auth form -->
	<div class="flex-1 flex items-center justify-center px-6 relative z-10">
		<div
			class="w-full max-w-sm transition-all duration-700"
			style="opacity: {mounted ? 1 : 0}; transform: {mounted ? 'translateY(0)' : 'translateY(24px)'};"
		>
			<!-- Mobile branding -->
			<div class="flex items-center gap-2.5 mb-10 lg:hidden">
				<div class="relative">
					<div class="w-4 h-4 rounded-full" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));"></div>
					<div class="absolute inset-0 w-4 h-4 rounded-full live-dot" style="background: var(--color-primary); opacity: 0.3;"></div>
				</div>
				<span class="font-bold text-2xl tracking-tight gradient-text">Dev Nook</span>
			</div>

			{#if mode === 'setup'}
				<div class="mb-8">
					<h1 class="text-3xl font-bold tracking-tight mb-2" style="color: var(--color-text);">Welcome</h1>
					<p style="color: var(--color-text-dim);" class="text-sm">Create the admin account to get started.</p>
				</div>
				<form class="flex flex-col gap-4" onsubmit={handleSetup}>
					<div><label for="setup-username" class="auth-label">Username</label><input class="auth-input" id="setup-username" type="text" name="username" placeholder="admin" required /></div>
					<div><label for="setup-email" class="auth-label">Email</label><input class="auth-input" id="setup-email" type="email" name="email" placeholder="admin@example.com" required /></div>
					<div><label for="setup-password" class="auth-label">Password</label><input class="auth-input" id="setup-password" type="password" name="password" placeholder="Choose a strong password" required /></div>
					<div><label for="setup-fullname" class="auth-label">Full name <span class="opacity-50">(optional)</span></label><input class="auth-input" id="setup-fullname" type="text" name="full_name" placeholder="Your name" /></div>
					{#if error}<div class="auth-error animate-bounce-subtle"><p>{error}</p></div>{/if}
					<button class="auth-btn" type="submit" disabled={submitting}>
						{#if submitting}<span class="auth-spinner"></span>Creating account...{:else}Create Admin Account{/if}
					</button>
				</form>

			{:else if mode === 'register'}
				<div class="mb-8">
					<h1 class="text-3xl font-bold tracking-tight mb-2" style="color: var(--color-text);">Create an account</h1>
					<p style="color: var(--color-text-dim);" class="text-sm">Join this Dev Nook instance.</p>
				</div>
				<form class="flex flex-col gap-4" onsubmit={handleRegister}>
					<div><label for="reg-username" class="auth-label">Username</label><input class="auth-input" id="reg-username" type="text" name="username" placeholder="Choose a username" required /></div>
					<div><label for="reg-email" class="auth-label">Email</label><input class="auth-input" id="reg-email" type="email" name="email" placeholder="you@example.com" required /></div>
					<div><label for="reg-password" class="auth-label">Password</label><input class="auth-input" id="reg-password" type="password" name="password" placeholder="Choose a strong password" required /></div>
					<div><label for="reg-fullname" class="auth-label">Full name <span class="opacity-50">(optional)</span></label><input class="auth-input" id="reg-fullname" type="text" name="full_name" placeholder="Your name" /></div>
					{#if error}<div class="auth-error animate-bounce-subtle"><p>{error}</p></div>{/if}
					<button class="auth-btn" type="submit" disabled={submitting}>
						{#if submitting}<span class="auth-spinner"></span>Creating account...{:else}Create Account{/if}
					</button>
				</form>
				<p class="text-center text-sm mt-6" style="color: var(--color-text-dim);">
					Already have an account?
					<button class="font-semibold animated-link" style="color: var(--color-primary);" onclick={() => switchMode('login')}>Sign in</button>
				</p>

			{:else}
				<div class="mb-8">
					<h1 class="text-3xl font-bold tracking-tight mb-2" style="color: var(--color-text);">Welcome back</h1>
					<p style="color: var(--color-text-dim);" class="text-sm">Enter your credentials to continue.</p>
				</div>
				<form class="flex flex-col gap-4" onsubmit={handleLogin}>
					<div><label for="login-username" class="auth-label">Username</label><input class="auth-input" id="login-username" type="text" name="username" placeholder="Enter username" required /></div>
					<div><label for="login-password" class="auth-label">Password</label><input class="auth-input" id="login-password" type="password" name="password" placeholder="Enter password" required /></div>
					{#if error}<div class="auth-error animate-bounce-subtle"><p>{error}</p></div>{/if}
					<button class="auth-btn btn-glow" type="submit" disabled={submitting}>
						{#if submitting}<span class="auth-spinner"></span>Signing in...{:else}Sign in{/if}
					</button>
				</form>
				<p class="text-center text-sm mt-6" style="color: var(--color-text-dim);">
					Don't have an account?
					<button class="font-semibold animated-link" style="color: var(--color-primary);" onclick={() => switchMode('register')}>Create one</button>
				</p>
			{/if}

			<p class="text-center text-xs mt-12" style="color: var(--color-text-dim); opacity: 0.4;">Dev Nook — Self-hosted developer platform</p>
		</div>
	</div>
</div>
{/if}

<style>
	.auth-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-dim);
		margin-bottom: 0.375rem;
	}
	.auth-input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: color-mix(in srgb, var(--color-surface) 60%, transparent);
		backdrop-filter: blur(8px);
		border: 1px solid var(--color-border);
		border-radius: 0.875rem;
		color: var(--color-text);
		font-size: 0.875rem;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.auth-input::placeholder {
		color: var(--color-text-dim);
		opacity: 0.4;
	}
	.auth-input:focus {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-surface) 80%, transparent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent), 0 0 20px color-mix(in srgb, var(--color-primary) 8%, transparent);
		outline: none;
		transform: translateY(-1px);
	}
	.auth-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.875rem;
		border-radius: 0.875rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: #fff;
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}
	.auth-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
	}
	.auth-btn:active:not(:disabled) {
		transform: translateY(0) scale(0.98);
	}
	.auth-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.auth-error {
		padding: 0.625rem 0.875rem;
		border-radius: 0.875rem;
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
		color: var(--color-error);
		font-size: 0.875rem;
	}
	.auth-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
