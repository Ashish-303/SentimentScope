import React, { useEffect, useRef } from 'react';

export default function IntelligenceBackground() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particles array
    const particles = [];
    const count = 35;
    const connectionDist = 120;

    // Preferences check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create particles
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
      });
    }

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      ctx.strokeStyle = 'rgba(79, 110, 247, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < count; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      ctx.fillStyle = 'rgba(79, 110, 247, 0.18)';
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Move particle (only if motion is allowed)
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Bounce boundaries
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Parallax movement
    const handleMouseMove = (e) => {
      if (prefersReducedMotion || !canvas) return;
      const moveX = (e.clientX - window.innerWidth / 2) * -0.005; // 2-5px max offset
      const moveY = (e.clientY - window.innerHeight / 2) * -0.005;
      canvas.style.transform = `translate(${moveX}px, ${moveY}px)`;
    };

    // Init
    if (prefersReducedMotion) {
      // Static single-render
      render();
    } else {
      render();
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="intel-bg" ref={containerRef} aria-hidden="true">
      <canvas className="intel-bg-canvas" ref={canvasRef} />
    </div>
  );
}
