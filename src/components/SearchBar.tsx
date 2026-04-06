import { Search, Loader2, X } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  autoSearch?: boolean;
  debounceMs?: number;
}

const SearchBar = ({
  onSearch,
  isLoading,
  placeholder = "Buscar parlamentar por nome...",
  defaultValue = "",
  submitLabel = "Buscar",
  autoSearch = false,
  debounceMs = 300,
}: SearchBarProps) => {
  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultValue);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    setQuery(defaultValue);
    setDebouncedQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!autoSearch) return;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [autoSearch, debounceMs, query]);

  useEffect(() => {
    if (!autoSearch || !onSearchRef.current) return;
    onSearchRef.current(debouncedQuery.trim());
  }, [autoSearch, debouncedQuery]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const normalized = query.trim();
      if (!normalized || !onSearchRef.current) return;
      onSearchRef.current(normalized);
    },
    [query]
  );

  const clearQuery = () => {
    setQuery("");
    setDebouncedQuery("");
    onSearchRef.current?.("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass-card group relative mx-auto flex w-full max-w-3xl items-center gap-3 overflow-hidden rounded-[1.7rem] border border-white/65 p-2.5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-sheen absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm" />
          <div className="animate-float-wide absolute -left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-primary/10 blur-xl" />
          <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-soft">
          {isLoading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
          ) : (
            <Search className="h-4.5 w-4.5 text-primary" />
          )}
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="relative h-11 flex-1 rounded-xl border border-transparent bg-white/60 px-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-white"
        />

        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={!query.trim() || !!isLoading}
          className="relative h-11 overflow-hidden rounded-xl bg-gradient-hero px-4 text-xs font-semibold text-primary-foreground transition-all duration-300 group-hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
