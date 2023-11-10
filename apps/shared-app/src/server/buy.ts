'use server';

import 'server-only';
import {z} from 'zod';
import {wait} from './wait.js';

export type BuyResult = BuySuccessResult | BuyErrorResult;

export interface BuySuccessResult {
  readonly status: 'success';
  readonly quantity: number;
  readonly totalQuantityInSession: number;
}

export interface BuyErrorResult {
  readonly status: 'error';
  readonly message: string;
  readonly fieldErrors?: BuyFieldErrors;
  readonly totalQuantityInSession: number;
}

export type BuyFieldErrors = z.inferFlattenedErrors<
  typeof BuyFormData
>['fieldErrors'];

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
  productId: string,
  prevResult: BuyResult | undefined,
  formData: FormData,
): Promise<BuyResult> {
  const parsedFormData = FormDataFields.safeParse(formData);
  const totalQuantityInSession = prevResult?.totalQuantityInSession ?? 0;

  if (!parsedFormData.success) {
    console.error(parsedFormData.error);

    return {
      status: `error`,
      message: `An unexpected error occured.`,
      totalQuantityInSession,
    };
  }

  const result = await BuyFormData.safeParseAsync(parsedFormData.data);

  if (!result.success) {
    const {fieldErrors} = result.error.formErrors;

    return {
      status: `error`,
      message: Object.values(fieldErrors).flat().join(` `),
      fieldErrors,
      totalQuantityInSession,
    };
  }

  const {quantity} = result.data;

  // Buy quantity number of items ...
  console.log(
    `Buying ${quantity} ${
      quantity === 1 ? `item` : `items`
    } of product ${productId}...`,
  );

  return {
    status: `success`,
    quantity,
    totalQuantityInSession: totalQuantityInSession + quantity,
  };
}
