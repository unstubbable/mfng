import type {Chunk, Module, ModuleGraph} from 'webpack';

export type RuntimeSpec = Chunk['runtime'];

export function getExportNames(
  module: Module,
  moduleGraph: ModuleGraph,
  runtime: RuntimeSpec,
): Map<string, string> {
  const exportNames = new Map<string, string>();
  const exportsInfo = moduleGraph.getExportsInfo(module);

  for (const exportInfo of exportsInfo.orderedExports) {
    const usedName = exportsInfo.getUsedName(exportInfo.name, runtime);

    if (typeof usedName === `string`) {
      exportNames.set(usedName, exportInfo.name);
    }
  }

  return exportNames;
}
