import * as React from 'react';

export type NotificationProps = React.PropsWithChildren<{
  readonly status: `success` | `error`;
}>;

export function Notification({
  children,
  status,
}: NotificationProps): React.ReactNode {
  return (
    <div className={status === `success` ? `text-cyan-600` : `text-red-600`}>
      {children}
    </div>
  );
}
