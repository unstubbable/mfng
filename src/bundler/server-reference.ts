import type Webpack from 'webpack';
import {Dependency, RuntimeGlobals, Template} from 'webpack';
import {getExportNames} from './get-export-names.js';

export class ServerReferenceDependency extends Dependency {
  constructor(public normalModule: Webpack.NormalModule) {
    super();
  }

  override get type(): string {
    return `server-reference`;
  }
}

export class ServerReferenceTemplate extends Template {
  apply(
    dependency: ServerReferenceDependency,
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

    const {normalModule} = dependency;
    const id = chunkGraph.getModuleId(normalModule); //?
    const exportNames = getExportNames(normalModule, moduleGraph, runtime); //?

    const newSource = Array.from(exportNames)
      .map((exportName) =>
        Template.asString([
          `Object.defineProperties(`,
          Template.indent([
            `${exportName},`,
            `{`,
            Template.indent([
              `$$typeof: {value: Symbol.for("react.server.reference")},`,
              `$$id: {value: ${JSON.stringify(id + `#` + exportName)}},`,
            ]),
            `}`,
          ]),
          `);`,
        ]),
      )
      .join(`\n`);

    source.insert(source.size(), newSource);
  }
}

export function isServerReferenceDependency(
  dependency: Webpack.Dependency,
): dependency is ServerReferenceDependency {
  return dependency instanceof ServerReferenceDependency;
}
