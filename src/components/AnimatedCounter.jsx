import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function AnimatedCounter({ value, duration = 1.6, format = (n) => Math.round(n).toLocaleString() }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setDisplay });
    return () => controls.stop();
  }, [value, duration]);
  return <span>{format(display)}</span>;
}
