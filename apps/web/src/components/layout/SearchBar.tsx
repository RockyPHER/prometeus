import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
}: SearchBarProps) {
  return (
    <label
      className={[
        "flex h-12 w-full max-w-xl items-center gap-3 rounded-full border border-slate-200 bg-white px-4 shadow-sm transition duration-200 focus-within:border-slate-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Search className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        type="search"
      />
      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-400">
        ⌘ K
      </span>
    </label>
  );
}
