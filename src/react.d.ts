import type React from 'react';

// Extend the React types with missing properties
declare module 'react' {
  // The subset of a Thenable required by things thrown by Suspense.
  // This doesn't require a value to be passed to either handler.
  export interface Wakeable {
    then(onFulfill: () => unknown, onReject: () => unknown): void | Wakeable;
  }

  // The subset of a Promise that React APIs rely on. This resolves a value.
  // This doesn't require a return value neither from the handler nor the
  // then function.
  export interface ThenableImpl<T> {
    then(
      onFulfill: (value: T) => unknown,
      onReject: (error: unknown) => unknown,
    ): void | Wakeable;
  }

  export interface UntrackedThenable<T> extends ThenableImpl<T> {
    status?: void;
  }

  export interface PendingThenable<T> extends ThenableImpl<T> {
    status: 'pending';
  }

  export interface FulfilledThenable<T> extends ThenableImpl<T> {
    status: 'fulfilled';
    value: T;
  }

  export interface RejectedThenable<T> extends ThenableImpl<T> {
    status: 'rejected';
    reason: unknown;
  }

  export type Thenable<T> =
    | UntrackedThenable<T>
    | PendingThenable<T>
    | FulfilledThenable<T>
    | RejectedThenable<T>;

  export type Usable<T> = Thenable<T> | React.Context<T>;

  function use<T>(usable: Usable<T>): T;
}
