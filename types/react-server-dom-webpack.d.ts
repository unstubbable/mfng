declare module 'react-server-dom-webpack' {
  import type {
    Component,
    Context,
    LazyExoticComponent,
    ReactElement,
  } from 'react';

  export interface ClientManifest {
    [id: string]: ClientReferenceMetadata;
  }

  export interface SSRManifest {
    moduleMap: SSRModuleMap;
    moduleLoading: ModuleLoading | null;
  }

  export interface SSRModuleMap {
    [clientId: string]: {
      [clientExportName: string]: ClientReferenceMetadata;
    };
  }

  export interface ModuleLoading {
    prefix: string;
    crossOrigin?: 'use-credentials' | '';
  }

  export interface ClientReferenceMetadata {
    id: string | number;
    chunks: (string | number)[];
    name: string;
  }

  export interface ServerReference {
    $$typeof: symbol;
    $$id: string;
    $$bound: null | ReactClientValue[];
  }

  // Serializable values for the client
  export type ReactClientValue =
    // Server Elements and Lazy Components are unwrapped on the Server
    | ReactElement
    // | LazyExoticComponent<ReactClientValue> // TODO: this is invalid and widens the type to any
    // References are passed by their value
    | ClientReferenceMetadata
    | ServerReference
    // The rest are passed as is. Sub-types can be passed in but lose their
    // subtype, so the receiver can only accept once of these.
    | ReactElement<string>
    | ReactElement<ClientReferenceMetadata>
    | Context<any> // ServerContext
    | string
    | boolean
    | number
    | symbol
    | null
    | void
    | Iterable<ReactClientValue>
    | ReactClientValue[]
    | ReactClientObject
    | Promise<ReactClientValue>; // Thenable<ReactClientValue>

  export type ReactClientObject = {[key: string]: ReactClientValue};

  // Serializable values for the server
  export type ReactServerValue =
    // References are passed by their value
    | ServerReference
    // The rest are passed as is. Sub-types can be passed in but lose their
    // subtype, so the receiver can only accept once of these.
    | string
    | boolean
    | number
    | symbol
    | null
    | void
    | Iterable<ReactServerValue>
    | ReactServerValue[]
    | ReactServerObject
    | Promise<ReactServerValue>; // Thenable<ReactServerValue>

  export type ReactServerObject = {[key: string]: ReactServerValue};
}
