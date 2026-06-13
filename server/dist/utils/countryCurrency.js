"use strict";
const countryCurrencyMap = {
    Russia: "RUB",
    Kazakhstan: "KZT",
    Uzbekistan: "UZS",
    Azerbaijan: "AZN",
    Kyrgyzstan: "KGS",
};
function isSupportedPayoutCountry(country) {
    return Object.prototype.hasOwnProperty.call(countryCurrencyMap, country);
}
function getPayoutCurrency(country) {
    return countryCurrencyMap[country];
}
module.exports = { countryCurrencyMap, getPayoutCurrency, isSupportedPayoutCountry };
