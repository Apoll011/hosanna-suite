/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import React, { useState } from "react";

// --- SERVICE FORM ---

interface ServiceFormData {
  name: string;
  date: string;
  notes: string;
}

// Extracted pure validation function
const validateServiceForm = (
  values: ServiceFormData,
  t: (key: string) => string,
): Record<string, string> | undefined => {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = t("forms.serviceTitleRequired");
  }
  if (!values.date.trim()) {
    errors.date = t("forms.serviceDateRequired");
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
};

interface ServiceFormProps {
  initialValues?: {
    name?: string;
    date?: string;
    notes?: string;
  };
  onSubmit: (data: {
    name: string;
    date: string;
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<ServiceFormData>({
    name: initialValues?.name || "",
    date: initialValues?.date
      ? new Date(initialValues.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    notes: initialValues?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the specific field error when the user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateServiceForm(formData, t);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit({
      name: formData.name.trim(),
      date: new Date(formData.date).toISOString(),
      notes: formData.notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="name"
        label={t("forms.serviceTitle")}
        placeholder={t("forms.serviceTitlePlaceholder")}
        error={errors.name}
        autoFocus
        value={formData.name}
        onChange={handleChange}
        disabled={isLoading}
      />

      <Input
        name="date"
        label={t("forms.scheduledDate")}
        type="date"
        error={errors.date}
        value={formData.date}
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-label ml-0.5">{t("forms.planningNotes")}</label>
        <textarea
          name="notes"
          rows={3}
          placeholder={t("forms.planningNotesPlaceholder")}
          value={formData.notes}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full rounded-[var(--radius-md)] border border-m3-border bg-m3-card text-m3-text text-sm px-3.5 py-2.5 min-h-10 transition-colors placeholder:text-m3-input focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary hover:border-m3-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {t("forms.saveService")}
        </Button>
      </div>
    </form>
  );
};
