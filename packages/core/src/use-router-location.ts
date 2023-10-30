export interface RouterLocation {
  readonly pathname: string;
  readonly search: string;
}

export declare function useRouterLocation(): RouterLocation;
