import * as React from 'react';
import {LocationServerContext} from '../../location-server-context.js';
import {countriesFuse} from './countries-fuse.js';

export function CountriesList(): JSX.Element {
  const location = React.useContext(LocationServerContext);
  const query = new URL(location).searchParams.get(`q`);

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
