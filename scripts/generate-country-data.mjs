import { writeFileSync } from 'node:fs'
import countries from 'world-countries'

const regions = new Set(['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'])

const countryRows = countries
  .filter((country) => country.independent && country.cca2 && regions.has(country.region))
  .map((country) => ({
    name: {
      ru: country.translations?.rus?.common ?? country.name.common,
      en: country.name.common,
      es: country.translations?.spa?.common ?? country.name.common,
      fr: country.translations?.fra?.common ?? country.name.common,
      de: country.translations?.deu?.common ?? country.name.common,
      ro: country.translations?.ron?.common ?? country.name.common,
    },
    code: country.cca2.toLowerCase(),
    region: country.region,
    capital: country.capital ?? [],
    subregion: country.subregion ?? '',
    languages: Object.values(country.languages ?? {}),
    currencies: Object.values(country.currencies ?? {}).map((currency) => currency.name),
    area: country.area,
    latlng: country.latlng,
    cca3: country.cca3,
    flagEmoji: country.flag,
    phoneRoot: country.idd?.root ?? '',
    landlocked: country.landlocked,
    borders: country.borders ?? [],
    unMember: country.unMember,
  }))
  .sort((first, second) => first.name.ru.localeCompare(second.name.ru, 'ru'))

const countryNameReplacementMap = {
  ru: [],
  es: [],
  fr: [],
  de: [],
  ro: [],
}
const translationKeys = {
  ru: 'rus',
  es: 'spa',
  fr: 'fra',
  de: 'deu',
  ro: 'ron',
}

countries.forEach((country) => {
  if (!country.cca2) return

  Object.entries(translationKeys).forEach(([language, key]) => {
    const translatedName = country.translations?.[key]?.common

    if (translatedName && translatedName !== country.name.common) {
      countryNameReplacementMap[language].push([country.name.common, translatedName])
    }
  })
})

Object.values(countryNameReplacementMap).forEach((items) => {
  items.sort((first, second) => second[0].length - first[0].length)
})

writeFileSync('src/countryData.ts', `export const countryData = ${JSON.stringify(countryRows, null, 2)} as const\n`, 'utf8')
writeFileSync(
  'src/countryFactNames.ts',
  `export const countryNameReplacementMap = ${JSON.stringify(countryNameReplacementMap, null, 2)} as const\n`,
  'utf8',
)

console.log(`Generated ${countryRows.length} countries.`)
