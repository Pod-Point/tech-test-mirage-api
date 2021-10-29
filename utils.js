/**
 * Adapted from https://ninjarockstar.dev/miragejs-convert-ids-to-number/
 * See https://github.com/miragejs/discuss/issues/9
 */
export function castIdsToIntegers(data) {
  if (Array.isArray(data)) {
    return data.map((item) => castIdsToIntegers(item));
  }

  if (typeof data === "object" && data !== null) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      return {
        ...acc,
        [key]: key === "id" ? +value : castIdsToIntegers(value),
      };
    }, {});
  }

  return data;
}
