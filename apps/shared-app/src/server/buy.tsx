'use server';

import * as React from 'react';
import 'server-only';
import {z} from 'zod';
import {Notification} from '../shared/notification.js';
import {wait} from './wait.js';

type BuyFieldErrors = z.inferFlattenedErrors<typeof BuyFormData>['fieldErrors'];

const FormDataFields = z.instanceof(FormData).transform((formData) => {
  const fields: Record<string, string> = {};

  formData.forEach((value, key) => {
    if (typeof value === `string`) {
      fields[key] = value;
    }
  });

  return fields;
});

const BuyFormData = z.object({
  quantity: z
    .string()
    .transform((value) => parseInt(value, 10))
    .refine(
      async (quantity) => quantity <= (await fetchAvailableProductCount()),
      `Not enough products in stock.`,
    ),
});

async function fetchAvailableProductCount(): Promise<number> {
  await wait(500);

  return Promise.resolve(2);
}

export async function buy(
  formData: FormData,
): Promise<[React.ReactNode] | [React.ReactNode, BuyFieldErrors]> {
  const parsedFormData = FormDataFields.safeParse(formData);

  if (!parsedFormData.success) {
    return [
      <Notification status="error">An unexpected error occured.</Notification>,
    ];
  }

  const result = await BuyFormData.safeParseAsync(parsedFormData.data);

  if (!result.success) {
    const {fieldErrors} = result.error.formErrors;

    return [
      <Notification status="error">
        {Object.values(fieldErrors).flat().join(` `)}
      </Notification>,
      fieldErrors,
    ];
  }

  const {quantity} = result.data;

  return [
    <Notification status="success">
      Bought <strong>{quantity}</strong> {quantity === 1 ? `item` : `items`}.
    </Notification>,
  ];
}
