import type { RouteObject } from "react-router-dom";
import Root from "../layout/Root";
import PrivateRoute from "./PrivateRoute";
import { ROUTES } from "../utils/constants";

import Home from "../pages/Home";
//import ErrorPage from "../pages/ErrorPage";

const mainRouter: RouteObject[] = [
  {
    path: ROUTES.LANDING,
    element: <Root />,
    //errorElement: <ErrorPage />,
    children: [
      {
        path: ROUTES.HOME,
        element: (
           <Home />
        ),
      },
    ],
  },
];

export default mainRouter;
