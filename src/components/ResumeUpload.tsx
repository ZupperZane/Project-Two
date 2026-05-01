import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import useAuth from "../hooks/useAuth";

export type ResumeEntry = {
  fileId: string;
  label: string;
  filename: string;
  uploadedAt: string;
};

type Props = {
  resumes: ResumeEntry[];
  defaultResumeFileId: string | null;
  onUploaded: (entry: ResumeEntry, isDefault: boolean) => void;
  onDeleted: (fileId: string) => void;
  onSetDefault: (fileId: string) => void;
};

export default function ResumeUpload({ resumes, defaultResumeFileId, onUploaded, onDeleted, onSetDefault }: Props) {
  const { user } = useAuth();
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    if (!user) return;
    setUploadError(null);
    setUploading(true);
    try {
      const token = await user.getIdToken();
      const form = new FormData();
      form.append("resume", file);
      form.append("label", label.trim() || file.name);

      const res = await fetch("/api/job-seeker/resume", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
      } else {
        setLabel("");
        onUploaded(data.entry, data.isDefault);
      }
    } catch {
      setUploadError("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }, [user, label, onUploaded]);

  const handleDelete = async (fileId: string) => {
    if (!user || !confirm("Remove this resume?")) return;
    setDeletingId(fileId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/job-seeker/resume/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) onDeleted(fileId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (fileId: string) => {
    if (!user) return;
    setSettingDefaultId(fileId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/job-seeker/resume/${fileId}/default`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) onSetDefault(fileId);
    } finally {
      setSettingDefaultId(null);
    }
  };

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {resumes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {resumes.map((r) => {
            const isDefault = r.fileId === defaultResumeFileId;
            return (
              <div key={r.fileId} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: isDefault ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${isDefault ? "var(--button-heavy)" : "rgba(255,255,255,0.1)"}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--text-1)", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.label}
                    {isDefault && <span style={{ marginLeft: 8, fontSize: "0.72rem", fontWeight: 700, color: "var(--button-heavy)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Default</span>}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-1)", opacity: 0.45 }}>
                    {r.filename} · {new Date(r.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <a
                    href={`/api/resume/${r.fileId}`}
                    style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--button-heavy)", textDecoration: "none" }}
                  >
                    Download
                  </a>
                  {!isDefault && (
                    <button
                      onClick={() => handleSetDefault(r.fileId)}
                      disabled={settingDefaultId === r.fileId}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)", opacity: 0.5, padding: 0 }}
                    >
                      {settingDefaultId === r.fileId ? "..." : "Set default"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.fileId)}
                    disabled={deletingId === r.fileId}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "var(--neg-secondary)", opacity: 0.8, padding: 0 }}
                  >
                    {deletingId === r.fileId ? "..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          type="text"
          placeholder='Label (e.g. "Software Engineer Resume")'
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="form-input"
          style={{ fontSize: "0.88rem" }}
        />

        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? "var(--button-heavy)" : "rgba(255,255,255,0.3)"}`,
            borderRadius: 12,
            padding: "20px",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: isDragActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
            color: "var(--text-1)",
            fontSize: "0.88rem",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <input {...getInputProps()} />
          {uploading ? "Uploading..." : isDragActive ? "Drop here" : "Drag & drop or click to upload (PDF, DOC, DOCX)"}
        </div>

        {uploadError && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--neg-secondary)" }}>{uploadError}</p>
        )}
      </div>
    </div>
  );
}
