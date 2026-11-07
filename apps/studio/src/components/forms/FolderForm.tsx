/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import React, { useState } from "react";

interface FolderFormProps {
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

// Extracted validation logic to a pure function for better testability
const validateFolderName = (
  name: string,
  t: (key: string) => string,
): string | undefined => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return t("forms.folderNameRequired");
  }
  if (trimmedName.length < 2) {
    return t("forms.folderNameMin");
  }

  return undefined;
};

export const FolderForm: React.FC<FolderFormProps> = ({
  initialName = "",
  onSubmit,
  onCancel,
  isLoading = false,
  title,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateFolderName(name, t);

    if (validationError) {
      setError(validationError);
      return;
    }

    await onSubmit(name.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);

    // Clear the error state as soon as the user starts interacting again
    if (error) {
      setError(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t("forms.folderName")}
        placeholder={t("forms.folderNamePlaceholder")}
        error={error}
        autoFocus
        value={name}
        onChange={handleChange}
        disabled={isLoading}
      />

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
          {title ?? t("forms.createFolder")}
        </Button>
      </div>
    </form>
  );
};
