import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import useAuth from "../hooks/useAuth";

type Props = {
  currentFileId: string | null;
  onUploaded: (fileId: string) => void;
};

export default function ResumeUpload({ currentFileId, onUploaded }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    if (!user) return;
    setError(null);
    setUploading(true);

    try {
      const token = await user.getIdToken();
      const form = new FormData();
      form.append("resume", file);

      const res = await fetch("/api/job-seeker/resume", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
      } else {
        onUploaded(data.fileId);
      }
    } catch {
      setError("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }, [user, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && upload(files[0]),
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "var(--button-heavy)" : "rgba(255,255,255,0.3)"}`,
          borderRadius: 12,
          padding: "24px 20px",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: isDragActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
          color: "var(--text-1)",
          fontSize: "0.9rem",
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />
        {uploading
          ? "Uploading..."
          : isDragActive
          ? "Drop your resume here"
          : "Drag & drop your resume (PDF, DOC, DOCX), or click to browse"}
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--neg-secondary)" }}>{error}</p>
      )}

      {currentFileId && !uploading && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-1)", opacity: 0.7 }}>
          Resume on file —{" "}
          <a href={`/api/resume/${currentFileId}`}
            style={{ color: "var(--button-heavy)", fontWeight: 600, textDecoration: "none" }}>
            Download
          </a>
        </p>
      )}
    </div>
  );
}
