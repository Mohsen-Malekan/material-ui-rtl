import React, { ReactNode } from "react";

export type Route = {
  path: string;
  component: ReactNode;
  auth: boolean;
};

export const redirect = {
  from: "/",
  to: "/home"
};

export const login = {
  path: "/login",
  component: () => <h1>ورود</h1>,
  auth: false
};

const routes: Route[] = [
  {
    path: "/home",
    component: () => <h1>خانه</h1>,
    auth: false
  },
  {
    path: "/about",
    component: () => <h1>درباره ما</h1>,
    auth: true
  },
  login
];

export default routes;
