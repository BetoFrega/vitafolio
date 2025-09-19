import { type RouteObject } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { ItemsPage } from "./pages/ItemsPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "collections",
        element: <CollectionsPage />,
      },
      {
        path: "collections/:collectionId/items",
        element: <ItemsPage />,
      },
    ],
  },
];
