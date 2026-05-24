type WriteStatusBarProps = {
  isDrawerOpen?: boolean;
  pageCount: number;
  referenceCount: number;
  wordCount: number;
};

export function WriteStatusBar({
  isDrawerOpen = true,
  pageCount,
  referenceCount,
  wordCount,
}: WriteStatusBarProps) {
  return (
    <div
      className={`pointer-events-none fixed bottom-5 right-5 z-40 transition-[right] duration-300 ease-out sm:bottom-6 sm:right-6 ${
        isDrawerOpen ? "lg:right-[25.5rem] xl:right-[27rem]" : ""
      }`}
    >
      <div className="bg-white/88 pointer-events-auto inline-flex flex-wrap items-center gap-3 rounded-[1.1rem] border border-slate-200/85 px-4 py-3 text-sm text-slate-500 shadow-panel-float backdrop-blur-md">
        <span>
          {wordCount} palavra{wordCount === 1 ? "" : "s"}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-300/75" />
        <span>
          {pageCount} pagina{pageCount === 1 ? "" : "s"}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-300/75" />
        <span>{referenceCount} ref.</span>
      </div>
    </div>
  );
}
