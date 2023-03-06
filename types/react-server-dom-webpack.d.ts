declare module 'react-server-dom-webpack' {
  export interface WebpackMap {
    [id: string]: ClientReferenceMetadata;
  }

  export interface ClientReferenceMetadata {
    id: string;
    chunks: string[];
    name: string;
  }
}
