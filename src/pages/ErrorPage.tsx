import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { ROUTES } from "../utils/constants";

function ErrorPage() {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : null;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : "Something went wrong.";

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-6xl font-bold">{status ?? "Error"}</h1>
      <p className="text-xl">{message}</p>
      <Link to={ROUTES.HOME} className="btn btn-primary">
        Go Home
      </Link>
    </div>
  );
}

export default ErrorPage;
