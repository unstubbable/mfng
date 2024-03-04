export async function foo() {
  'use server';

  return `foo`;
}

export async function bar() {
  return `bar`;
}

const b = () => {
  'use server';

  return `baz`;
};

export {b as baz};
