import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { router } from "./app/router";
import "./styles.css";

// biome-ignore lint/style/noNonNullAssertion: #root は index.html に必ずあり、無ければ起動できないので落ちて良い
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
