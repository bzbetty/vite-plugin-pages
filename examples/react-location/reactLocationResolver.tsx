// import {
//     buildReactRemixRoutePath,
//     buildReactRoutePath,
//     countSlash,
//     normalizeCase,
//   } from 'vite-plugin-pages/dist/'
//   import { generateClientCode } from '../../src/stringify'


import { Optional, PageResolver, ResolvedOptions, PageContext } from 'vite-plugin-pages';


export interface ReactRouteBase {
  caseSensitive?: boolean
  children?: ReactRouteBase[]
  element?: string
  path?: string
  rawRoute: string

  pendingMs?: number
  pendingMinMs?: number
  errorElement?: string
  pendingElement?: string
  loader?: string
  unloader?: string
  loaderMaxAge?: number
  onMatch?: (match: any) => void | undefined | ((match: any) => void)
  onTransition?: (match: any) => void
  meta?: any
}

export interface ReactRoute extends Omit<Optional<ReactRouteBase, 'rawRoute' | 'path'>, 'children'> {
  children?: ReactRoute[]
}

function prepareRoutes(
  routes: ReactRoute[],
  options: ResolvedOptions,
  parent?: ReactRoute,
) {
  for (const route of routes) {
    if (parent) {
      route.path = route.path?.replace(/^\//, '')
      if (route.path == '') {
        route.path = '/';
      }
    }

    if (route.children)
      route.children = prepareRoutes(route.children, options, route)

    delete route.rawRoute

    Object.assign(route, options.extendRoute?.(route, parent) || {})
  }

  return routes
}

async function resolveReactRoutes(ctx: PageContext) {
  const { routeStyle, caseSensitive } = ctx.options
  const nuxtStyle = routeStyle === 'nuxt'

  const pageRoutes = [...ctx.pageRouteMap.values()]
  // sort routes for HMR
  //.sort((a, b) => countSlash(a.route) - countSlash(b.route))

  const routes: ReactRouteBase[] = []

  pageRoutes.forEach((page) => {
    const pathNodes = page.route.split('/')
    const element = page.path.replace(ctx.root, '')
    let parentRoutes = routes

    for (let i = 0; i < pathNodes.length; i++) {
      const node = pathNodes[i]

      const route: ReactRouteBase = {
        caseSensitive,
        path: '',
        rawRoute: pathNodes.slice(0, i + 1).join('/'),
      }

      if (i === pathNodes.length - 1) {
        route.element = element
        route.errorElement = element
        route.pendingElement = element
        route.pendingMs = 100;
        route.loader = element
      }

      //todo normalizeCase
      const isIndexRoute = node.toLocaleLowerCase().endsWith('index')

      if (!route.path && isIndexRoute) {
        route.path = '/';
      } else if (!isIndexRoute) {
        // if (routeStyle === 'remix')
        //   route.path = buildReactRemixRoutePath(node)
        // else

        route.path = buildReactRoutePath(node)
      }

      // Check parent exits
      const parent = parentRoutes.find((parent) => {
        return pathNodes.slice(0, i).join('/') === parent.rawRoute
      })

      if (parent) {
        // Make sure children exits in parent
        parent.children = parent.children || []
        // Append to parent's children
        parentRoutes = parent.children
      }

      const exits = parentRoutes.some((parent) => {
        return pathNodes.slice(0, i + 1).join('/') === parent.rawRoute
      })
      if (!exits)
        parentRoutes.push(route)
    }
  })

  // sort by dynamic routes
  let finalRoutes = prepareRoutes(routes, ctx.options)

  finalRoutes = (await ctx.options.onRoutesGenerated?.(finalRoutes)) || finalRoutes

  return finalRoutes
}

export const dynamicRouteRE = /^\[(.+)\]$/
export const cacheAllRouteRE = /^\[\.{3}(.*)\]$/
export const replaceDynamicRouteRE = /^\[(?:\.{3})?(.*)\]$/

function buildReactRoutePath(node: string): string | undefined {
  function normalizeName(name: string, isDynamic: boolean, nuxtStyle = false) {
    if (!isDynamic) return name
    return name.replace(replaceDynamicRouteRE, '$1')
  }

  const isDynamic = dynamicRouteRE.test(node)
  const isCatchAll = cacheAllRouteRE.test(node);
  const normalizedName = normalizeName(node, isDynamic)

  if (isDynamic) {
    if (isCatchAll)
      return '*'

    return `:${normalizedName}`
  }

  return `${normalizedName}`
}

export function stringifyRoutes(
  preparedRoutes: any[],
  options: ResolvedOptions,
) {
  const importsMap: Map<string, string> = new Map()

  function getImportString(path: string, importName: string) {
    const mode = resolveImportMode(path, options)
    return `import ${importName} from "${path}"`;
    // return mode === 'sync'
    //   ? `import ${importName} from "${path}"`
    //   : `const ${importName} = ${options.resolver.stringify?.dynamicImport?.(path) || `() => import("${path}")`
    //   }`
  }

  function getImportName(value: string) {
    let importName = importsMap.get(value)

    if (!importName)
      importName = `__pages_import_${importsMap.size}__`;

    importsMap.set(value, importName)
    return importName;
  }

  function replaceFunction(key: any, value: any) {
    let importName = "";

    switch (key) {
      case 'element':
        importName = getImportName(value);
        importName = options.resolver.stringify?.component?.(importName) || importName
        return `✌${importName}✌`;
      case 'loader':
        importName = getImportName(value);
        return `✌${importName}.loader✌`;

      case 'errorElement':
        importName = getImportName(value);
        return `✌${importName}.errorElement ? React.createElement(${importName}.errorElement) : undefined✌`;

      case 'pendingElement':
        importName = getImportName(value);
        return `✌${importName}.pendingElement ? React.createElement(${importName}.pendingElement) : undefined✌`;
    }


    return value
  }


  const stringRoutes = JSON
    .stringify(preparedRoutes, replaceFunction)
    .replaceAll(/\"✌/g, "")
    .replaceAll(/✌\"/g, "");

  const imports = Array.from(importsMap).map(args => getImportString(...args))

  return {
    imports,
    stringRoutes,
  }
}

export function resolveImportMode(
  filepath: string,
  options: ResolvedOptions,
) {
  const mode = options.importMode
  if (typeof mode === 'function')
    return mode(filepath, options)
  return mode
}


function generateClientCode(routes: any[], options: ResolvedOptions) {
  const { imports, stringRoutes } = stringifyRoutes(routes, options)
  const code = `${imports.join(';\n')};\n\nconst routes = ${stringRoutes};\n\nexport default routes;`
  return options.resolver.stringify?.final?.(code) || code
}

export function ReactLocationResolver(): PageResolver {
  return {
    resolveModuleIds() {
      return ['~react-pages', 'virtual:generated-pages-react']
    },
    resolveExtensions() {
      return ['tsx', 'jsx', 'ts', 'js']
    },
    async resolveRoutes(ctx) {
      var routes = await resolveReactRoutes(ctx);
      //console.log(JSON.stringify(routes));
      let client = generateClientCode(routes, ctx.options);
      //console.log(client);

      client = (await ctx.options.onClientGenerated?.(client)) || client;
      return client
    },
    stringify: {
      component: path => `React.createElement(${path})`,
      dynamicImport: path => `React.lazy(() => import("${path}"))`,
      final: code => `import React from "react";\n${code}`,
    },
  }
}