import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import { Link } from "react-router-dom";
import NavbarComponent from "../components/Navbar";
import { useRef, useState } from "react";

function Dashboard() {
  const { user, role, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone.")) return;
    await deleteAccount();
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setUploadMsg(null);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const idToken = await user.getIdToken();

      const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile: { resumeUrl: base64 } }),
});

      if (!res.ok) throw new Error("Upload failed");
      setUploadMsg("Resume uploaded successfully!");
    } catch {
      setUploadMsg("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <NavbarComponent/>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Logged in as: {user?.email}</p>
      <p>Role: {role ?? "unknown (MongoDB may not be connected)"}</p>

{role === "job_seeker" && (
  <div className="flex flex-col items-center gap-2">
    <button
      className="btn btn-outline"
      onClick={() => fileInputRef.current?.click()}
      disabled={uploading}
    >
      {uploading ? "Uploading..." : "Upload Resume"}
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,.doc,.docx"
      className="hidden"
      onChange={handleResumeUpload}
    />
    {uploadMsg && (
      <p className={`text-sm ${uploadMsg.includes("failed") ? "text-red-500" : "text-green-500"}`}>
        {uploadMsg}
      </p>
    )}
  </div>
)}

{role === "employer" && (
  <Link to="/CreatePost" className="nav-button">
    Create Post
  </Link>
)}
        <button className="btn btn-error btn-outline" onClick={handleDelete}>Delete account</button>
    </div>
  );
}

export default Dashboard;
