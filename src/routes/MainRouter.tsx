import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Root from "../layout/root";
import { ROUTES } from "../utils/constants";
import Home from "../pages/Home";
import ErrorPage from "../pages/ErrorPage";

import Employers from "../pages/Employers";
import Employer from "../pages/EmployerID";

import Jobs from "../pages/Jobs";
import JobID from "../pages/JobID";

import Login from "../pages/LoginPage";
import Signup from "../pages/SignUpPage";
import Dashboard from "../pages/Dashboard";
import PrivateRoute from "./PrivateRoute";

import DisplayAllJobs from "../components/DisplayAllJobs";



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
        path: "home",
        element: <Home />,
      },
      {
        path: "employers",
        element: <Employers />,
      },
      {
        path: "employer/:id",
        element: <Employer />,
      },
      {
        path: "jobs",
        element: <Jobs />,
      },
      {
        path: "jobs/:id",
        element: <JobID />,
      },
      {
        path: "jobs/all",
        element: <DisplayAllJobs />,
      },
      {
        path: "dashboard",
        element: <PrivateRoute><Dashboard /></PrivateRoute>,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
    ],
  },
];

export default mainRouter;
