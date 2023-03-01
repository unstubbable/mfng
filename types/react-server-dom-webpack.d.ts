declare module 'react-server-dom-webpack' {
  export interface WebpackMap {
    [filepath: string]: {
      [name: string]: ClientReferenceMetadata;
    };
  }

  export interface ClientReferenceMetadata {
    id: string;
    chunks: string[];
    name: string;
    async: boolean;
  }
}
