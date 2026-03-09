<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';

	let { mouseX = 0, mouseY = 0 }: { mouseX?: number; mouseY?: number } = $props();

	const { renderer } = useThrelte();
	renderer.setClearColor(0x000000, 0);

	const count = 150;
	const dummy = new THREE.Object3D();

	const geometry = new THREE.SphereGeometry(1, 8, 6);
	const material = new THREE.MeshBasicMaterial({
		transparent: true,
		opacity: 0.15,
		depthWrite: false,
		vertexColors: true,
	});
	const mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.frustumCulled = false;

	const particles = Array.from({ length: count }, () => ({
		x: (Math.random() - 0.5) * 30,
		y: (Math.random() - 0.5) * 30,
		z: -Math.random() * 15 - 2,
		speed: 0.002 + Math.random() * 0.006,
		size: 0.02 + Math.random() * 0.07,
		phase: Math.random() * Math.PI * 2,
		drift: (Math.random() - 0.5) * 0.4,
	}));

	function updateColors() {
		const style = getComputedStyle(document.documentElement);
		const primary = style.getPropertyValue('--color-primary').trim() || '#6366f1';
		const accent = style.getPropertyValue('--color-accent').trim() || '#8b5cf6';
		const secondary = style.getPropertyValue('--color-secondary').trim() || '#a78bfa';
		const colors = [primary, accent, secondary];
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
			if (p.y > 15) {
				p.y = -15;
				p.x = (Math.random() - 0.5) * 30;
			}
			const depth = (p.z + 17) / 17;
			dummy.position.set(
				p.x + Math.sin(time * 0.5 + p.phase) * p.drift - mx * depth * 0.8,
				p.y + Math.cos(time * 0.3 + p.phase) * 0.1,
				p.z - my * depth * 0.5
			);
			dummy.scale.setScalar(p.size);
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

<T.PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
<T is={mesh} />
