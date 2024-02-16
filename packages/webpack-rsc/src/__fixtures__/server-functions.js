'use server';

export async function foo() {
  return Promise.resolve(`foo`);
}

export const bar = async () => Promise.resolve(`bar`);

export const baz = function () {
  quux();
};

export const qux = 42;

function quux() {}
