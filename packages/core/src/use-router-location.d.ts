export interface RouterLocation {
  readonly pathname: string;
  readonly search: string;
}

export function useRouterLocation(): RouterLocation;
