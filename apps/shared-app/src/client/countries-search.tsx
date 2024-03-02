'use client';

import {useRouter} from '@mfng/core/client';
import {useRouterLocation} from '@mfng/core/use-router-location';
import * as React from 'react';

export function CountriesSearch(): React.ReactNode {
  const {search} = useRouterLocation();
  const {replace} = useRouter();
  const [, startTransition] = React.useTransition();

  const [query, setQuery] = React.useState(
    () => new URLSearchParams(search).get(`q`) || ``,
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
