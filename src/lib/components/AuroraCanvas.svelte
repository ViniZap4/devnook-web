<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let canvas: HTMLCanvasElement;
	let animId: number;

	const bands = [
		{ baseY: 0.22, amp: 0.07, freq: 1.5, speed: 0.15, width: 0.18, colorVar: '--color-primary' },
		{ baseY: 0.35, amp: 0.09, freq: 1.0, speed: 0.10, width: 0.22, colorVar: '--color-accent' },
		{ baseY: 0.28, amp: 0.05, freq: 2.0, speed: 0.20, width: 0.14, colorVar: '--color-secondary' },
	];

	function getColor(varName: string): string {
		return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#6366f1';
	}

	function hexToRgba(hex: string, alpha: number): string {
		hex = hex.replace('#', '');
		if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		return `rgba(${r},${g},${b},${alpha})`;
	}

	function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
		ctx.clearRect(0, 0, w, h);

		for (const band of bands) {
			const color = getColor(band.colorVar);
			const grad = ctx.createLinearGradient(0, 0, w, 0);
			grad.addColorStop(0, hexToRgba(color, 0));
			grad.addColorStop(0.15, hexToRgba(color, 0.06));
			grad.addColorStop(0.4, hexToRgba(color, 0.12));
			grad.addColorStop(0.6, hexToRgba(color, 0.12));
			grad.addColorStop(0.85, hexToRgba(color, 0.06));
			grad.addColorStop(1, hexToRgba(color, 0));

			ctx.fillStyle = grad;
			ctx.beginPath();

			// Top edge
			for (let x = 0; x <= w; x += 3) {
				const nx = x / w;
				const y = h * band.baseY +
					Math.sin(nx * Math.PI * band.freq + t * band.speed) * h * band.amp +
					Math.sin(nx * Math.PI * 3.7 + t * 0.07) * h * 0.015;
				if (x === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}

			// Bottom edge
			for (let x = w; x >= 0; x -= 3) {
				const nx = x / w;
				const y = h * (band.baseY + band.width) +
					Math.sin(nx * Math.PI * band.freq + t * band.speed + 0.5) * h * band.amp * 0.8 +
					Math.sin(nx * Math.PI * 2.3 + t * 0.09) * h * 0.02;
				ctx.lineTo(x, y);
			}

			ctx.closePath();
			ctx.fill();
		}
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		function resize() {
			const dpr = Math.min(window.devicePixelRatio, 2);
			canvas.width = window.innerWidth * dpr;
			canvas.height = window.innerHeight * dpr;
			ctx!.scale(dpr, dpr);
		}

		resize();
		window.addEventListener('resize', resize);

		function loop() {
			const t = performance.now() * 0.001;
			draw(ctx!, window.innerWidth, window.innerHeight, t);
			animId = requestAnimationFrame(loop);
		}
		animId = requestAnimationFrame(loop);

		return () => {
			window.removeEventListener('resize', resize);
		};
	});

	onDestroy(() => {
		if (animId) cancelAnimationFrame(animId);
	});
</script>

<canvas
	bind:this={canvas}
	class="fixed inset-0 pointer-events-none"
	style="z-index: 0; width: 100vw; height: 100vh; filter: blur(40px);"
></canvas>
