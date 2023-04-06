'use client';

import * as React from 'react';
import {LocationServerContext} from '../../location-server-context.js';
import {NavigationContext} from './navigation-context.js';

export function CountriesSearch(): JSX.Element {
  const location = React.useContext(LocationServerContext);
  const {replace} = React.useContext(NavigationContext);
  const [, startTransition] = React.useTransition();

  const [query, setQuery] = React.useState(
    () => new URL(location).searchParams.get(`q`) || ``,
  );

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const newQuery = event.target.value;

    setQuery(newQuery);

    startTransition(() => {
      replace({
        search: newQuery ? new URLSearchParams({q: newQuery}).toString() : ``,
      });
    });
  };

  return (
    <form method="GET">
      <label>
        Search for a country
        <br />
        <input
          name="q"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="name, continent, capitial, language"
          className="w-80 bg-zinc-100 p-1 outline-cyan-500"
        />
      </label>
    </form>
  );
}
