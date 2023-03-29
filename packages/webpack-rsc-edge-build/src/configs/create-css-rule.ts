import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type {Configuration, RuleSetRule} from 'webpack';

export interface CreateCssRuleOptions {
  readonly mode: Configuration['mode'];
}

export function createCssRule(options: CreateCssRuleOptions): RuleSetRule {
  const {mode} = options;
  const dev = mode === `development`;

  return {
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: `css-loader`,
        options: {
          modules: {
            localIdentName: dev
              ? `[local]__[hash:base64:5]`
              : `[hash:base64:7]`,
            auto: true,
          },
        },
      },
      {
        loader: `postcss-loader`,
        options: {
          postcssOptions: {
            plugins: [
              `tailwindcss`,
              `autoprefixer`,
              ...(dev ? [] : [`cssnano`]),
            ],
          },
        },
      },
    ],
  };
}
