export function modifiedFields<T extends object>(
  original: T,
  modified: T
): Partial<T> {
  return (Object.keys(original) as (keyof T)[]).reduce((diff, key) => {
    if (original[key] === modified[key]) return diff
    return {
      ...diff,
      [key]: modified[key],
    }
  }, {})
}
