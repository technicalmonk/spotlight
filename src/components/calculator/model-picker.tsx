'use client';

import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
}

interface ModelPickerProps {
  selected: ModelOption[];
  onChange: (selected: ModelOption[]) => void;
  allModels: ModelOption[];
}

export function ModelPicker({ selected, onChange, allModels }: ModelPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? allModels.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.provider.toLowerCase().includes(search.toLowerCase()),
      ).slice(0, 10)
    : [];

  const handleAdd = (model: ModelOption) => {
    if (!selected.find((s) => s.id === model.id)) {
      onChange([...selected, model]);
    }
    setSearch("");
  };

  const handleRemove = (id: string) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Models to compare</label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((model) => (
            <Badge key={model.id} variant="secondary" className="gap-1.5 pr-1">
              <span className="text-gray-500">{model.provider}</span>
              <span>{model.name}</span>
              <button
                onClick={() => handleRemove(model.id)}
                className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                aria-label={`Remove ${model.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models to add..."
          className="pl-9"
        />

        {filtered.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filtered.map((model) => (
              <button
                key={model.id}
                onClick={() => handleAdd(model)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-medium">{model.name}</span>
                <span className="text-sm text-gray-500 ml-2">{model.provider}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
