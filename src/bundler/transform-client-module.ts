import {transformSync} from '@babel/core';

export function transformClientModule(source: string): string {
  return transformSync(source, {})?.code || source;
}
