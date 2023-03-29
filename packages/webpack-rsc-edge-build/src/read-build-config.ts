import {pkgUp} from 'pkg-up';
import {z} from 'zod';

export type BuildConfig = z.TypeOf<typeof BuildConfig>;

const BuildConfig = z.object({
  'browser': z.string(),
  'react-server': z.string(),
  'default': z.string(),
});

const PackageJson = z.object({default: z.object({exports: BuildConfig})});

export async function readBuildConfig(): Promise<BuildConfig> {
  const packageJsonFilename = await pkgUp();

  if (!packageJsonFilename) {
    throw new Error(`Could not find a package.json.`);
  }

  const packageJson = await import(packageJsonFilename, {
    assert: {type: `json`},
  });

  const {exports} = PackageJson.parse(packageJson).default;

  return exports;
}
