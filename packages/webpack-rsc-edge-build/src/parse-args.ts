import yargs, {Argv} from 'yargs';
import {hideBin} from 'yargs/helpers';
import {z} from 'zod';

const Argv = z.object({
  mode: z.union([z.literal(`development`), z.literal(`production`)]),
  watch: z.boolean(),
});

export function parseArgs(): z.TypeOf<typeof Argv> {
  return Argv.parse(
    yargs(hideBin(process.argv))
      .epilogue(
        `Run a webpack build for an RSC app that's going to be deployed to the edge.`,
      )
      .options({
        mode: {
          string: true,
          choices: [`development`, `production`],
          default: `production`,
          describe: `Build mode`,
        },
        watch: {
          boolean: true,
          default: false,
          describe: `Enable watch mode`,
        },
      })
      .help()
      .alias(`h`, `help`).argv,
  );
}
