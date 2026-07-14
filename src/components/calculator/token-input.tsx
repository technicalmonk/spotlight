'use client';

import { Input } from "@/components/ui/input";

interface TokenInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  hint?: string;
}

export function TokenInput({ label, value, onChange, placeholder, hint }: TokenInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        placeholder={placeholder}
        className="font-mono"
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
