import { motion, AnimatePresence } from "motion/react";
import { History, Sun, Moon } from "lucide-react";

interface SiteHeaderProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  isGenerating: boolean;
  historyCount: number;
  onOpenHistory: () => void;
}

export default function SiteHeader({
  theme,
  onThemeChange,
  isGenerating,
  historyCount,
  onOpenHistory,
}: SiteHeaderProps) {
  return (
    <header className="relative h-20 border-b border-neutral-900/10 dark:border-neutral-800 flex items-center justify-between px-6 sm:px-12 bg-white dark:bg-neutral-950 sticky top-0 lg:static z-40 flex-shrink-0 transition-colors">
      {/* Subtle Loading Progress Bar across Header */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            id="header-loading-bar-track"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-neutral-200/50 dark:bg-neutral-800/80 overflow-hidden pointer-events-none z-20"
            role="progressbar"
            aria-label="Generating QR matrix"
            aria-busy="true"
          >
            <motion.div
              id="header-loading-bar-indicator"
              className="h-full bg-neutral-900 dark:bg-white shadow-[0_0_6px_rgba(0,0,0,0.25)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              initial={{ x: "-35%", width: "35%" }}
              animate={{
                x: ["-35%", "115%"],
                width: ["25%", "55%", "25%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.95,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-none flex items-center justify-center transition-colors">
          <div className="w-4 h-4 border-2 border-white dark:border-neutral-900"></div>
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase font-display">
            HK QR
          </span>
        </div>
      </div>

      {/* Navigation Items (Thematic Styling) */}
      <nav aria-label="Primary" className="hidden md:flex gap-8 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
        <a href="#generator" className="text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-1">Generator</a>
        <a href="#features" className="hover:text-neutral-900 dark:hover:text-white pb-1">Features</a>
        <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white pb-1">FAQ</a>
      </nav>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 font-semibold tracking-wider">
          v4.0.2 // STABLE
        </div>

        {/* History Drawer Toggle Button */}
        <button
          id="history-toggle-button"
          type="button"
          onClick={onOpenHistory}
          title="Open Recent QR History"
          aria-label="Open Recent QR History"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none rounded-none border-2 border-neutral-900 dark:border-neutral-200 bg-white dark:bg-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.7)] text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px]"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">History</span>
          <span className="px-1.5 py-0.2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[9px] font-mono leading-none">
            {historyCount}
          </span>
        </button>

        {/* Dark and Light Theme Buttons */}
        <div
          id="theme-switcher-control"
          className="flex items-center border-2 border-neutral-900 dark:border-neutral-200 bg-white dark:bg-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.7)] p-0.5"
          role="group"
          aria-label="Theme mode switcher"
        >
          <button
            id="theme-btn-light"
            type="button"
            onClick={() => onThemeChange("light")}
            aria-pressed={theme === "light"}
            title="Switch to Light theme"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none rounded-none ${
              theme === "light"
                ? "bg-neutral-900 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Light</span>
          </button>

          <button
            id="theme-btn-dark"
            type="button"
            onClick={() => onThemeChange("dark")}
            aria-pressed={theme === "dark"}
            title="Switch to Dark theme"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none rounded-none ${
              theme === "dark"
                ? "bg-white text-neutral-900 shadow-[1px_1px_0px_0px_rgba(255,255,255,0.4)]"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Dark</span>
          </button>
        </div>
      </div>
    </header>
  );
}
