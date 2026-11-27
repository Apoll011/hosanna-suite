import { FileUp, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";

export type FileDropProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  title: string;
  description?: ReactNode;
  className?: string;
};

export function FileDrop({ onFiles, accept, multiple = true, disabled = false, title, description, className = "" }: FileDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) onFiles(Array.from(event.target.files));
    event.target.value = "";
  };
  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOver(false);
    if (!disabled && event.dataTransfer.files.length) onFiles(Array.from(event.dataTransfer.files));
  };
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}
        onDrop={drop}
        className={`hosanna-file-drop ${over ? "is-over" : ""} ${className}`}
      >
        <span className="hosanna-file-drop-icon"><UploadCloud size={21} /></span>
        <span className="hosanna-file-drop-copy"><strong>{title}</strong>{description ? <span>{description}</span> : null}</span>
        <FileUp className="hosanna-file-drop-end" size={18} aria-hidden="true" />
      </button>
      <input ref={input} className="sr-only" tabIndex={-1} type="file" accept={accept} multiple={multiple} onChange={choose} />
    </>
  );
}
