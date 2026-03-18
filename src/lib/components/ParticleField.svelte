<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { WebGLRenderer } from 'three';
	import ParticleScene from './ParticleScene.svelte';

	let { mouseX = 0, mouseY = 0 }: { mouseX?: number; mouseY?: number } = $props();

	function createRenderer(canvas: HTMLCanvasElement) {
		const dpr = Math.min(window.devicePixelRatio, 2);
		const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
		renderer.setPixelRatio(dpr);
		return renderer;
	}
</script>

<div class="fixed inset-0 pointer-events-none" style="z-index: 0; width: 100vw; height: 100vh;">
	<Canvas {createRenderer} autoRender>
		<ParticleScene {mouseX} {mouseY} />
	</Canvas>
</div>
