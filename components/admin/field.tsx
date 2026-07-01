import * as React from "react";
import { Button } from "@/components/ui/button";

/** Подпись + контрол для форм админки. */
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
      {hint && <span className="text-muted-foreground text-[11px]">{hint}</span>}
    </label>
  );
}

/** Кнопки отправки/отмены для форм в модалке. */
export function FormActions({
  onCancel,
  loading,
  submitLabel,
  error,
}: {
  onCancel: () => void;
  loading?: boolean;
  submitLabel: string;
  error?: string | null;
}) {
  return (
    <>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Отмена
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </>
  );
}
