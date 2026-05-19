"use client";
export default function FitnessToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-24 text-neutral-900 dark:text-neutral-100">

      {/* TITLE */}
      <section className="text-center mb-16">
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">
          Hybrid Athlete Tools
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          A toolkit for hybrid athletes
        </p>
      </section>

      {/* TOP TOOL CARDS (3 IN A ROW) */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
        <ToolCard title="Meal Prep Helper" href="/tool/meal-prep-helper" imageSrc="/meal-prep-helper-tool.png" clearLocalStorage />
        <ToolCard title="Calories Calculator" href="/tool/calories-calculator" imageSrc="/calories-calculator-tool.png" />
        {/* <ToolCard title="Workout Generator" href="/tool/workout-generator" imageSrc="/coming-soon-tool-2.png" /> */}
        <ToolCard title="Training Program Generator" href="/tool/training-program-generator" imageSrc="/training-program-generator-tool.png" />
      </section>

      {/* TWO MID-CARDS (BIG) */}
      <section className="flex justify-center items-center w-full text-center mb-16">
        <div className="max-w-100 w-full">
          <MidToolCard
            title="More coming soon"
            description="New tools and features are on the way."
            imageSrc="/coming-soon-tool-1.png"
          />
        </div>
      </section>

      {/* CTA BLOCK */}
      <section className="text-center">
        <h2 className="text-lg font-semibold">
          Start using tools
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 max-w-md mx-auto">
          Level up your fitness with our suite of tools
        </p>
        <a
          href="/tools/about"
          className="mt-5 inline-flex items-center gap-3 border border-white/20 px-6 py-4 text-xs font-black uppercase tracking-wide text-white transition hover:border-white/50 hover:bg-white/[0.06]"
        >
          About the Tools
          <span className="text-lg leading-none">→</span>
        </a>
      </section>

    </div>
  );
}

function ToolCard({ title, href, imageSrc, clearLocalStorage }: { title: string; href?: string; imageSrc?: string; clearLocalStorage?: boolean }) {
  function handleClick() {
    if (clearLocalStorage) {
      localStorage.removeItem('mealPrepSettings');
      localStorage.removeItem('mealPrepIngredients');
      localStorage.removeItem('mealPrepStep');
    }
  }
  const content = (
    <>
      <img
        src={imageSrc}
        alt={title}
        className="mb-4 h-30 w-full rounded-xl object-cover bg-neutral-200 dark:bg-neutral-800"
      />
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
    </>
  );
  return href ? (
    <a href={href} onClick={handleClick} className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 cursor-pointer transition hover:bg-neutral-100 dark:hover:bg-neutral-900 block focus:outline-none focus:ring-2 focus:ring-yellow-600 dark:focus:ring-yellow-400">
      {content}
    </a>
  ) : (
    <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-4 cursor-pointer transition hover:bg-neutral-200 dark:hover:bg-neutral-800">
      {content}
    </div>
  );
}

function MidToolCard({
  title,
  description,
  href,
  imageSrc,
}: {
  title: string;
  description: string;
  href?: string;
  imageSrc?: string;
}) {
  const content = (
    <>
      <img
          src={imageSrc}
          alt={title}
          className="mb-5 h-32 w-full rounded-xl object-cover bg-neutral-200 dark:bg-neutral-800 sm:h-40"
        />
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{description}</p>
    </>
  );
  return href ? (
    <a href={href} className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 p-6 block cursor-pointer transition hover:bg-neutral-100 dark:hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-yellow-600 dark:focus:ring-yellow-400">
      {content}
    </a>
  ) : (
    <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 p-6">
      {content}
    </div>
  );
}

function BottomToolCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="mb-5 h-32 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800 sm:h-40" />
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{description}</p>
    </div>
  );
}
