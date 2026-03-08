import { Search, Loader2, X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
}

const SearchBar = ({
  onSearch,
  isLoading,
  placeholder = "Buscar parlamentar por nome...",
  defaultValue = "",
  submitLabel = "Buscar",
}: SearchBarProps) => {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const normalized = query.trim();
      if (!normalized || !onSearch) return;
      onSearch(normalized);
    },
    [query, onSearch]
  );

  const clearQuery = () => {
    setQuery("");
    onSearch?.("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass-card relative mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-white/65 p-2.5 shadow-card">
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
          className="h-11 flex-1 rounded-xl border border-transparent bg-white/60 px-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-white"
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
          className="h-11 rounded-xl bg-gradient-hero px-4 text-xs font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
