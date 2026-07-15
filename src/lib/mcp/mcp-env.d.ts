// MCP tools run in a Node-like runtime; declare minimal process typing to
// satisfy Vite typecheck without pulling @types/node into the browser build.
declare const process: { env: Record<string, string | undefined> };
declare namespace NodeJS {
  type Timeout = ReturnType<typeof setTimeout>;
}
