import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Root from "../layout/Root";
import { ROUTES } from "../utils/constants";
import Home from "../pages/Home";
import ErrorPage from "../pages/ErrorPage";

import Employers from "../pages/Employers";
import Employer from "../pages/EmployerID";

import Jobs from "../pages/Jobs";
import JobID from "../pages/JobID";

import Login from "../pages/LoginPage";
import Signup from "../pages/SignUpPage";

const mainRouter: RouteObject[] = [
  {
    path: ROUTES.LANDING,
    element: <Root />,
    errorElement: <ErrorPage />,
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
      },{
        path: "Login",
        element:<Login/>
      },{
        path: "signup",
        element: <Signup/>
      }
    ],
  },
];

export default mainRouter;
