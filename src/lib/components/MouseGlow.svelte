<script lang="ts">
  import { onMount } from 'svelte';

  let x = $state(50);
  let y = $state(50);

  onMount(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          x = (e.clientX / window.innerWidth) * 100;
          y = (e.clientY / window.innerHeight) * 100;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });
</script>

<div
  class="absolute inset-0 pointer-events-none transition-none"
  style="background: radial-gradient(circle 350px at {x}% {y}%, var(--primary-color) 0%, transparent 70%); opacity: 0.08; mix-blend-mode: screen;"
></div>
