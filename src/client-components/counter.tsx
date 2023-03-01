'use client';

import * as React from 'react';

export function Counter(): JSX.Element {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p>This is a client component. You clicked {count} times.</p>
      <button onClick={() => setCount((prevCount) => prevCount + 1)}>
        Click me
      </button>
    </div>
  );
}
