import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { ROUTES } from "../utils/constants";
import "../css/Page.css";

function ErrorPage() {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : null;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : "Something went wrong.";

  return (
    <div className="page">
      <div className="page-center">
        <h1 style={{ fontSize: "5rem", fontWeight: 700, color: "var(--button-mid)", margin: 40}}>
          {status ?? "Error"}
        </h1>
        <div style={{ width: 48, height: 3, borderRadius: 2, background: "var(--button-mid)", margin: "8px 0" }} />
          <p style={{ fontSize: "1.4rem", fontWeight: 500, color: "var(--text-1)", margin: 10, maxWidth: 350 }}>
            {message}
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-1)", opacity: 0.8, maxWidth: 350, margin: 10 }}>
            The page you're looking for doesn't exist or may have been moved.
            Head back home and try navigating from there.
          </p>
        <Link to={ROUTES.HOME} className="btn" style={{margin: 20}}>
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;
