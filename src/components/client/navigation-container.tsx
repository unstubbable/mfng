'use client';

import classNames from 'classnames';
import * as React from 'react';
import styles from './navigation-container.module.css';
import {NavigationContext} from './navigation-context.js';

export function NavigationContainer({
  children,
}: React.PropsWithChildren): JSX.Element {
  const {isPending, promise} = React.useContext(NavigationContext);

  React.use(promise);

  return (
    <div className={classNames(styles.container, {[styles.muted!]: isPending})}>
      {children}
    </div>
  );
}
