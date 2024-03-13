import {z} from 'zod';

const apiKey = process.env.GOOGLE_SEARCH_API_KEY!;
const searchEngineId = process.env.GOOGLE_SEARCH_SEARCH_ENGINE_ID!;

export const imageSearchParams = z.object({
  q: z.string().describe(`The search query`),
  exactTerms: z
    .string()
    .optional()
    .describe(
      `Identifies a word or phrase that all documents in the search results must contain.`,
    ),
  excludeTerms: z
    .string()
    .optional()
    .describe(
      `Identifies a word or phrase that should not appear in any documents in the search results.`,
    ),
  imgColorType: z
    .enum([`color`, `gray`, `mono`, `trans`])
    .optional()
    .describe(
      `Returns black and white, grayscale, transparent, or color images. Acceptable values are: "color", "gray", "mono" (black and white), "trans" (transparent background).`,
    ),
  imgDominantColor: z
    .enum([
      `black`,
      `blue`,
      `brown`,
      `gray`,
      `green`,
      `orange`,
      `pink`,
      `purple`,
      `red`,
      `teal`,
      `white`,
      `yellow`,
    ])
    .optional()
    .describe(
      `Returns images of a specific dominant color. Acceptable values are: "black", "blue", "brown", "gray", "green", "orange", "pink", "purple", "red", "teal", "white", "yellow".`,
    ),
  imgType: z
    .enum([`clipart`, `face`, `lineart`, `stock`, `photo`, `animated`])
    .optional()
    .describe(
      `Returns images of a type. Acceptable values are: "clipart", "face", "lineart", "stock", "photo", "animated".`,
    ),
  num: z
    .string()
    .describe(
      `Number of search results to return. Valid values are integers between 1 and 10, inclusive.`,
    ),
});

const imageSearchResults = z.union([
  z.object({error: z.object({code: z.number(), message: z.string()})}),
  z
    .object({
      kind: z.string(),
      items: z
        .array(
          z
            .object({
              link: z.string(),
              snippet: z.string(),
              image: z.object({
                contextLink: z.string(),
                thumbnailLink: z.string(),
                width: z.number(),
                height: z.number(),
              }),
            })
            .transform(
              ({
                link,
                snippet,
                image: {contextLink, thumbnailLink, width, height},
              }) => ({
                website: {url: contextLink, snippet},
                thumbnailUrl: thumbnailLink,
                url: link,
                width,
                height,
              }),
            ),
        )
        .default([]),
    })
    .transform(({items}) => items),
]);

export async function searchImages(
  params: z.TypeOf<typeof imageSearchParams>,
): Promise<z.TypeOf<typeof imageSearchResults>> {
  const url = new URL(`https://www.googleapis.com/customsearch/v1`);

  url.search = new URLSearchParams({
    ...params,
    cx: searchEngineId,
    key: apiKey,
    rights: `cc_publicdomain`,
    safe: `active`,
    searchType: `image`,
  }).toString();

  const response = await fetch(url);
  const json = await response.json();
  const result = imageSearchResults.safeParse(json);

  if (result.success) {
    return result.data;
  }

  console.debug(JSON.stringify(json, null, 2));

  throw result.error;
}
