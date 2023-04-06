import * as React from 'react';
import {CountriesSearch} from '../client/countries-search.js';
import {Main} from '../shared/main.js';
import {CountriesList} from './countries-list.js';
import content from './fast-page-content.md';
import {Markdown} from './markdown.js';

export function FastPage(): JSX.Element {
  return (
    <Main>
      <Markdown text={content} />
      <CountriesSearch />
      <CountriesList />
    </Main>
  );
}
