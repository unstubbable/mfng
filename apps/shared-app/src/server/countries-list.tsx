import {useRouterLocation} from '@mfng/core/use-router-location';
import * as React from 'react';
import {countriesFuse} from './countries-fuse.js';

export function CountriesList(): React.ReactNode {
  const {search} = useRouterLocation();
  const query = new URLSearchParams(search).get(`q`);

  if (!query) {
    return (
      <p className="my-3">
        <em>Enter a query to see the list of matching countries here.</em>
      </p>
    );
  }

  const matchingCountries = countriesFuse.search(query);

  return (
    <ul className="my-3">
      {matchingCountries.map(({item: {code, name, emoji}}) => (
        <li key={code}>
          {emoji} {name}
        </li>
      ))}
    </ul>
  );
}
