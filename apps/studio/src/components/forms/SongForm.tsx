/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Button, Input, SpringDropdown, type SpringDropdownOption } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import { Folder } from "@/src/types";
import { useMemo, useState } from "react";

interface SongFormData {
  title: string;
  artist: string;
  folderId: string;
  tags: string;
}

const validateSongForm = (
  values: SongFormData,
  t: (key: string) => string,
): Record<string, string> | undefined => {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) {
    errors.title = t("forms.songTitleRequired");
  }
  if (!values.artist.trim()) {
    errors.artist = t("forms.artistRequired");
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
};

interface SongFormProps {
  initialValues?: {
    title?: string;
    artist?: string;
    folderId?: string | null;
    tags?: string[];
  };
  folders: Folder[];
  onSubmit: (data: {
    title: string;
    artist: string;
    folderId: string | null;
    tags: string[];
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SongForm: React.FC<SongFormProps> = ({
  initialValues,
  folders,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<SongFormData>({
    title: initialValues?.title || "",
    artist: initialValues?.artist || t("forms.unknownArtist"),
    folderId: initialValues?.folderId || "",
    tags: initialValues?.tags ? initialValues.tags.join(", ") : "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const folderOptions = useMemo<SpringDropdownOption<string>[]>(
    () => [
      { id: "", label: t("forms.rootLevel") },
      ...folders.map((folder) => ({ id: folder.id, label: folder.name })),
    ],
    [folders, t],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateSongForm(formData, t);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    const parsedTags = formData.tags
      ? formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await onSubmit({
      title: formData.title.trim(),
      artist: formData.artist.trim(),
      folderId: formData.folderId || null,
      tags: parsedTags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="title"
        label={t("forms.songTitle")}
        placeholder={t("forms.songTitlePlaceholder")}
        error={errors.title}
        value={formData.title}
        onChange={handleChange}
        disabled={isLoading}
      />

      <Input
        name="artist"
        label={t("forms.artistLabel")}
        placeholder={t("forms.artistPlaceholder")}
        error={errors.artist}
        value={formData.artist}
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-label ml-0.5">{t("forms.folderCategory")}</label>
        <SpringDropdown
          mode="single"
          options={folderOptions}
          selected={formData.folderId}
          onChange={(folderId) => {
            setFormData((current) => ({ ...current, folderId }));
            setErrors((current) => ({ ...current, folderId: "" }));
          }}
          ariaLabel={t("forms.folderCategory")}
          disabled={isLoading}
          className="h-11 w-full justify-between text-sm"
        />
      </div>

      <Input
        name="tags"
        label={t("forms.tagsLabel")}
        placeholder={t("forms.tagsPlaceholder")}
        error={errors.tags}
        value={formData.tags}
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {t("forms.saveSong")}
        </Button>
      </div>
    </form>
  );
};
