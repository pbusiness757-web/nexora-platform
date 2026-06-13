const countryCurrencyMap: Record<string, string> = {
  Russia: "RUB",
  Kazakhstan: "KZT",
  Uzbekistan: "UZS",
  Azerbaijan: "AZN",
  Kyrgyzstan: "KGS",
};

function isSupportedPayoutCountry(country: string): boolean {
  return Object.prototype.hasOwnProperty.call(countryCurrencyMap, country);
}

function getPayoutCurrency(country: string): string | undefined {
  return countryCurrencyMap[country];
}

export = { countryCurrencyMap, getPayoutCurrency, isSupportedPayoutCountry };
