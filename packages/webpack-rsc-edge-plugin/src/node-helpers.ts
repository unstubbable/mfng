import type {Directive, ModuleDeclaration, Statement} from 'estree';

export function isUseClientDirective(
  node: Directive | Statement | ModuleDeclaration,
): node is Directive {
  return isDirective(node, `use client`);
}

export function isUseServerDirective(
  node: Directive | Statement | ModuleDeclaration,
): node is Directive {
  return isDirective(node, `use server`);
}

function isDirective(
  node: Directive | Statement | ModuleDeclaration,
  value: string,
): node is Directive {
  return (
    node.type === `ExpressionStatement` &&
    node.expression.type === `Literal` &&
    node.expression.value === value
  );
}
