import { parseAbbrValue } from './parseAbbrValue';
import { removeSeparators } from './removeSeparators';
import { removeInvalidChars } from './removeInvalidChars';
import { escapeRegExp } from './escapeRegExp';
import { CurrencyInputProps } from '../CurrencyInputProps';

export type CleanValueOptions = Pick<
  CurrencyInputProps,
  | 'decimalSeparator'
  | 'groupSeparator'
  | 'allowDecimals'
  | 'decimalsLimit'
  | 'allowNegativeValue'
  | 'disableAbbreviations'
  | 'prefix'
> & { value: string };

/**
 * Remove prefix, separators and extra decimals from value
 */
export const cleanValue = ({
  value,
  groupSeparator = ',',
  decimalSeparator = '.',
  allowDecimals = true,
  decimalsLimit = 2,
  allowNegativeValue = true,
  disableAbbreviations = false,
  prefix = '',
}: CleanValueOptions): string => {
  if (value === '-') {
    return value;
  }

  const abbreviations = disableAbbreviations ? [] : ['k', 'm', 'b'];
  const reg = new RegExp(`((^|\\D)-\\d)|(-${escapeRegExp(prefix)})`);
  const isNegative = reg.test(value);

  // Is there a digit before the prefix? eg. 1$
  const [prefixWithValue, preValue] = RegExp(`(\\d+)-?${escapeRegExp(prefix)}`).exec(value) || [];
  const withoutPrefix = prefix
    ? prefixWithValue
      ? value.replace(prefixWithValue, '').concat(preValue)
      : value.replace(prefix, '')
    : value;
  const withoutSeparators = removeSeparators(withoutPrefix, groupSeparator);
  const withoutInvalidChars = removeInvalidChars(withoutSeparators, [
    groupSeparator,
    decimalSeparator,
    ...abbreviations,
  ]);

  let valueOnly = withoutInvalidChars;

  if (!disableAbbreviations) {
    // disallow letter without number
    if (abbreviations.some((letter) => letter === withoutInvalidChars.toLowerCase())) {
      return '';
    }
    const parsed = parseAbbrValue(withoutInvalidChars, decimalSeparator);
    if (parsed) {
      valueOnly = String(parsed);
    }
  }

  const includeNegative = isNegative && allowNegativeValue ? '-' : '';

  if (decimalSeparator && valueOnly.includes(decimalSeparator)) {
    const [int, decimals] = withoutInvalidChars.split(decimalSeparator);
    const trimmedDecimals = decimalsLimit && decimals ? decimals.slice(0, decimalsLimit) : decimals;
    const includeDecimals = allowDecimals ? `${decimalSeparator}${trimmedDecimals}` : '';

    return `${includeNegative}${int}${includeDecimals}`;
  }

  return `${includeNegative}${valueOnly}`;
};
