"use client";

import { useQueryState, parseAsString } from "nuqs";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchIcon, X } from "lucide-react";
import type { Provider } from "@/lib/types";

interface ModelFiltersProps {
  providers: Provider[];
}

export function ModelFilters({ providers }: ModelFiltersProps) {
  const [provider, setProvider] = useQueryState(
    "provider",
    parseAsString.withDefault("all")
  );
  const [modality, setModality] = useQueryState(
    "modality",
    parseAsString.withDefault("all")
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("name-asc")
  );
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [, startTransition] = useTransition();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    startTransition(() => {
      setSearch(value || null);
    });
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      setProvider(e.target.value === "all" ? null : e.target.value);
    });
  };

  const handleModalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      setModality(e.target.value === "all" ? null : e.target.value);
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      setSort(e.target.value);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setProvider(null);
      setModality(null);
      setSort(null);
      setSearch(null);
    });
  };

  const hasActiveFilters =
    provider !== "all" || modality !== "all" || sort !== "name-asc" || !!search;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => {
              startTransition(() => {
                setSearch(null);
              });
            }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Provider */}
        <Select
          value={provider === "all" ? "all" : provider}
          onChange={handleProviderChange}
          className="sm:w-48"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </Select>

        {/* Modality */}
        <Select
          value={modality === "all" ? "all" : modality}
          onChange={handleModalityChange}
          className="sm:w-40"
        >
          <option value="all">All Modalities</option>
          <option value="text">Text</option>
          <option value="image">Image</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </Select>

        {/* Sort */}
        <Select
          value={sort === "all" ? "name-asc" : sort}
          onChange={handleSortChange}
          className="sm:w-48"
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="input-asc">Input Price (low to high)</option>
          <option value="input-desc">Input Price (high to low)</option>
          <option value="output-asc">Output Price (low to high)</option>
          <option value="output-desc">Output Price (high to low)</option>
          <option value="context-asc">Context (small to large)</option>
          <option value="context-desc">Context (large to small)</option>
          <option value="provider-asc">Provider A-Z</option>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 whitespace-nowrap text-sm text-gray-500 hover:text-gray-900"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
