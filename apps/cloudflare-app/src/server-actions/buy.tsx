'use server';

import * as React from 'react';
import 'server-only';
import {Notification} from '../components/shared/notification.js';

export async function buy(quantity: number): Promise<React.ReactNode> {
  const itemOrItems = quantity === 1 ? `item` : `items`;

  try {
    await new Promise((resolve, reject) =>
      setTimeout(Math.random() > 0.2 ? resolve : reject, 500),
    );

    return (
      <Notification status="success">
        Bought <strong>{quantity}</strong> {itemOrItems}.
      </Notification>
    );
  } catch {
    return (
      <Notification status="error">
        Could not buy <strong>{quantity}</strong> {itemOrItems}, try again.
      </Notification>
    );
  }
}
