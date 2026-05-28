import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'

const languages = ['ru', 'es', 'fr', 'de', 'ro']
const delimiter = '\n@@@\n'
const chunkSize = 30
const requireFromProject = createRequire(`${process.cwd()}/`)

function loadProvidedFacts() {
  let source = fs.readFileSync('src/countryFacts.ts', 'utf8')
  source = source
    .replace("import worldCountries from 'world-countries'\n", "const worldCountries = require('world-countries')\n")
    .replace(/import \{ providedFactTranslations \} from '\.\/providedFactTranslations'\n/, '')
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ')
  source += '\nmodule.exports = { providedCountryFacts }\n'

  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(compiled, { require: requireFromProject, module, exports: module.exports })
  return module.exports.providedCountryFacts
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function translateText(text, language, attempt = 1) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(text)}`
  const response = await fetch(url)

  if (!response.ok) {
    if (attempt < 4) {
      await sleep(500 * attempt)
      return translateText(text, language, attempt + 1)
    }
    throw new Error(`Translate failed for ${language}: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  return payload[0].map((segment) => segment[0]).join('')
}

async function translateFacts(facts, language) {
  const translated = []

  for (let index = 0; index < facts.length; index += chunkSize) {
    const chunk = facts.slice(index, index + chunkSize)
    const batchText = chunk.join(delimiter)
    const batchTranslation = await translateText(batchText, language)
    let batchFacts = batchTranslation
      .split(/\n?@@@\n?/g)
      .map((fact) => fact.replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    if (batchFacts.length !== chunk.length) {
      batchFacts = []
      for (const fact of chunk) {
        const translatedFact = await translateText(fact, language)
        batchFacts.push(translatedFact.replace(/\s+/g, ' ').trim())
        await sleep(120)
      }
    }

    if (batchFacts.length !== chunk.length) {
      throw new Error(`Chunk count mismatch for ${language} at ${index}: expected ${chunk.length}, got ${batchFacts.length}`)
    }

    translated.push(...batchFacts)
    await sleep(150)
  }

  return translated
}

function toCountryMap(countryEntries, flatTranslations) {
  const result = {}
  let cursor = 0

  countryEntries.forEach(([code, facts]) => {
    result[code] = flatTranslations.slice(cursor, cursor + facts.length)
    cursor += facts.length
  })

  return result
}

function writeTranslationsFile(translations) {
  const output = `export type ProvidedFactLanguage = 'ru' | 'es' | 'fr' | 'de' | 'ro'

export const providedFactTranslations: Record<string, Record<ProvidedFactLanguage, string[]>> = ${JSON.stringify(translations, null, 2)}
`

  fs.writeFileSync('src/providedFactTranslations.ts', output, 'utf8')
}

const providedFacts = loadProvidedFacts()
const countryEntries = Object.entries(providedFacts)
const flatFacts = countryEntries.flatMap(([, facts]) => facts)
const translations = Object.fromEntries(countryEntries.map(([code]) => [code, {}]))

for (const language of languages) {
  console.log(`Translating ${flatFacts.length} facts to ${language}...`)
  const flatTranslations = await translateFacts(flatFacts, language)
  const countryMap = toCountryMap(countryEntries, flatTranslations)

  for (const [code, facts] of Object.entries(countryMap)) {
    translations[code][language] = facts
  }
}

writeTranslationsFile(translations)
console.log('Wrote src/providedFactTranslations.ts')
