'use server';

export async function serverFunctionImportedFromClient() {
  return Promise.resolve(`server-function-imported-from-client`);
}
