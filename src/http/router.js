function matchPath(pattern, pathname) {
  if (typeof pattern === 'string') return pattern === pathname ? {} : null;
  const found = pattern.exec(pathname);
  return found ? { ...found.groups } : null;
}

// Busco la ruta por método y ruta; si solo coincide la ruta, devuelvo los métodos permitidos.
export function createRouter(routes) {
  return function match(method, pathname) {
    const allowed = [];
    for (const route of routes) {
      const params = matchPath(route.path, pathname);
      if (!params) continue;
      if (route.method === method) return { route, params };
      allowed.push(route.method);
    }
    return allowed.length ? { allowed } : null;
  };
}
