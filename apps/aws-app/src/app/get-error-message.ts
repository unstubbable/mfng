import {CallServerError} from '@mfng/core/client';

export function getErrorMessage(error: unknown): string {
  if (error instanceof CallServerError) {
    switch (error.statusCode) {
      case 413:
        return `Your message is too long. Please shorten it and try again.`;
      case 429:
        return `Sorry, you've reached your request limit. Please try again in a few minutes.`;
    }
  }

  return `An unexpected error occured.`;
}
