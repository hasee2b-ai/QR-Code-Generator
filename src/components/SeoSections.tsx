import { FAQS, FEATURES, HOW_IT_STEPS } from "../data/content";

/**
 * Below-the-fold content — crawlable copy that targets search queries like
 * "free QR code generator", "create QR code for website", "custom QR code with
 * logo". Copy lives in src/data/content.ts and is shared with the JSON-LD
 * injected into index.html by the seoJsonLd() Vite plugin.
 */
export default function SeoSections() {
  return (
    <div className="border-t border-neutral-900/10 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 sm:py-24 space-y-20 sm:space-y-28">

        {/* Feature grid */}
        <section id="features" aria-labelledby="features-heading" className="scroll-mt-24">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 block">
            Built for scan reliability
          </span>
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl font-black uppercase italic font-display tracking-tight text-neutral-900 dark:text-white mb-4" style={{ wordSpacing: "0.08em" }}
          >
            Everything a QR code maker should be
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed mb-10 text-sm sm:text-base">
            HK QR is a free online QR code generator for websites, landing pages, social profiles
            and print campaigns. Paste a link, style your code, and export a crisp, scannable PNG —
            no account, no watermark, no upload.
          </p>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0">
            {FEATURES.map((feature) => (
              <li
                key={feature.id}
                className="border-2 border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.7)]"
              >
                <span className="block text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 tracking-widest mb-3">
                  {feature.id} //
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-neutral-900 dark:text-white mb-2 font-display">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* How-to steps */}
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="scroll-mt-24">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 block">
            Three steps, ten seconds
          </span>
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl font-black uppercase italic font-display tracking-tight text-neutral-900 dark:text-white mb-10" style={{ wordSpacing: "0.08em" }}
          >
            How to make a QR code
          </h2>

          <ol className="grid sm:grid-cols-3 gap-6 list-none p-0 m-0">
            {HOW_IT_STEPS.map((item) => (
              <li key={item.step} className="border-t-2 border-neutral-900 dark:border-neutral-100 pt-5">
                <span className="block text-4xl font-black italic font-display text-neutral-900 dark:text-white leading-none mb-3">
                  {item.step}
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-neutral-900 dark:text-white mb-2 font-display">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ — kept in sync with the FAQPage JSON-LD via src/data/content.ts */}
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 block">
            Quick answers
          </span>
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl font-black uppercase italic font-display tracking-tight text-neutral-900 dark:text-white mb-8" style={{ wordSpacing: "0.08em" }}
          >
            QR code generator FAQ
          </h2>

          <div className="sm:grid sm:grid-cols-2 sm:gap-x-12">
            {FAQS.map((item) => (
              <div key={item.q} className="py-5 border-t border-neutral-900/10 dark:border-neutral-800">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mb-1.5">
                  {item.q}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
