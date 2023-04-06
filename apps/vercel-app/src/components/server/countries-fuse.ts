import countriesList from 'countries-list';
import fusejs from 'fuse.js';

// TODO: Remove when fuse.js has type=module in package.json.
const Fuse = fusejs as any as typeof fusejs.default;

export const countriesFuse = new Fuse(
  Object.entries(countriesList.countries).map(
    ([code, {capital, continent, name, native, emoji, languages}]) => ({
      code,
      capital,
      continent:
        countriesList.continents[
          continent as keyof typeof countriesList.continents
        ],
      name,
      native,
      emoji,
      languages: languages.map(
        (languageCode) =>
          countriesList.languages[
            languageCode as keyof typeof countriesList.languages
          ].name,
      ),
    }),
  ),
  {
    keys: [`name`, `native`, `capital`, `continent`, `languages`],
    threshold: 0.2,
  },
);
