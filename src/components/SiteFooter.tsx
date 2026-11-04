/** Page footer with brand line and internal anchor links. */
export default function SiteFooter() {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-neutral-900/10 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-6 sm:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="w-3 h-3 border-2 border-neutral-900 dark:border-white inline-block" />
        <span>© {new Date().getFullYear()} HK QR // Free QR code generator</span>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <a href="#generator" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Generator</a>
        <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-neutral-900 dark:hover:text-white transition-colors">How-to</a>
        <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">FAQ</a>
        <span>Generated locally // No tracking</span>
      </nav>
    </footer>
  );
}
