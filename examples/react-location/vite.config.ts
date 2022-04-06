import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Pages from 'vite-plugin-pages'
import { ReactLocationResolver } from './reactLocationResolver'

// const reactLocationResolver = {
//   resolveModuleIds() {
//     return ['~react-location-pages', 'virtual:generated-pages-react-location']
//   },
//   resolveExtensions() {
//     return ['tsx', 'jsx', 'ts', 'js']
//   },
//   async resolveRoutes(ctx) {
//     return resolveReactRoutes(ctx)
//   },
//   stringify: {
//     component: path => `React.createElement(${path})`,
//     dynamicImport: path => `React.lazy(() => import("${path}"))`,
//     final: code => `import React from "react";\n${code}`,
//   },
// }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    Pages({
      resolver: ReactLocationResolver(),
      extendRoute(route, parent) {
        //index routes need to be specifically pathed as /
        if (route.index) {
          route.path = '/'
        }

        return {
          ...route,
        }
      },
    }),
  ],
})
