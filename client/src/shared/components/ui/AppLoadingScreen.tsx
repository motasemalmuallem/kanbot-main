import { useLanguage } from "@shared/i18n/LanguageProvider";

const lanes = [
  "border-kanbot-accent/25 bg-kanbot-accent/5",
  "border-sky-400/25 bg-sky-400/5",
  "border-emerald-400/25 bg-emerald-400/5",
];

export function AppLoadingScreen() {
  const { t, isArabic } = useLanguage();

  return (
    <main
      className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-kanbot-page bg-kanbot-ambient bg-cover px-5 py-10 text-kanbot-ink"
      aria-label={t("Loading session")}
      aria-busy="true"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-kanbot-page/20 via-transparent to-kanbot-page/45" />

      <section
        className="my-auto flex w-full flex-col items-center text-center motion-safe:animate-kanbot-fade-in"
        role="status"
        aria-live="polite"
      >
        <div className="inline-flex items-center gap-3 rounded-2xl border border-kanbot-line bg-kanbot-panel/85 px-4 py-3 shadow-xl shadow-kanbot-canvas/10 backdrop-blur-sm">
          <img
            src="/logos/kanbot-icon.webp"
            alt=""
            className="size-11 rounded-xl shadow-sm"
            aria-hidden="true"
          />
          <span className="text-xl font-bold tracking-tight">Kanbot</span>
        </div>

        <div className="mt-7">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("Preparing your workspace…")}
          </h1>
          <p className="mt-2 text-sm text-kanbot-muted">
            {t("Loading session")}
          </p>
        </div>

        <div
          className="relative mt-7 w-full max-w-60 rounded-2xl border border-kanbot-line bg-kanbot-panel/80 p-3 shadow-lg backdrop-blur-sm"
          aria-hidden="true"
        >
          <div className="grid grid-cols-3 gap-2">
            {lanes.map((lane, index) => (
              <div
                key={lane}
                className={`flex h-[4.5rem] flex-col gap-2 rounded-lg border p-2 ${lane}`}
              >
                <span
                  className={`size-1.5 rounded-full ${index === 0 ? "bg-kanbot-accent" : index === 1 ? "bg-sky-400" : "bg-emerald-400"}`}
                />
                <span className="h-1.5 w-full rounded-full bg-kanbot-line/80" />
                <span className="h-1.5 w-2/3 rounded-full bg-kanbot-line/60" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute left-[1.35rem] top-[2.1rem] flex h-7 w-10 items-center gap-1 rounded-md border border-kanbot-accent/50 bg-kanbot-raised shadow-md shadow-kanbot-accent/10 motion-safe:animate-kanbot-task-travel motion-reduce:left-1/2 motion-reduce:-translate-x-1/2 motion-reduce:animate-none">
            <span className="ml-1.5 h-1 w-5 rounded-full bg-kanbot-accent/75" />
            <span className="size-1 rounded-full bg-kanbot-accent" />
          </div>
        </div>

        <div className="mt-6 h-1 w-36 overflow-hidden rounded-full bg-kanbot-raised">
          <span className="block h-full w-1/3 rounded-full bg-kanbot-accent motion-safe:animate-kanbot-loading-progress motion-reduce:animate-none" />
        </div>
      </section>
    </main>
  );
}
