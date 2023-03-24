import type Webpack from 'webpack';
import {Dependency, RuntimeGlobals, Template} from 'webpack';
import {getExportNames} from './get-export-names.js';

export class ClientReferenceDependency extends Dependency {
  constructor(public normalModule: Webpack.NormalModule) {
    super();
  }

  override get type(): string {
    return `client-reference`;
  }
}

export class ClientReferenceTemplate extends Template {
  apply(
    dependency: ClientReferenceDependency,
    source: Webpack.sources.ReplaceSource,
    {
      chunkGraph,
      moduleGraph,
      runtimeRequirements,
      runtime,
    }: {
      chunkGraph: Webpack.ChunkGraph;
      moduleGraph: Webpack.ModuleGraph;
      runtimeRequirements: any;
      runtime: any;
    },
  ): void {
    runtimeRequirements.add(RuntimeGlobals.exports);
    runtimeRequirements.add(RuntimeGlobals.definePropertyGetters);
    runtimeRequirements.add(RuntimeGlobals.makeNamespaceObject);

    const id = chunkGraph.getModuleId(dependency.normalModule);

    const exportNames = getExportNames(
      dependency.normalModule,
      moduleGraph,
      runtime,
    );

    let newSource = source.source().toString();

    for (const [usedExportName, originalExportName] of exportNames) {
      newSource = newSource
        // Avoid terser error: "Export" statement may only appear at the top level.
        .replace(
          `export const ${originalExportName}`,
          () => `const ${originalExportName}`,
        )
        // Replace $$id placeholder with used module ID and export name.
        .replace(
          `$$id: eval("'${originalExportName}'")`,
          () => `$$id: "${id}#${usedExportName}"`,
        );
    }

    source.replace(0, source.source().length, newSource);
  }
}

export function isClientReferenceDependency(
  dependency: Webpack.Dependency,
): dependency is ClientReferenceDependency {
  return dependency instanceof ClientReferenceDependency;
}
