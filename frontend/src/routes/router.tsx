import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

function RouteError() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#f8f8fc] p-4">
      Error
    </div>
  );
}

const AuthPage = lazy(() => import("../pages/auth/AuthPage"));
const UserProfilePage = lazy(() => import("../pages/auth/UserProfilePage"));
const DashboardLayout = lazy(
  () => import("../pages/dashboard/DashboardLayout"),
);
const DashboardHome = lazy(() => import("../pages/dashboard/DashboardPage"));
const ProjectListPage = lazy(() => import("../pages/projects/ProjectListPage"));
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
    path: "/",
    element: <Navigate to="/register" replace />,
  },

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
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      // Dashboard shell for /dashboard
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<Loader />}>
            <DashboardLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loader />}>
                <DashboardHome />
              </Suspense>
            ),
          },
        ],
      },

      // Same dashboard shell for /projects
      {
        path: "/projects",
        element: (
          <Suspense fallback={<Loader />}>
            <DashboardLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loader />}>
                <ProjectListPage />
              </Suspense>
            ),
          },
        ],
      },

      {
        path: "/me",
        element: (
          <Suspense fallback={<Loader />}>
            <UserProfilePage />
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
