import type {Compiler, Configuration, MultiStats, Stats} from 'webpack';
import webpack from 'webpack';

export interface RunWebpackConfigs {
  readonly server: Configuration;
  readonly client: Configuration;
  readonly ssr: Configuration;
}

export interface RunWebpackOptions {
  readonly watch?: boolean;
}

interface NamedCompiler extends Compiler {
  readonly name: string;
}

export function runWebpack(
  configs: RunWebpackConfigs,
  options?: RunWebpackOptions,
): void {
  const {server, client, ssr} = configs;

  const multiCompiler = webpack([
    {...server, name: `server`},
    {...client, name: `client`},
    {...ssr, name: `ssr`},
  ]);

  const [serverCompiler, clientCompiler, ssrCompiler] =
    multiCompiler.compilers as [NamedCompiler, NamedCompiler, NamedCompiler];

  multiCompiler.setDependencies(clientCompiler, [serverCompiler.name]);
  multiCompiler.setDependencies(ssrCompiler, [clientCompiler.name]);

  if (options?.watch) {
    multiCompiler.watch({}, onCompilationComplete);
  } else {
    multiCompiler.run(onCompilationComplete);
  }
}

function onCompilationComplete(
  err?: Error | null,
  stats?: Stats | MultiStats,
): void {
  if (err) {
    console.error(err.stack || err);
    return;
  }

  if (stats) {
    const info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(info.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }

    console.log(
      stats.toString({
        colors: true,
        chunks: false,
        modules: false,
        version: false,
        hash: false,
        builtAt: true,
      }),
    );
  } else {
    console.error(`Neither error nor stats received from Webpack.`);
  }
}
