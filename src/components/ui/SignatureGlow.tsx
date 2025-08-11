import React from "react";

const SignatureGlow: React.FC = () => {
  React.useEffect(() => {
    const el = document.getElementById("signature-glow");
    const onMove = (e: PointerEvent) => {
      if (!el) return;
      const x = e.clientX - (el.clientWidth / 2);
      const y = e.clientY - (el.clientHeight / 2);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      id="signature-glow"
      aria-hidden
      className="pointer-events-none fixed -z-10 left-0 top-0 h-[var(--glow-size)] w-[var(--glow-size)] rounded-full blur-3xl opacity-40"
      style={{ background: "radial-gradient(circle, var(--glow-color), transparent 60%)" }}
    />
  );
};

export default SignatureGlow;
