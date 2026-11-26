// SPDX-License-Identifier: AGPL-3.0-only
import {
  HOSANNA_EXPORT_MAX_BYTES,
  parseHosannaExportJson,
  type HosannaExportDocument,
} from "@hosanna/types";
import { Badge, Button, Modal, useCan } from "@hosanna/ui";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSync } from "@/src/contexts/SyncContext";
import { getDatabase } from "@/src/db";
import { useI18n } from "@/src/lib/i18n";
import {
  executeHosannaImport,
  HosannaImportError,
  planHosannaImport,
  type ImportConflictPolicy,
  type ImportPermissions,
} from "@/src/lib/import/hosannaExport";
import { Folder } from "@/src/types";
import {
  AlertTriangle,
  FileJson,
  Folder as FolderIcon,
  LibraryBig,
  Loader2,
  Music,
  Upload,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface HosannaExportImportModalProps {
  isOpen: boolean;
  initialFile?: File | null;
  defaultTargetFolderId?: string | null;
  folders: Folder[];
  onClose: () => void;
  onImported?: () => void | Promise<void>;
}

const MAX_MB = Math.round(HOSANNA_EXPORT_MAX_BYTES / (1024 * 1024));

export const HosannaExportImportModal: React.FC<HosannaExportImportModalProps> = ({
  isOpen,
  initialFile = null,
  defaultTargetFolderId = null,
  folders,
  onClose,
  onImported,
}) => {
  const { t } = useI18n();
  const { showToast } = useSync();
  const { hasAcceptedTrial } = useAuth();
  const { granted: canCreateSong } = useCan("song.create");
  const { granted: canCreateFolder } = useCan("folder.create");
  const { granted: canCreateCollection } = useCan("collection.create");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedDoc, setParsedDoc] = useState<HosannaExportDocument | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [conflictPolicy, setConflictPolicy] = useState<ImportConflictPolicy>("skip");
  const [targetFolderId, setTargetFolderId] = useState<string | null>(defaultTargetFolderId);
  const [existingLibrary, setExistingLibrary] = useState<{
    folders: ReturnType<Awaited<ReturnType<typeof getDatabase>>["folders"]["getAllRaw"]>;
    songs: ReturnType<Awaited<ReturnType<typeof getDatabase>>["songs"]["getAllRaw"]>;
    collections: ReturnType<Awaited<ReturnType<typeof getDatabase>>["collections"]["getAllRaw"]>;
  } | null>(null);

  const loadFile = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setParsedDoc(null);
      setParseError(null);

      if (file.size > HOSANNA_EXPORT_MAX_BYTES) {
        setParseError(t("modals.hosannaExportImport.errorFileTooLarge", { maxMb: MAX_MB }));
        return;
      }

      try {
        const text = await file.text();
        const result = parseHosannaExportJson(text, file.size);
        if ("data" in result) {
          setParsedDoc(result.data);
          return;
        }
        const failure = result as Extract<typeof result, { ok: false }>;
        if (failure.code === "file_too_large") {
          setParseError(t("modals.hosannaExportImport.errorFileTooLarge", { maxMb: MAX_MB }));
        } else if (failure.code === "malformed_json") {
          setParseError(t("modals.hosannaExportImport.errorMalformedJson"));
        } else if (failure.code === "unsupported_version") {
          setParseError(
            t("modals.hosannaExportImport.errorUnsupportedVersion", {
              version: String(failure.foundVersion ?? "?"),
            }),
          );
        } else if (failure.code === "invalid_format") {
          setParseError(t("modals.hosannaExportImport.errorInvalidFormat"));
        } else {
          setParseError(failure.message);
        }
      } catch {
        setParseError(t("modals.hosannaExportImport.errorMalformedJson"));
      }
    },
    [t],
  );

  useEffect(() => {
    if (!isOpen) return;
    setTargetFolderId(defaultTargetFolderId ?? null);
    setConflictPolicy("skip");
    setSelectedFile(null);
    setParsedDoc(null);
    setParseError(null);

    let active = true;
    void getDatabase().then((db) => {
      if (!active) return;
      setExistingLibrary({
        folders: db.folders.getAllRaw(),
        songs: db.songs.getAllRaw(),
        collections: db.collections.getAllRaw(),
      });
    });

    if (initialFile) {
      void loadFile(initialFile);
    }

    return () => {
      active = false;
    };
  }, [isOpen, initialFile, defaultTargetFolderId, loadFile]);

  const permissions = useMemo<ImportPermissions>(
    () => ({
      canCreateSong,
      canCreateFolder,
      canCreateCollection,
      canWrite: hasAcceptedTrial !== false,
    }),
    [canCreateSong, canCreateFolder, canCreateCollection, hasAcceptedTrial],
  );

  const permissionError = useMemo(() => {
    if (!parsedDoc) return null;
    if (!permissions.canWrite) {
      return t("modals.hosannaExportImport.errorSubscriptionBlocked");
    }
    const missing: string[] = [];
    if (parsedDoc.folders.length > 0 && !permissions.canCreateFolder) missing.push("folder.create");
    if (parsedDoc.songs.length > 0 && !permissions.canCreateSong) missing.push("song.create");
    if (parsedDoc.collections.length > 0 && !permissions.canCreateCollection) {
      missing.push("collection.create");
    }
    if (missing.length > 0) {
      return t("modals.hosannaExportImport.errorPermissionDenied", {
        permissions: missing.join(", "),
      });
    }
    return null;
  }, [parsedDoc, permissions, t]);

  const previewPlan = useMemo(() => {
    if (!parsedDoc || !existingLibrary) return null;
    return planHosannaImport(parsedDoc, existingLibrary, {
      targetFolderId,
      conflictPolicy,
    });
  }, [parsedDoc, existingLibrary, targetFolderId, conflictPolicy]);

  const handleConfirm = async () => {
    if (!parsedDoc || permissionError || isImporting) return;
    setIsImporting(true);
    try {
      const db = await getDatabase();
      const result = await executeHosannaImport(db, parsedDoc, {
        targetFolderId,
        conflictPolicy,
        permissions,
      });

      showToast(
        t("modals.hosannaExportImport.successToast", {
          folders: result.foldersCreated,
          songs: result.songsCreated + result.songsOverwritten,
          collections: result.collectionsCreated,
        }),
        "success",
      );
      await onImported?.();
      onClose();
    } catch (err) {
      if (err instanceof HosannaImportError) {
        if (err.code === "subscription_blocked") {
          setParseError(t("modals.hosannaExportImport.errorSubscriptionBlocked"));
        } else {
          setParseError(
            t("modals.hosannaExportImport.errorPermissionDenied", {
              permissions: err.missingPermissions.join(", "),
            }),
          );
        }
      } else {
        setParseError(err instanceof Error ? err.message : t("layout.uploadErrorGeneric"));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const activeFolders = useMemo(
    () => folders.filter((f) => !f.deleted).sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isImporting) onClose();
      }}
      title={t("modals.hosannaExportImport.title")}
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isImporting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!parsedDoc || Boolean(permissionError) || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("modals.hosannaExportImport.importing")}
              </>
            ) : (
              t("modals.hosannaExportImport.importAction")
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void loadFile(file);
            e.target.value = "";
          }}
        />

        {!parsedDoc && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void loadFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-m3-primary bg-m3-primary/5"
                : "border-m3-border hover:border-m3-primary/50 bg-m3-bg/50"
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-m3-primary" />
            <p className="text-body font-medium text-m3-text">
              {t("modals.hosannaExportImport.dropOrBrowse")}
            </p>
            <p className="text-caption mt-1">
              {t("modals.hosannaExportImport.dropHint", { maxMb: MAX_MB })}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                {t("modals.hosannaExportImport.chooseFile")}
              </Button>
            </div>
          </div>
        )}

        {parseError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-m3-danger/30 bg-m3-danger/10 text-m3-danger text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        {parsedDoc && previewPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-m3-border bg-m3-bg/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileJson className="w-5 h-5 text-m3-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-m3-text truncate">
                    {selectedFile?.name ?? "hosanna-export.json"}
                  </div>
                  <div className="text-caption">
                    {t("modals.hosannaExportImport.previewHeading")}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {t("modals.hosannaExportImport.changeFile")}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg border border-m3-border bg-m3-card flex items-center gap-2.5">
                <FolderIcon className="w-4 h-4 text-m3-secondary shrink-0" />
                <span className="text-sm font-medium text-m3-text tabular-nums">
                  {t("modals.hosannaExportImport.foldersCount", {
                    count: parsedDoc.folders.length,
                  })}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-m3-border bg-m3-card flex items-center gap-2.5">
                <Music className="w-4 h-4 text-m3-secondary shrink-0" />
                <span className="text-sm font-medium text-m3-text tabular-nums">
                  {t("modals.hosannaExportImport.songsCount", {
                    count: parsedDoc.songs.length,
                  })}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-m3-border bg-m3-card flex items-center gap-2.5">
                <LibraryBig className="w-4 h-4 text-m3-secondary shrink-0" />
                <span className="text-sm font-medium text-m3-text tabular-nums">
                  {t("modals.hosannaExportImport.collectionsCount", {
                    count: parsedDoc.collections.length,
                  })}
                </span>
              </div>
            </div>

            {previewPlan.conflicts.length > 0 && (
              <div className="p-3 rounded-lg border border-m3-warning/40 bg-m3-warning/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-m3-warning">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {t("modals.hosannaExportImport.conflictsDetected", {
                        count: previewPlan.conflicts.length,
                      })}
                    </span>
                  </div>
                  <Badge variant="warning">{previewPlan.conflicts.length}</Badge>
                </div>
                <ul className="text-xs text-m3-secondary space-y-0.5 max-h-24 overflow-y-auto">
                  {previewPlan.conflicts.slice(0, 5).map((c) => (
                    <li key={c.exportSong.id} className="truncate">
                      {c.exportSong.title}
                      {c.exportSong.artist ? ` - ${c.exportSong.artist}` : ""}
                    </li>
                  ))}
                  {previewPlan.conflicts.length > 5 && <li>+{previewPlan.conflicts.length - 5}</li>}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-label block">
                {t("modals.hosannaExportImport.targetFolderLabel")}
              </label>
              <select
                value={targetFolderId ?? ""}
                onChange={(e) => setTargetFolderId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-md border border-m3-border bg-m3-bg text-sm text-m3-text"
                disabled={isImporting}
              >
                <option value="">{t("modals.hosannaExportImport.rootFolder")}</option>
                {activeFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {previewPlan.conflicts.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-label block">
                  {t("modals.hosannaExportImport.conflictPolicyLabel")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      ["skip", t("modals.hosannaExportImport.conflictSkip")],
                      ["keep-both", t("modals.hosannaExportImport.conflictKeepBoth")],
                      ["overwrite", t("modals.hosannaExportImport.conflictOverwrite")],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConflictPolicy(value)}
                      disabled={isImporting}
                      className={`px-3 py-2 rounded-md border text-xs font-medium text-left transition-colors cursor-pointer ${
                        conflictPolicy === value
                          ? "border-m3-primary bg-m3-primary/10 text-m3-primary"
                          : "border-m3-border bg-m3-bg text-m3-text hover:bg-m3-hover"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {permissionError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-m3-danger/30 bg-m3-danger/10 text-m3-danger text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{permissionError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
