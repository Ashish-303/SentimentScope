import { useEffect, useRef } from 'react';

export function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (noMotion) {
      el.classList.add('visible');
      return;
    }

    el.classList.add('reveal');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
