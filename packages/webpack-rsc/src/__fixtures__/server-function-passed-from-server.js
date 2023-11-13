'use server';

export async function serverFunctionPassedFromServer() {
  return Promise.resolve(`server-function-passed-from-server`);
}
