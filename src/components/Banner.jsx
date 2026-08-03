export default function Banner({ tone = "info", children }) {
  if (!children) return null;

  const toneClasses = {
    success: "border-gold-400/30 bg-gold-400/10 text-gold-300 dark:border-gold-400/50 dark:bg-gold-400/20 dark:text-gold-400",
    error: "border-blush-500/40 bg-blush-500/10 text-blush-400 dark:border-blush-500/60 dark:bg-blush-500/20 dark:text-blush-500",
    info: "border-white/10 bg-white/5 text-ink-50 dark:border-ink-200 dark:bg-ink-100 dark:text-ink-900",
  };

  return (
    <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${toneClasses[tone] || toneClasses.info}`}>
      {children}
    </div>
  );
}
