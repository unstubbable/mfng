import * as React from 'react';
import {CountriesSearch} from '../client/countries-search.js';
import {Main} from '../shared/main.js';
import {CountriesList} from './countries-list.js';
import {Markdown} from './markdown.js';

const content = `
# This is a fast page.

Try to click fast between the different navigation links. Thanks to **Suspense**
and **transitions** the navigations are interruptible.

The pending navigation is indicated by rendering the the page contents with a
reduced opacity.
`;

export function FastPage(): JSX.Element {
  return (
    <Main>
      <Markdown text={content} />
      <CountriesSearch />
      <CountriesList />
    </Main>
  );
}
