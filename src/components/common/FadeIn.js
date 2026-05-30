import { motion } from "framer-motion";

export default function FadeIn({ children, delay = 0, className = "", style = {} }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}