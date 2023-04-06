import * as React from 'react';

export const LocationServerContextName = `LocationServerContext`;

export const LocationServerContext = React.createServerContext<string>(
  LocationServerContextName,
  `/`,
);
