import { motion, useReducedMotion } from "motion/react";

export default function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const reduce = useReducedMotion();
  const MotionTag = motion.create(Tag);

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
