/** Thin status strip between the workspace and the SEO content sections. */
export default function StatusBar() {
  return (
    <div className="h-14 border-t border-neutral-900/10 dark:border-neutral-800 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-neutral-950 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest gap-2 py-4 sm:py-0 transition-colors flex-shrink-0 z-30">
      <div className="flex gap-6">
        <span>Standard: ISO/IEC 18004</span>
      </div>
      <div className="flex gap-6">
        <span>License: Apache-2.0</span>
      </div>
    </div>
  );
}
