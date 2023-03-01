declare module 'react-server-dom-webpack/node-loader' {
  export type ResolveFunction = (
    specifier: string,
    context: ResolveContext,
    nextResolve: ResolveFunction,
  ) => ResolveResult | Promise<ResolveResult>;

  export interface ResolveContext {
    conditions: string[];
    importAssertions?: object;
    parentURL?: string;
  }

  export interface ResolveResult {
    format?: 'builtin' | 'commonjs' | 'json' | 'module' | 'wasm';
    shortCircuit?: boolean;
    url: string;
  }

  export type LoadFunction = (
    url: string,
    context: LoadContext,
    nextLoad: LoadFunction,
  ) => LoadResult | Promise<LoadResult>;

  export interface LoadContext {
    conditions: string[];
    format?: string | null;
    importAssertions?: object;
  }

  export interface LoadResult {
    format: 'builtin' | 'commonjs' | 'json' | 'module' | 'wasm';
    shortCircuit?: boolean;
    source: string | ArrayBuffer | Uint8Array;
  }

  export const resolve: ResolveFunction;
  export const load: LoadFunction;
}
