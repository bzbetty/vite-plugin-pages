import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { rankRoutes } from '@tanstack/react-location-rank-routes'
import 'regenerator-runtime/runtime';


import {
  ReactLocation,
  Router,
} from "@tanstack/react-location";

import "./index.css";

import routes from "~react-pages";

// eslint-disable-next-line no-console
console.log('catsup', routes);

const location = new ReactLocation();

ReactDOM.render(
  <React.StrictMode>
    <Suspense fallback={<p>Loading...</p>}>
      <Router location={location} routes={routes} filterRoutes={rankRoutes} useErrorBoundary={true} />
    </Suspense>
  </React.StrictMode>,
  document.getElementById("root")
);

