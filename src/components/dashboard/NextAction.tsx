import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const NextAction = memo(function NextAction({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 rounded-xl border border-neon-amber/20 bg-neon-amber/5 px-4 py-3"
    >
      <ArrowRight className="h-4 w-4 shrink-0 text-neon-amber" />
      <p className="text-sm text-neon-amber/90">{text}</p>
    </motion.div>
  );
});
