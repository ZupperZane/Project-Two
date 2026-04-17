import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Root from "../layout/root";
import { ROUTES } from "../utils/constants";
import Home from "../pages/Home";

import Employers from "../pages/Employers";
import Employer from "../pages/EmployerID";

import Jobs from "../pages/Jobs";
import JobID from "../pages/JobID";

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
        path: "Home",
        element: <Home />,
      },
      {
        path: "Employers",
        element: <Employers />,
      },
        {
        path: "Employer",
        element: <Employer />,
      },
        {
        path: "Jobs",
        element: <Jobs />,
      },
        {
        path: "JobID",
        element: <JobID />,
      },
    ],
  },
];

export default mainRouter;
