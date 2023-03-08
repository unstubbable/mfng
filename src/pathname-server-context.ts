import * as React from 'react';

export const PathnameServerContextName = `PathnameServerContext`;

export const PathnameServerContext = React.createServerContext<string>(
  PathnameServerContextName,
  `/`,
);
