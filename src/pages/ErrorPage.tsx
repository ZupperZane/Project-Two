import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { ROUTES } from "../utils/constants";

function ErrorPage() {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : null;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : "Something went wrong.";

  return (
    <div className="error-page">
      <h1 className="error-code">{status ?? "Err"}</h1>
      <div className="error-divider" />
      <p className="error-title">{message}</p>
      <p className="error-body">
        The page you're looking for doesn't exist or may have been moved.
        Head back home and try navigating from there.
      </p>
      <Link to={ROUTES.HOME} className="error-home-btn">
        Return to Home
      </Link>
    </div>
  );
}

export default ErrorPage;