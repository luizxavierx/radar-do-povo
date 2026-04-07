import { Search, Loader2, X } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { buildHoverLift, editorialEase } from "@/lib/motion";

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
  const reduceMotion = useReducedMotion();

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
      <motion.div
        whileHover={buildHoverLift(Boolean(reduceMotion), -1.5)}
        transition={reduceMotion ? { duration: 0.01 } : { duration: 0.24, ease: editorialEase }}
        className="editorial-input-shell group mx-auto w-full max-w-4xl"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 rounded-[1.65rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,248,250,0.82)_55%,rgba(255,248,236,0.62)_100%)]" />
        </div>

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-primary/10 bg-primary/8">
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
              className="h-12 min-w-0 flex-1 rounded-[1rem] border border-transparent bg-white/58 px-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/90 focus:border-primary/20 focus:bg-white"
            />

            {query ? (
              <button
                type="button"
                onClick={clearQuery}
                className="touch-target shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!query.trim() || !!isLoading}
            className="touch-target relative h-12 w-full overflow-hidden rounded-[1rem] border border-transparent bg-gradient-hero px-4 text-xs font-semibold text-primary-foreground transition-all duration-300 group-hover:shadow-glow sm:w-auto disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/24 to-transparent" />
            {submitLabel}
          </button>
        </div>
      </motion.div>
    </form>
  );
};

export default SearchBar;
