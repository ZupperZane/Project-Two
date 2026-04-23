import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";

function Dashboard() {
  const { user, role, signOutUser, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone.")) return;
    await deleteAccount();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Logged in as: {user?.email}</p>
      <p>Role: {role ?? "unknown (MongoDB may not be connected)"}</p>
      <button className="btn btn-outline" onClick={signOutUser}>Sign out</button>
      <button className="btn btn-error btn-outline" onClick={handleDelete}>Delete account</button>
    </div>
  );
}

export default Dashboard;
