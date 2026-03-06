<script lang="ts">
	import { Canvas } from '@threlte/core';
	import ParticleScene from './ParticleScene.svelte';

	let { mouseX = 0, mouseY = 0 }: { mouseX?: number; mouseY?: number } = $props();
</script>

<div class="fixed inset-0 pointer-events-none" style="z-index: 0;">
	<Canvas>
		<ParticleScene {mouseX} {mouseY} />
	</Canvas>
</div>
