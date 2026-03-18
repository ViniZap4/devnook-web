<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';

	let { mouseX = 0, mouseY = 0 }: { mouseX?: number; mouseY?: number } = $props();

	const { renderer } = useThrelte();
	renderer.setClearColor(0x000000, 0);

	const count = 120;
	const dummy = new THREE.Object3D();

	const geometry = new THREE.CircleGeometry(1, 24);
	const material = new THREE.MeshBasicMaterial({
		transparent: true,
		opacity: 0.55,
		depthWrite: false,
		vertexColors: true,
		side: THREE.DoubleSide,
		blending: THREE.AdditiveBlending,
	});
	const mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.frustumCulled = false;

	const particles = Array.from({ length: count }, () => {
		const layer = Math.random();
		return {
			x: (Math.random() - 0.5) * 28,
			y: (Math.random() - 0.5) * 22,
			z: -Math.random() * 10 - 0.5,
			speed: 0.002 + Math.random() * 0.006,
			size: layer < 0.15 ? 0.3 + Math.random() * 0.35 : layer < 0.5 ? 0.12 + Math.random() * 0.2 : 0.04 + Math.random() * 0.1,
			phase: Math.random() * Math.PI * 2,
			drift: (Math.random() - 0.5) * 0.5,
			driftY: (Math.random() - 0.5) * 0.15,
			pulseSpeed: 0.3 + Math.random() * 0.8,
			pulseAmp: 0.15 + Math.random() * 0.25,
		};
	});

	function updateColors() {
		const style = getComputedStyle(document.documentElement);
		const primary = style.getPropertyValue('--color-primary').trim() || '#8B5CF6';
		const accent = style.getPropertyValue('--color-accent').trim() || '#A78BFA';
		const secondary = style.getPropertyValue('--color-secondary').trim() || '#06B6D4';
		const colors = [primary, primary, accent, secondary];
		const color = new THREE.Color();
		for (let i = 0; i < count; i++) {
			color.set(colors[i % colors.length]);
			mesh.setColorAt(i, color);
		}
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
	}

	updateColors();

	const observer = new MutationObserver(() => updateColors());
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

	// Initialize positions
	for (let i = 0; i < count; i++) {
		const p = particles[i];
		dummy.position.set(p.x, p.y, p.z);
		dummy.scale.setScalar(p.size);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
	}
	mesh.instanceMatrix.needsUpdate = true;

	useTask(() => {
		const time = performance.now() * 0.001;
		const w = window.innerWidth || 1;
		const h = window.innerHeight || 1;
		const mx = (mouseX / w - 0.5) * 2;
		const my = (mouseY / h - 0.5) * 2;

		for (let i = 0; i < count; i++) {
			const p = particles[i];
			p.y += p.speed;
			if (p.y > 13) {
				p.y = -13;
				p.x = (Math.random() - 0.5) * 28;
			}
			const depth = (p.z + 10.5) / 10.5;
			const pulse = 1 + Math.sin(time * p.pulseSpeed + p.phase) * p.pulseAmp;
			dummy.position.set(
				p.x + Math.sin(time * 0.25 + p.phase) * p.drift - mx * depth * 0.8,
				p.y + Math.cos(time * 0.18 + p.phase) * p.driftY,
				p.z - my * depth * 0.5
			);
			dummy.scale.setScalar(p.size * pulse);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	});

	onDestroy(() => {
		observer.disconnect();
		mesh.dispose();
		geometry.dispose();
		material.dispose();
	});
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 10]} fov={55} />
<T is={mesh} />
