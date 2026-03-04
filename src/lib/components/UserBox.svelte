<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	let initials = $derived(
		userStore.user
			? userStore.user.full_name
				? userStore.user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
				: userStore.user.username.slice(0, 2).toUpperCase()
			: 'DN'
	);

	let displayName = $derived(
		userStore.user?.full_name || userStore.user?.username || 'Developer'
	);
</script>

<section class="card p-6 animate-fade-in">
	<div class="flex items-center gap-4">
		<div
			class="flex justify-center items-center w-14 h-14 rounded-2xl text-white text-xl font-bold shrink-0"
			style="background: linear-gradient(135deg, #{themeStore.colors[0]}, #{themeStore.colors[3]});"
		>
			{initials}
		</div>
		<div>
			<h1 class="text-[var(--color-text)] leading-tight">Welcome back, {displayName}</h1>
			<p class="text-[var(--color-text)] opacity-50 mt-0.5">Your personal developer dashboard</p>
		</div>
	</div>
</section>
