import { FileUp, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";

export type FileDropProps = {
  onFiles: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  title: string;
  description?: ReactNode;
  className?: string;
  workingLabel?: string;
  errorLabel?: string;
};

export function FileDrop({
  onFiles,
  accept,
  multiple = true,
  disabled = false,
  title,
  description,
  className = "",
  workingLabel = "Preparing files…",
  errorLabel = "Could not prepare these files",
}: FileDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [working, setWorking] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState("");
  const [failed, setFailed] = useState(false);
  const process = async (files: File[]) => {
    if (disabled || files.length === 0) return;
    setWorking(true);
    setFailed(false);
    setSelectedFiles(files.length === 1 ? files[0]!.name : `${files.length} files selected`);
    try {
      await onFiles(files);
    } catch (error) {
      setFailed(true);
      setSelectedFiles(error instanceof Error ? error.message : errorLabel);
    } finally {
      setWorking(false);
    }
  };
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void process(Array.from(event.target.files));
    event.target.value = "";
  };
  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOver(false);
    if (!disabled && event.dataTransfer.files.length)
      void process(Array.from(event.dataTransfer.files));
  };
  return (
    <>
      <button
        type="button"
        disabled={disabled || working}
        aria-busy={working}
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
        }}
        onDrop={drop}
        className={`hosanna-file-drop ${over ? "is-over" : ""} ${className}`}
      >
        <span className="hosanna-file-drop-icon">
          <UploadCloud size={21} />
        </span>
        <span className="hosanna-file-drop-copy">
          <strong>{working ? workingLabel : failed ? errorLabel : title}</strong>
          {selectedFiles || description ? (
            <span className={failed ? "text-m3-danger" : undefined} aria-live="polite">
              {selectedFiles || description}
            </span>
          ) : null}
        </span>
        <FileUp className="hosanna-file-drop-end" size={18} aria-hidden="true" />
      </button>
      <input
        ref={input}
        className="sr-only"
        tabIndex={-1}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={choose}
      />
    </>
  );
}
