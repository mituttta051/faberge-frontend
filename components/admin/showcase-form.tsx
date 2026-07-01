"use client";

import * as React from "react";
import type { Hall, Showcase, ShowcaseInput } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FormActions } from "./field";

interface ShowcaseFormProps {
  initial?: Showcase | null;
  halls: Hall[];
  onSubmit: (input: ShowcaseInput) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ShowcaseForm({
  initial,
  halls,
  onSubmit,
  onCancel,
  loading,
  error,
}: ShowcaseFormProps) {
  const [hallId, setHallId] = React.useState(String(initial?.hallId ?? halls[0]?.id ?? ""));
  const [showcaseNumber, setShowcaseNumber] = React.useState(
    String(initial?.showcaseNumber ?? ""),
  );
  const [name, setName] = React.useState(initial?.name ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      hallId: Number(hallId) || 0,
      showcaseNumber: Number(showcaseNumber) || 0,
      name: name.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Зал" required>
        <Select value={hallId} onChange={(e) => setHallId(e.target.value)} required>
          {halls.map((h) => (
            <option key={h.id} value={h.id}>
              {h.hallNumber}. {h.name ?? "Без названия"}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Номер витрины" required>
        <Input
          type="number"
          inputMode="numeric"
          value={showcaseNumber}
          onChange={(e) => setShowcaseNumber(e.target.value)}
          required
        />
      </Field>
      <Field label="Название">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Императорские пасхальные яйца"
        />
      </Field>
      <FormActions
        onCancel={onCancel}
        loading={loading}
        error={error}
        submitLabel={initial ? "Сохранить" : "Создать"}
      />
    </form>
  );
}
