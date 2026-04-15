import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Root from "../layout/root";
import { ROUTES } from "../utils/constants";
import Home from "../pages/Home";

const mainRouter: RouteObject[] = [
  {
    path: ROUTES.LANDING,
    element: <Root />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "home",
        element: <Home />,
      },
    ],
  },
];

export default mainRouter;