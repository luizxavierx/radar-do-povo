import logo from "@/assets/logo.png";
import { motion, useReducedMotion } from "framer-motion";

import { editorialEase } from "@/lib/motion";

const AppRouteFallback = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,112,118,0.05),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(227,161,44,0.05),transparent_28%)]" />
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
      </motion.div>
    </div>
  );
};

export default AppRouteFallback;
