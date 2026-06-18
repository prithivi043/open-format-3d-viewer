import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

const AuthPage = lazy(() => import("../pages/auth/AuthPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const ProjectList = lazy(() => import("../pages/projects/ProjectList"));
const ProjectDetailPage = lazy(
  () => import("../pages/projects/ProjectDetailPage"),
);
const ViewerPage = lazy(() => import("../pages/viewer/ViewerPage"));

function Loader() {
  return (
    <div className="h-screen flex items-center justify-center">Loading...</div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<Loader />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<Loader />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />, // Protect all child routes
    children: [
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<Loader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/projects",
        element: (
          <Suspense fallback={<Loader />}>
            <ProjectList />
          </Suspense>
        ),
      },
      {
        path: "/projects/:id",
        element: (
          <Suspense fallback={<Loader />}>
            <ProjectDetailPage />
          </Suspense>
        ),
      },
      {
        path: "/viewer/:modelId",
        element: (
          <Suspense fallback={<Loader />}>
            <ViewerPage />
          </Suspense>
        ),
      },
    ],
  },
]);
