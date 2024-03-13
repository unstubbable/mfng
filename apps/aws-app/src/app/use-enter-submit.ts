import * as React from 'react';

export interface UseEnterSubmitResult {
  readonly formRef: React.RefObject<HTMLFormElement>;

  readonly handleKeyDown: (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => void;
}

export function useEnterSubmit(): UseEnterSubmitResult {
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (
        event.key === `Enter` &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  return {formRef, handleKeyDown};
}
