<script>
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme.svelte';
</script>

<div class="flex flex-col items-center justify-center min-h-screen gap-6 px-6 relative overflow-hidden" style="background-color: var(--color-background);">
	<!-- Background orbs -->
	<div class="bg-orb bg-orb-1" aria-hidden="true"></div>
	<div class="bg-orb bg-orb-2" aria-hidden="true"></div>

	<div class="relative z-10 flex flex-col items-center gap-6">
		<div class="flex items-center gap-3 mb-4 spring-in">
			<div class="relative">
				<div class="w-3 h-3 rounded-full" style="background-color: var(--color-primary);"></div>
				<div class="absolute inset-0 w-3 h-3 rounded-full live-dot" style="background-color: var(--color-primary); opacity: 0.3;"></div>
			</div>
			<span class="font-bold text-lg tracking-tight gradient-text">Dev Nook</span>
		</div>

		<div class="text-center spring-in" style="animation-delay: 0.1s;">
			<h1 class="font-bold gradient-text" style="font-size: 8rem; line-height: 1; opacity: 0.7;">{$page.status}</h1>
			<p class="text-lg -mt-2" style="color: var(--color-text-dim);">{$page.error?.message ?? 'Page not found'}</p>
		</div>

		<div class="flex items-center gap-3 mt-4 spring-in" style="animation-delay: 0.2s;">
			<a href="/dashboard" class="btn-glow px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));">
				Go to Dashboard
			</a>
			<a href="/explore" class="px-5 py-2.5 text-sm font-medium rounded-xl border transition-all hover:bg-[var(--color-surface)] active:scale-[0.98]" style="color: var(--color-text-dim); border-color: var(--color-border);">
				Explore
			</a>
		</div>
	</div>
</div>
