import * as React from 'react';

export function useEphemeralState<S>(
  initialState: S | undefined | (() => S | undefined),
  lifetimeInMilliseconds: number,
): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>] {
  const [state, setState] = React.useState(initialState);
  const timeoutRef = React.useRef<number>();

  const setEphemeralState = React.useCallback<
    React.Dispatch<React.SetStateAction<S | undefined>>
  >((value) => {
    window.clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(
      () => setState(undefined),
      lifetimeInMilliseconds,
    );

    setState(value);
  }, []);

  React.useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  return [state, setEphemeralState];
}
