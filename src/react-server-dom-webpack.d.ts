declare module 'react-server-dom-webpack' {
  export interface WebpackSSRMap {
    [clientId: string]: {
      [clientExportName: string]: ClientReferenceMetadata;
    };
  }

  export interface ClientReferenceMetadata {
    id: string;
    chunks: string[];
    name: string;
    async: boolean;
  }
}
