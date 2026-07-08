/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, useRouteError } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import RootLayout from "../layouts/RootLayout";

function RouteError() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="h-screen flex items-center justify-center bg-[#f8f8fc] p-4">
      Something went wrong
    </div>
  );
}

function Loader() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#080a1a] text-white">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-400">Loading page components...</p>
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
    element: <RootLayout />,
    children: [
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
            path: "/viewer/:modelId",
            element: (
              <Suspense fallback={<Loader />}>
                <ViewerPage />
              </Suspense>
            ),
          },

          {
            element: (
              <Suspense fallback={<Loader />}>
                <DashboardLayout />
              </Suspense>
            ),
            children: [
              {
                index: true,
                element: <Navigate to="/dashboard" replace />,
              },
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
            ],
          },
        ],
      },
    ],
  },
]);
