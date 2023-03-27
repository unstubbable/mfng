import webpack from 'webpack';

export async function runWebpack(
  config: webpack.Configuration,
): Promise<webpack.Stats> {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        reject(err);
      }

      if (stats) {
        const info = stats.toJson();

        if (stats.hasErrors()) {
          console.error(info.errors);
          reject(info.errors);
        }

        if (stats.hasWarnings()) {
          console.warn(info.warnings);
        }

        resolve(stats);
      }

      reject(new Error(`Neither error nor stats received from Webpack.`));
    });
  });
}
