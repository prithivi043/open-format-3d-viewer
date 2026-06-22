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

function Loader() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#0A0D1A] text-white">
      Loading…
    </div>
  );
}

const AuthPage = lazy(() => import("../pages/auth/AuthPage"));
const AuthCallback = lazy(() => import("../pages/auth/AuthCallback"));
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
const ModelUploadPage = lazy(() => import("../pages/models/ModelUploadPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
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
    path: "/auth/callback",
    element: (
      <Suspense fallback={<Loader />}>
        <AuthCallback />
      </Suspense>
    ),
  },

  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/me",
        element: (
          <Suspense fallback={<Loader />}>
            <UserProfilePage />
          </Suspense>
        ),
      },

      {
        path: "/",
        element: (
          <Suspense fallback={<Loader />}>
            <DashboardLayout />
          </Suspense>
        ),
        children: [
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<Loader />}>
                <DashboardHome />
              </Suspense>
            ),
          },

          {
            path: "projects",
            element: (
              <Suspense fallback={<Loader />}>
                <ProjectListPage />
              </Suspense>
            ),
          },

          {
            path: "projects/:id",
            element: (
              <Suspense fallback={<Loader />}>
                <ProjectDetailPage />
              </Suspense>
            ),
          },

          {
            path: "models/upload",
            element: (
              <Suspense fallback={<Loader />}>
                <ModelUploadPage />
              </Suspense>
            ),
          },

          {
            path: "viewer/:modelId",
            element: (
              <Suspense fallback={<Loader />}>
                <ViewerPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);
