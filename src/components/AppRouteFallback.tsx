import logo from "@/assets/logo.png";
import { motion, useReducedMotion } from "framer-motion";

import { editorialEase } from "@/lib/motion";

const AppRouteFallback = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,112,118,0.05),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(227,161,44,0.05),transparent_28%)]" />
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70" />
        <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.01 } : { duration: 0.28, ease: editorialEase }}
        className="relative flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: reduceMotion ? 1 : 0.985 }}
          animate={{ scale: 1 }}
          transition={reduceMotion ? { duration: 0.01 } : { duration: 0.34, ease: editorialEase }}
          className="rounded-[2rem] border border-slate-200/70 bg-white px-8 py-7 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.22)]"
        >
          <motion.img
            src={logo}
            alt="Radar do Povo"
            className="h-14 w-auto sm:h-16"
            initial={{ opacity: 0.88 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: editorialEase }}
          />
        </motion.div>

        <div className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-slate-200/80">
          <motion.div
            className="h-full rounded-full bg-gradient-hero"
            initial={{ x: "-100%" }}
            animate={{ x: "110%" }}
            transition={
              reduceMotion
                ? { duration: 0.01 }
                : { duration: 1.15, ease: [0.4, 0, 0.2, 1], repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.12 }
            }
            style={{ width: "48%" }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AppRouteFallback;
