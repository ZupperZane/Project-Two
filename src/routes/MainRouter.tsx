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
import ResetPasswordPage from "../pages/ResetPasswordPage";

import Dashboard from "../pages/Dashboard";
import PrivateRoute from "./PrivateRoute";

import DisplayAllJobs from "../components/DisplayAllJobs";
import SearchPage from "../pages/SearchPage";

import CreatePostPage from "../pages/CreatePost";
import ResetPassword from "../pages/ResetPassword";
import SelectRolePage from "../pages/SelectRolePage";


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
        path: "jobs/new",
        element: <PrivateRoute><CreatePostPage/></PrivateRoute>,
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
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "createPost",
        element:<Navigate to="/jobs/new" replace />
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
      {
        path: "select-role",
        element: <SelectRolePage />,
      },
            {
        path: "search",
        element: <SearchPage />,
      },
    ],
  },
];

export default mainRouter;
