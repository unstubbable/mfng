declare module 'react-server-dom-webpack/plugin' {
  import type {Compiler} from 'webpack';

  export interface ReactFlightWebpackPluginOptions {
    isServer: boolean;
    clientReferences?: ClientReferencePath | readonly ClientReferencePath[];
    chunkName?: string;
    clientManifestFilename?: string;
    ssrManifestFilename?: string;
  }

  export type ClientReferencePath = string | ClientReferenceSearchPath;

  export interface ClientReferenceSearchPath {
    directory: string;
    recursive?: boolean;
    include: RegExp;
    exclude?: RegExp;
  }

  export default class ReactFlightWebpackPlugin {
    constructor(options: ReactFlightWebpackPluginOptions);
    apply: (compiler: Compiler) => void;
  }
}
