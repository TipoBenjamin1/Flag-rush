import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import worldCountries from 'world-countries'
import type { Country as WorldCountry } from 'world-countries'
import appIcon from './assets/app-icon.png'
import africaModeIcon from './assets/modes/africa.png'
import americasModeIcon from './assets/modes/americas.png'
import asiaModeIcon from './assets/modes/asia.png'
import europeModeIcon from './assets/modes/europe.png'
import oceaniaModeIcon from './assets/modes/oceania.png'
import worldModeIcon from './assets/modes/world.png'
import { getProvidedCountryFacts } from './countryFacts'
import './App.css'

type Language = 'ru' | 'en' | 'es' | 'fr' | 'de' | 'ro'
type Theme = 'dark' | 'light'
type Region = 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania'
type ModeId = Region | 'world'
type Screen = 'landing' | 'landingSettings' | 'howToPlay' | 'home' | 'modeSelect' | 'game' | 'profile' | 'settings' | 'gameSettings'
type BlitzSeconds = 5 | 10 | 15

type Country = {
  name: Record<Language, string>
  code: string
  region: Region
  capital: string[]
  subregion: string
  languages: string[]
  currencies: string[]
  area: number
  latlng: [number, number]
  cca3: string
  flagEmoji: string
  phoneRoot: string
  landlocked: boolean
  borders: string[]
  unMember: boolean
}

type Question = {
  correct: Country
  options: Country[]
}

type PlayerProfile = {
  nickname: string
  xp: number
  bestStreak: number
  totalCorrect: number
  totalGames: number
  playTimeMs: number
  clearedCountryCodes: string[]
  bestAttempts: Record<string, number>
  regionStats: Record<Region, RegionStat>
}

type RegionStat = {
  correct: number
  total: number
}

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

const profileKey = 'flagRushProfile'
const oldProfileKey = 'flagArenaProfile'
const audioKey = 'flagRushAudioEnabled'
const audioDefaultKey = 'flagRushAudioDefaultV5'
const audioVolumeKey = 'flagRushAudioVolume'
const languageKey = 'flagRushLanguage'
const themeKey = 'flagRushTheme'
const factCursorKey = 'flagRushFactCursor'
const timeoutAnswerCode = '__timeout__'
const blitzModes: BlitzSeconds[] = [5, 10, 15]
const regions: Region[] = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania']
const languageOptions: Language[] = ['en', 'ru', 'es', 'fr', 'de', 'ro']
const localeByLanguage: Record<Language, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ro: 'ro-RO',
}
const languageNames: Record<Language, Record<Language, string>> = {
  en: {
    en: 'English',
    ru: 'Russian',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    ro: 'Romanian',
  },
  ru: {
    en: 'Английский',
    ru: 'Русский',
    es: 'Испанский',
    fr: 'Французский',
    de: 'Немецкий',
    ro: 'Румынский',
  },
  es: {
    en: 'Inglés',
    ru: 'Ruso',
    es: 'Español',
    fr: 'Francés',
    de: 'Alemán',
    ro: 'Rumano',
  },
  fr: {
    en: 'Anglais',
    ru: 'Russe',
    es: 'Espagnol',
    fr: 'Français',
    de: 'Allemand',
    ro: 'Roumain',
  },
  de: {
    en: 'Englisch',
    ru: 'Russisch',
    es: 'Spanisch',
    fr: 'Französisch',
    de: 'Deutsch',
    ro: 'Rumänisch',
  },
  ro: {
    en: 'Engleză',
    ru: 'Rusă',
    es: 'Spaniolă',
    fr: 'Franceză',
    de: 'Germană',
    ro: 'Română',
  },
}

const nativeLanguageNames: Record<Language, string> = {
  en: languageNames.en.en,
  ru: 'Русский',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ro: 'Română',
}

let audioContext: AudioContext | null = null
let audioOutputGain: GainNode | null = null
let audioCompressor: DynamicsCompressorNode | null = null
let musicGain: GainNode | null = null
let musicTimer: number | undefined
let blitzTimeout: number | undefined
let blitzTicker: number | undefined
let masterVolume = 1
let audioMuted = false
let audioPrimed = false
let audioPausedByLifecycle = false
const toneGainBoost = 3.2
const musicOutputGain = 0.42

const copyBase = {
  ru: {
    appName: 'Flag Rush',
    profile: 'Профиль',
    settings: 'Настройки',
    headline: 'Успей узнать флаг',
    landingSubtitle: 'Успей узнать флаг!',
    playNow: 'Играть',
    howToPlay: 'Как играть',
    start: 'Старт',
    back: 'Назад',
    menu: 'Меню',
    chooseMode: 'Выбери карту',
    guessFlag: 'Чей флаг?',
    soundOn: 'Звук on',
    soundOff: 'Звук off',
    onLabel: 'ВКЛ',
    offLabel: 'ВЫКЛ',
    themeDark: 'Темная',
    themeLight: 'Светлая',
    language: 'EN',
    rank: 'Ранг',
    yourRank: 'Лига',
    maxRank: 'Финальная лига открыта',
    nextRank: (rank: string, xp: number) => `${xp} XP до ${rank}`,
    countries: (count: number) => `${count} стран`,
    countriesLabel: 'Стран',
    seconds: (seconds: BlitzSeconds) => `${seconds} сек`,
    options: '4 ответа',
    streak: 'Стрик',
    best: 'Рекорд',
    correctTotal: 'Верно',
    allCountries: 'База',
    attempts: 'Попытки',
    bestAttempts: (count: number) => `Лучшее: ${count}`,
    noBestAttempts: 'Еще не пройдено',
    progress: 'Карта',
    correct: (xp: number) => `+${xp} XP`,
    correctTitle: 'Верно!',
    comboLabel: 'Комбо',
    wrong: (country: string) => `Ответ: ${country}`,
    timeout: (country: string) => `Время. Ответ: ${country}`,
    roundComplete: 'Карта закрыта',
    nextFlag: 'Дальше',
    newRound: 'Заново',
    timerLabel: 'Таймер',
    rush: 'Блиц',
    countryFact: 'Факт',
    lossTitle: 'Слив',
    restartPrompt: 'Начать заново?',
    yes: 'Да',
    exit: 'Выйти',
    nickname: 'Ваше имя',
    saveName: 'Сохранить',
    hoursPlayed: 'В игре',
    bestContinent: 'Лучший континент',
    worstContinent: 'Сложнее всего',
    noStats: 'Пока нет данных',
    accuracy: 'Точность',
    totalAnswers: 'Ответов',
    volume: 'Громкость',
    systemLanguage: 'Как в телефоне',
    languageSetting: 'Язык',
    themeSetting: 'Тема',
    soundSetting: 'Звук',
    resetRun: 'Сбросить текущий раунд',
    resetStats: 'Сбросить статистику',
    resumeGame: 'Продолжить',
    restart: 'Заново',
    changeMap: 'Сменить карту',
    quitGame: 'Выйти из игры',
    playAgain: 'Сыграть еще',
    home: 'Домой',
    gameFinished: 'Карта пройдена!',
    score: 'Счет',
    combo: 'Комбо',
    mapsPlayed: 'Карт сыграно',
    countriesCleared: 'Стран закрыто',
    bestScore: 'Лучший счет',
    totalAttempts: 'Всего попыток',
    finishLine: 'Финиш',
    finishJoke: (modeName: string, isWorld: boolean) =>
      isWorld
        ? 'Поздравляю, у тебя вообще есть личная жизнь? Весь мир закрыт.'
        : `${modeName} закрыт. География сегодня официально проиграла.`,
    dataNote: 'Факты работают без интернета',
    hours: (value: string) => `${value} ч`,
    howToSteps: [
      'Выбери скорость блица: 5, 10 или 15 секунд на флаг.',
      'Открой карту континента или весь мир.',
      'Смотри на флаг и нажимай правильную страну из 4 вариантов.',
      'Верные ответы дают XP и серию. Ошибка или таймер сбрасывают забег.',
      'Угадай все страны в выбранной карте, чтобы закрыть её полностью.',
    ],
    modes: {
      Europe: 'Европа',
      Asia: 'Азия',
      Africa: 'Африка',
      Americas: 'Америка',
      Oceania: 'Океания',
      world: 'Весь мир',
    },
    modeInfo: {
      Europe: {
        emoji: '🏰',
        description: 'Похожие триколоры, кресты и много ловушек на внимательность.',
      },
      Asia: {
        emoji: '🐉',
        description: 'Солнца, звезды, драконы и флаги, которые легко спутать на скорости.',
      },
      Africa: {
        emoji: '🛡️',
        description: 'Яркие цвета, редкие символы и самый честный тест памяти.',
      },
      Americas: {
        emoji: '🦅',
        description: 'Звезды, гербы, полосы и страны от Канады до юга континента.',
      },
      Oceania: {
        emoji: '🌊',
        description: 'Острова, маленькие страны и флаги, которые почти никто не учит.',
      },
      world: {
        emoji: '🌍',
        description: 'Полный хаос: все страны мира, любые ловушки, максимум XP.',
      },
    },
    ranks: [
      { title: 'Rookie', minXp: 0 },
      { title: 'Scout', minXp: 120 },
      { title: 'Expert', minXp: 320 },
      { title: 'Pro', minXp: 700 },
      { title: 'Elite', minXp: 1250 },
      { title: 'Legend', minXp: 2100 },
    ],
    streakTitles: {
      warmup: '0 combo',
      started: 'Combo x2',
      moving: 'Combo x5',
      iron: 'Combo x10',
      legend: 'Combo x15',
      master: 'Combo x25',
      champion: 'Combo x50',
    },
  },
  en: {
    appName: 'Flag Rush',
    profile: 'Profile',
    settings: 'Settings',
    headline: 'Beat the flag clock',
    landingSubtitle: 'Beat the flag clock!',
    playNow: 'Play Now',
    howToPlay: 'How to Play',
    start: 'Start',
    back: 'Back',
    menu: 'Menu',
    chooseMode: 'Pick a map',
    guessFlag: 'Whose flag?',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    onLabel: 'ON',
    offLabel: 'OFF',
    themeDark: 'Dark',
    themeLight: 'Light',
    language: 'RU',
    rank: 'Rank',
    yourRank: 'League',
    maxRank: 'Final league unlocked',
    nextRank: (rank: string, xp: number) => `${xp} XP to ${rank}`,
    countries: (count: number) => `${count} countries`,
    countriesLabel: 'Countries',
    seconds: (seconds: BlitzSeconds) => `${seconds} sec`,
    options: '4 answers',
    streak: 'Streak',
    best: 'Best',
    correctTotal: 'Correct',
    allCountries: 'Pool',
    attempts: 'Attempts',
    bestAttempts: (count: number) => `Best: ${count}`,
    noBestAttempts: 'Not cleared yet',
    progress: 'Map',
    correct: (xp: number) => `+${xp} XP`,
    correctTitle: 'Correct!',
    comboLabel: 'Combo',
    wrong: (country: string) => `Answer: ${country}`,
    timeout: (country: string) => `Time. Answer: ${country}`,
    roundComplete: 'Map cleared',
    nextFlag: 'Next',
    newRound: 'Restart',
    timerLabel: 'Timer',
    rush: 'Blitz',
    countryFact: 'Fact',
    lossTitle: 'Run lost',
    restartPrompt: 'Start again?',
    yes: 'Yes',
    exit: 'Exit',
    nickname: 'Your name',
    saveName: 'Save',
    hoursPlayed: 'Time played',
    bestContinent: 'Best continent',
    worstContinent: 'Hardest continent',
    noStats: 'No data yet',
    accuracy: 'Accuracy',
    totalAnswers: 'Answers',
    volume: 'Volume',
    systemLanguage: 'Phone language',
    languageSetting: 'Language',
    themeSetting: 'Theme',
    soundSetting: 'Sound',
    resetRun: 'Reset current run',
    resetStats: 'Reset stats',
    resumeGame: 'Resume Game',
    restart: 'Restart',
    changeMap: 'Change Map',
    quitGame: 'Quit Game',
    playAgain: 'Play Again',
    home: 'Home',
    gameFinished: 'Game Finished!',
    score: 'Score',
    combo: 'Combo',
    mapsPlayed: 'Maps Played',
    countriesCleared: 'Countries Cleared',
    bestScore: 'Best Score',
    totalAttempts: 'Total Attempts',
    finishLine: 'Finish Line',
    finishJoke: (modeName: string, isWorld: boolean) =>
      isWorld
        ? 'Congrats, do you even have a personal life? You cleared the whole world.'
        : `${modeName} cleared. Geography just took a clean loss.`,
    dataNote: 'Facts work offline',
    hours: (value: string) => `${value} h`,
    howToSteps: [
      'Pick a blitz speed: 5, 10, or 15 seconds per flag.',
      'Choose a continent map or the whole world.',
      'Look at the flag and tap the correct country from 4 answers.',
      'Correct answers give XP and streak. A mistake or timeout resets the run.',
      'Clear every country in the selected map to finish it.',
    ],
    modes: {
      Europe: 'Europe',
      Asia: 'Asia',
      Africa: 'Africa',
      Americas: 'Americas',
      Oceania: 'Oceania',
      world: 'World',
    },
    modeInfo: {
      Europe: {
        emoji: '🏰',
        description: 'Similar tricolors, crosses, and plenty of detail traps.',
      },
      Asia: {
        emoji: '🐉',
        description: 'Suns, stars, dragons, and flags that punish speed guesses.',
      },
      Africa: {
        emoji: '🛡️',
        description: 'Bold colors, rare symbols, and a clean memory test.',
      },
      Americas: {
        emoji: '🦅',
        description: 'Stars, coats of arms, stripes, and countries from north to south.',
      },
      Oceania: {
        emoji: '🌊',
        description: 'Islands, tiny nations, and flags most players never study.',
      },
      world: {
        emoji: '🌍',
        description: 'Full chaos: every country, every trap, maximum XP.',
      },
    },
    ranks: [
      { title: 'Rookie', minXp: 0 },
      { title: 'Scout', minXp: 120 },
      { title: 'Expert', minXp: 320 },
      { title: 'Pro', minXp: 700 },
      { title: 'Elite', minXp: 1250 },
      { title: 'Legend', minXp: 2100 },
    ],
    streakTitles: {
      warmup: '0 combo',
      started: 'Combo x2',
      moving: 'Combo x5',
      iron: 'Combo x10',
      legend: 'Combo x15',
      master: 'Combo x25',
      champion: 'Combo x50',
    },
  },
}

const copy = {
  ...copyBase,
  es: {
    ...copyBase.en,
    profile: 'Perfil',
    settings: 'Ajustes',
    headline: 'Adivina la bandera',
    landingSubtitle: '¡Gana contra el reloj!',
    playNow: 'Jugar',
    howToPlay: 'Cómo jugar',
    back: 'Atrás',
    menu: 'Menú',
    chooseMode: 'Elige mapa',
    guessFlag: '¿De quién es?',
    soundOn: 'Sonido on',
    soundOff: 'Sonido off',
    onLabel: 'ON',
    offLabel: 'OFF',
    themeDark: 'Oscuro',
    themeLight: 'Claro',
    rank: 'Rango',
    yourRank: 'Liga',
    countries: (count: number) => `${count} países`,
    countriesLabel: 'Países',
    seconds: (seconds: BlitzSeconds) => `${seconds} seg`,
    streak: 'Racha',
    best: 'Récord',
    correctTotal: 'Correctas',
    attempts: 'Intentos',
    progress: 'Mapa',
    correct: (xp: number) => `+${xp} XP`,
    correctTitle: '¡Correcto!',
    comboLabel: 'Combo',
    wrong: (country: string) => `Respuesta: ${country}`,
    timeout: (country: string) => `Tiempo. Respuesta: ${country}`,
    roundComplete: 'Mapa completado',
    nextFlag: 'Siguiente',
    newRound: 'Reiniciar',
    timerLabel: 'Tiempo',
    countryFact: 'Dato',
    lossTitle: 'Derrota',
    restartPrompt: '¿Empezar de nuevo?',
    yes: 'Sí',
    exit: 'Salir',
    nickname: 'Tu nombre',
    saveName: 'Guardar',
    hoursPlayed: 'Tiempo',
    bestContinent: 'Mejor continente',
    worstContinent: 'Más difícil',
    noStats: 'Sin datos',
    volume: 'Volumen',
    systemLanguage: 'Idioma del teléfono',
    languageSetting: 'Idioma',
    themeSetting: 'Tema',
    soundSetting: 'Sonido',
    resetStats: 'Reiniciar estadísticas',
    dataNote: 'Los datos funcionan sin internet',
    hours: (value: string) => `${value} h`,
    howToSteps: [
      'Elige una velocidad: 5, 10 o 15 segundos por bandera.',
      'Elige un continente o todo el mundo.',
      'Mira la bandera y toca el país correcto entre 4 opciones.',
      'Las respuestas correctas dan XP y racha. Un error o el tiempo reinician la partida.',
      'Acierta todos los países del mapa para completarlo.',
    ],
    modes: {
      Europe: 'Europa',
      Asia: 'Asia',
      Africa: 'África',
      Americas: 'América',
      Oceania: 'Oceanía',
      world: 'Mundo',
    },
  },
  fr: {
    ...copyBase.en,
    profile: 'Profil',
    settings: 'Réglages',
    headline: 'Devine le drapeau',
    landingSubtitle: 'Bats le chrono des drapeaux !',
    playNow: 'Jouer',
    howToPlay: 'Comment jouer',
    back: 'Retour',
    menu: 'Menu',
    chooseMode: 'Choisis une carte',
    guessFlag: 'Quel pays ?',
    soundOn: 'Son on',
    soundOff: 'Son off',
    onLabel: 'ON',
    offLabel: 'OFF',
    themeDark: 'Sombre',
    themeLight: 'Clair',
    rank: 'Rang',
    yourRank: 'Ligue',
    countries: (count: number) => `${count} pays`,
    countriesLabel: 'Pays',
    seconds: (seconds: BlitzSeconds) => `${seconds} s`,
    streak: 'Série',
    best: 'Record',
    correctTotal: 'Justes',
    attempts: 'Essais',
    progress: 'Carte',
    correctTitle: 'Correct !',
    comboLabel: 'Combo',
    wrong: (country: string) => `Réponse : ${country}`,
    timeout: (country: string) => `Temps écoulé. Réponse : ${country}`,
    roundComplete: 'Carte terminée',
    nextFlag: 'Suivant',
    newRound: 'Recommencer',
    timerLabel: 'Temps',
    countryFact: 'Info',
    lossTitle: 'Perdu',
    restartPrompt: 'Recommencer ?',
    yes: 'Oui',
    exit: 'Sortir',
    nickname: 'Votre nom',
    saveName: 'Sauver',
    hoursPlayed: 'Temps joué',
    bestContinent: 'Meilleur continent',
    worstContinent: 'Plus difficile',
    noStats: 'Aucune donnée',
    volume: 'Volume',
    systemLanguage: 'Langue du téléphone',
    languageSetting: 'Langue',
    themeSetting: 'Thème',
    soundSetting: 'Son',
    resetStats: 'Réinitialiser les stats',
    dataNote: 'Les infos marchent hors ligne',
    howToSteps: [
      'Choisis une vitesse : 5, 10 ou 15 secondes par drapeau.',
      'Choisis un continent ou le monde entier.',
      'Regarde le drapeau et touche le bon pays parmi 4 réponses.',
      'Les bonnes réponses donnent de l’XP et une série. Une erreur ou le timer relance la partie.',
      'Trouve tous les pays de la carte pour la terminer.',
    ],
    modes: {
      Europe: 'Europe',
      Asia: 'Asie',
      Africa: 'Afrique',
      Americas: 'Amériques',
      Oceania: 'Océanie',
      world: 'Monde',
    },
  },
  de: {
    ...copyBase.en,
    profile: 'Profil',
    settings: 'Einstellungen',
    headline: 'Errate die Flagge',
    landingSubtitle: 'Schlage die Flaggen-Uhr!',
    playNow: 'Spielen',
    howToPlay: 'So gehts',
    back: 'Zurück',
    menu: 'Menü',
    chooseMode: 'Karte wählen',
    guessFlag: 'Welche Flagge?',
    soundOn: 'Ton an',
    soundOff: 'Ton aus',
    onLabel: 'AN',
    offLabel: 'AUS',
    themeDark: 'Dunkel',
    themeLight: 'Hell',
    rank: 'Rang',
    yourRank: 'Liga',
    countries: (count: number) => `${count} Länder`,
    countriesLabel: 'Länder',
    seconds: (seconds: BlitzSeconds) => `${seconds} Sek`,
    streak: 'Serie',
    best: 'Rekord',
    correctTotal: 'Richtig',
    attempts: 'Versuche',
    progress: 'Karte',
    correctTitle: 'Richtig!',
    comboLabel: 'Kombo',
    wrong: (country: string) => `Antwort: ${country}`,
    timeout: (country: string) => `Zeit. Antwort: ${country}`,
    roundComplete: 'Karte geschafft',
    nextFlag: 'Weiter',
    newRound: 'Neu starten',
    timerLabel: 'Timer',
    countryFact: 'Fakt',
    lossTitle: 'Verloren',
    restartPrompt: 'Neu starten?',
    yes: 'Ja',
    exit: 'Raus',
    nickname: 'Dein Name',
    saveName: 'Speichern',
    hoursPlayed: 'Spielzeit',
    bestContinent: 'Bester Kontinent',
    worstContinent: 'Am schwersten',
    noStats: 'Keine Daten',
    volume: 'Lautstärke',
    systemLanguage: 'Telefonsprache',
    languageSetting: 'Sprache',
    themeSetting: 'Theme',
    soundSetting: 'Ton',
    resetStats: 'Statistik löschen',
    dataNote: 'Fakten funktionieren offline',
    howToSteps: [
      'Wähle eine Blitzzeit: 5, 10 oder 15 Sekunden pro Flagge.',
      'Wähle einen Kontinent oder die ganze Welt.',
      'Sieh dir die Flagge an und tippe das richtige Land aus 4 Antworten.',
      'Richtige Antworten geben XP und Serie. Fehler oder Timer starten den Lauf neu.',
      'Errate alle Länder der Karte, um sie abzuschließen.',
    ],
    modes: {
      Europe: 'Europa',
      Asia: 'Asien',
      Africa: 'Afrika',
      Americas: 'Amerika',
      Oceania: 'Ozeanien',
      world: 'Welt',
    },
  },
  ro: {
    ...copyBase.en,
    profile: 'Profil',
    settings: 'Setări',
    headline: 'Ghicește steagul',
    landingSubtitle: 'Învinge cronometrul!',
    playNow: 'Joacă',
    howToPlay: 'Cum se joacă',
    back: 'Înapoi',
    menu: 'Meniu',
    chooseMode: 'Alege harta',
    guessFlag: 'Al cui steag?',
    soundOn: 'Sunet on',
    soundOff: 'Sunet off',
    onLabel: 'ON',
    offLabel: 'OFF',
    themeDark: 'Întunecat',
    themeLight: 'Luminos',
    rank: 'Rang',
    yourRank: 'Ligă',
    countries: (count: number) => `${count} țări`,
    countriesLabel: 'Țări',
    seconds: (seconds: BlitzSeconds) => `${seconds} sec`,
    streak: 'Serie',
    best: 'Record',
    correctTotal: 'Corecte',
    attempts: 'Încercări',
    progress: 'Hartă',
    correctTitle: 'Corect!',
    comboLabel: 'Combo',
    wrong: (country: string) => `Răspuns: ${country}`,
    timeout: (country: string) => `Timp. Răspuns: ${country}`,
    roundComplete: 'Hartă completată',
    nextFlag: 'Următorul',
    newRound: 'Restart',
    timerLabel: 'Timp',
    countryFact: 'Fapt',
    lossTitle: 'Ai pierdut',
    restartPrompt: 'Începi din nou?',
    yes: 'Da',
    exit: 'Ieși',
    nickname: 'Numele tău',
    saveName: 'Salvează',
    hoursPlayed: 'Timp jucat',
    bestContinent: 'Cel mai bun continent',
    worstContinent: 'Cel mai greu',
    noStats: 'Nu sunt date',
    volume: 'Volum',
    systemLanguage: 'Limba telefonului',
    languageSetting: 'Limbă',
    themeSetting: 'Temă',
    soundSetting: 'Sunet',
    resetStats: 'Resetează statistica',
    dataNote: 'Faptele merg fără internet',
    howToSteps: [
      'Alege viteza: 5, 10 sau 15 secunde pentru fiecare steag.',
      'Alege un continent sau toată lumea.',
      'Privește steagul și apasă țara corectă din 4 răspunsuri.',
      'Răspunsurile corecte dau XP și serie. O greșeală sau timpul resetează runda.',
      'Ghicește toate țările de pe hartă ca să o finalizezi.',
    ],
    modes: {
      Europe: 'Europa',
      Asia: 'Asia',
      Africa: 'Africa',
      Americas: 'America',
      Oceania: 'Oceania',
      world: 'Lumea',
    },
  },
} satisfies Record<Language, typeof copyBase.en>

const countries: Country[] = (worldCountries as WorldCountry[])
  .filter((country) => {
    return (
      country.independent &&
      country.cca2 &&
      ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'].includes(country.region)
    )
  })
  .map((country) => ({
    name: {
      ru: country.translations.rus?.common ?? country.name.common,
      en: country.name.common,
      es: country.translations.spa?.common ?? country.name.common,
      fr: country.translations.fra?.common ?? country.name.common,
      de: country.translations.deu?.common ?? country.name.common,
      ro: country.translations.ron?.common ?? country.name.common,
    },
    code: country.cca2.toLowerCase(),
    region: country.region as Region,
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

const countriesByArea = [...countries].sort((first, second) => second.area - first.area)
const areaRankByCode = new Map(countriesByArea.map((country, index) => [country.code, index + 1]))
const regionAreaRankByCode = new Map<string, number>()

regions.forEach((region) => {
  getCountriesForMode(region)
    .sort((first, second) => second.area - first.area)
    .forEach((country, index) => regionAreaRankByCode.set(country.code, index + 1))
})

const specialFacts: Partial<Record<string, Partial<Record<Language, string[]>>>> = {
  ro: {
    ru: [
      'Румынию часто связывают с легендами о Дракуле из-за Трансильвании и замка Бран.',
      'Карпаты дугой проходят через Румынию и дают стране горные дороги, замки и резкие пейзажи.',
      'В дельте Дуная в Румынии находится один из самых больших и живых водно-болотных районов Европы.',
    ],
    en: [
      'Romania is tied to Dracula legends through Transylvania and Bran Castle.',
      'The Carpathian Mountains curve through Romania, bringing mountain roads, castles, and dramatic landscapes.',
      'Romania contains the Danube Delta, one of Europe\'s largest and liveliest wetland areas.',
    ],
  },
  jp: {
    ru: ['Япония состоит из тысяч островов, а её поезда синкансэн стали символом очень точного расписания.'],
    en: ['Japan is made up of thousands of islands, and its Shinkansen trains are famous for punctuality.'],
  },
  ca: {
    ru: ['Канада занимает второе место в мире по площади и известна огромным количеством озёр.'],
    en: ['Canada is the second-largest independent country by area and is famous for its many lakes.'],
  },
  br: {
    ru: ['Бразилия — самая большая страна Южной Америки, и значительная часть Амазонии находится именно там.'],
    en: ['Brazil is the largest country in South America, and a major part of the Amazon lies there.'],
  },
  au: {
    ru: ['Австралия одновременно страна и материковый массив, а у её берегов находится Большой Барьерный риф.'],
    en: ['Australia is both a country and a continental landmass, with the Great Barrier Reef off its coast.'],
  },
  va: {
    ru: ['Ватикан — одна из самых маленьких независимых стран мира и центр католической церкви.'],
    en: ['Vatican City is one of the smallest independent countries in the world and the center of the Catholic Church.'],
  },
  ch: {
    ru: ['В Швейцарии несколько официальных языков, а Альпы занимают важное место в жизни страны.'],
    en: ['Switzerland has several official languages, and the Alps shape much of the country.'],
  },
  np: {
    ru: ['В Непале находится Эверест — самая высокая гора на Земле.'],
    en: ['Nepal is home to Mount Everest, the highest mountain on Earth.'],
  },
  za: {
    ru: ['У ЮАР три столицы: Претория, Кейптаун и Блумфонтейн выполняют разные государственные роли.'],
    en: ['South Africa has three capitals: Pretoria, Cape Town, and Bloemfontein serve different state roles.'],
  },
  bt: {
    ru: ['Бутан известен идеей валового национального счастья, где развитие оценивают не только деньгами.'],
    en: ['Bhutan is known for Gross National Happiness, measuring development beyond money.'],
  },
  lk: {
    ru: ['Шри-Ланка известна чайными плантациями, древними городами и богатой природой.'],
    en: ['Sri Lanka is known for tea plantations, ancient cities, and rich biodiversity.'],
  },
  mx: {
    ru: ['Мексика дала миру кукурузу, шоколадные традиции и наследие цивилизаций майя и ацтеков.'],
    en: ['Mexico gave the world maize, chocolate traditions, and the heritage of Maya and Aztec civilizations.'],
  },
  al: {
    ru: ['В Албании много гор, а вдоль побережья есть пляжи Адриатического и Ионического морей.'],
    en: ['Albania is mountainous and has beaches along the Adriatic and Ionian seas.'],
  },
  gb: {
    ru: ['Великобритания состоит из Англии, Шотландии, Уэльса и Северной Ирландии.'],
    en: ['The United Kingdom is made up of England, Scotland, Wales, and Northern Ireland.'],
  },
  us: {
    ru: ['В США 50 штатов, а природа страны меняется от Аляски до пустынь Аризоны и Гавайев.'],
    en: ['The U.S. has 50 states, with landscapes ranging from Alaska to Arizona deserts and Hawaii.'],
  },
  cn: {
    ru: ['Китай известен Великой китайской стеной, древними изобретениями и огромным культурным наследием.'],
    en: ['China is known for the Great Wall, ancient inventions, and a vast cultural heritage.'],
  },
  kr: {
    ru: ['Южная Корея известна технологиями, кино, K-pop и очень быстрым городским ритмом.'],
    en: ['South Korea is known for technology, cinema, K-pop, and a fast urban rhythm.'],
  },
  gr: {
    ru: ['Греция известна древними театрами, философией и тысячами островов в Эгейском и Ионическом морях.'],
    en: ['Greece is known for ancient theaters, philosophy, and thousands of islands in the Aegean and Ionian seas.'],
  },
  tr: {
    ru: ['Турция лежит между Европой и Азией, а Стамбул исторически соединяет два континента.'],
    en: ['Turkey sits between Europe and Asia, and Istanbul historically connects two continents.'],
  },
  ke: {
    ru: ['Кения известна саваннами, Великой рифтовой долиной и сильной школой бегунов на длинные дистанции.'],
    en: ['Kenya is known for savannas, the Great Rift Valley, and world-class long-distance runners.'],
  },
  ar: {
    ru: ['Аргентина известна танго, Патагонией и одной из самых футбольных культур мира.'],
    en: ['Argentina is known for tango, Patagonia, and one of the world’s strongest football cultures.'],
  },
  in: {
    ru: ['Индия известна Тадж-Махалом, множеством языков и одной из самых больших киноиндустрий мира.'],
    en: ['India is known for the Taj Mahal, many languages, and one of the world’s largest film industries.'],
  },
  sa: {
    ru: ['В Саудовской Аравии находятся Мекка и Медина — важнейшие города ислама.'],
    en: ['Saudi Arabia is home to Mecca and Medina, the most important cities in Islam.'],
  },
  kh: {
    ru: ['Камбоджа известна храмовым комплексом Ангкор-Ват — одним из крупнейших религиозных памятников мира.'],
    en: ['Cambodia is known for Angkor Wat, one of the world’s largest religious monuments.'],
  },
  mz: {
    ru: ['Мозамбик имеет длинное побережье Индийского океана и известен островами, пляжами и морской кухней.'],
    en: ['Mozambique has a long Indian Ocean coast and is known for islands, beaches, and seafood.'],
  },
  bz: {
    ru: ['У берегов Белиза находится крупная система коралловых рифов и знаменитая Большая голубая дыра.'],
    en: ['Belize has a major coral reef system and the famous Great Blue Hole off its coast.'],
  },
  dm: {
    ru: ['Доминику называют “островом природы” Карибов: там есть тропические леса, водопады и кипящее озеро.'],
    en: ['Dominica is called the Caribbean’s “Nature Island,” with rainforests, waterfalls, and a boiling lake.'],
  },
  py: {
    ru: ['Парагвай — одна из двух стран Южной Америки без выхода к морю.'],
    en: ['Paraguay is one of only two landlocked countries in South America.'],
  },
  cy: {
    ru: ['Кипр с древности был связан с добычей меди, и само слово “copper” связывают с названием острова.'],
    en: ['Cyprus was linked to copper mining in antiquity, and the word “copper” is tied to the island’s name.'],
  },
  qa: {
    ru: ['Катар стал богатым благодаря природному газу и построил очень современную столицу Доху.'],
    en: ['Qatar became wealthy through natural gas and built a very modern capital, Doha.'],
  },
  mv: {
    ru: ['Мальдивы состоят из коралловых атоллов и считаются одной из самых низко расположенных стран мира.'],
    en: ['The Maldives is made of coral atolls and is one of the world’s lowest-lying countries.'],
  },
  sc: {
    ru: ['Сейшелы известны гранитными островами, редкими пальмами коко-де-мер и гигантскими черепахами.'],
    en: ['Seychelles is known for granite islands, rare coco de mer palms, and giant tortoises.'],
  },
  is: {
    ru: ['Исландия известна гейзерами, ледниками и тем, что геотермальная энергия активно используется в быту.'],
    en: ['Iceland is known for geysers, glaciers, and heavy everyday use of geothermal energy.'],
  },
  no: {
    ru: ['Норвегия известна фьордами, северным сиянием и длинной изрезанной береговой линией.'],
    en: ['Norway is known for fjords, northern lights, and a long rugged coastline.'],
  },
  fi: {
    ru: ['Финляндию часто называют страной тысяч озёр, а сауна там является частью повседневной культуры.'],
    en: ['Finland is often called the land of a thousand lakes, and sauna is part of everyday culture.'],
  },
  se: {
    ru: ['Швеция известна архипелагами, инженерными компаниями и сильными традициями дизайна.'],
    en: ['Sweden is known for archipelagos, engineering companies, and strong design traditions.'],
  },
  dk: {
    ru: ['Дания известна велосипедной культурой, ветроэнергетикой и городом Копенгагеном.'],
    en: ['Denmark is known for cycling culture, wind energy, and the city of Copenhagen.'],
  },
  pt: {
    ru: ['Португалия известна эпохой морских открытий, портвейном и островами Азоры и Мадейра.'],
    en: ['Portugal is known for the Age of Exploration, port wine, and the Azores and Madeira islands.'],
  },
  es: {
    ru: ['Испания известна региональным разнообразием: Каталония, Страна Басков и Андалусия сильно отличаются культурой.'],
    en: ['Spain is known for regional diversity: Catalonia, the Basque Country, and Andalusia feel very different.'],
  },
  il: {
    ru: ['В Израиле находятся места, важные для иудаизма, христианства и ислама.'],
    en: ['Israel contains places important to Judaism, Christianity, and Islam.'],
  },
  mn: {
    ru: ['Монголия — одна из самых малонаселённых по плотности стран мира и известна кочевой культурой.'],
    en: ['Mongolia is one of the world’s least densely populated countries and is known for nomadic culture.'],
  },
  kz: {
    ru: ['Казахстан — крупнейшая страна мира без выхода к морю.'],
    en: ['Kazakhstan is the largest landlocked country in the world.'],
  },
  ug: {
    ru: ['Уганда связана с озером Виктория и истоками Нила, поэтому её часто называют “жемчужиной Африки”.'],
    en: ['Uganda is tied to Lake Victoria and the Nile sources, earning the nickname “Pearl of Africa.”'],
  },
  zw: {
    ru: ['Зимбабве известно водопадом Виктория и руинами Великого Зимбабве.'],
    en: ['Zimbabwe is known for Victoria Falls and the ruins of Great Zimbabwe.'],
  },
}

function getCountriesForMode(mode: ModeId) {
  if (mode === 'world') return countries

  return countries.filter((country) => country.region === mode)
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function createQuestion(pool: Country[], previousCode?: string): Question {
  const candidates =
    previousCode && pool.length > 1
      ? pool.filter((country) => country.code !== previousCode)
      : pool
  const correct = candidates[Math.floor(Math.random() * candidates.length)]
  const wrong = shuffle(countries.filter((country) => country.code !== correct.code)).slice(0, 3)

  return {
    correct,
    options: shuffle([correct, ...wrong]),
  }
}

function getLevelKey(mode: ModeId, seconds: BlitzSeconds) {
  return `${mode}-${seconds}`
}

function clearBlitzTimer() {
  if (blitzTimeout) window.clearTimeout(blitzTimeout)
  if (blitzTicker) window.clearInterval(blitzTicker)

  blitzTimeout = undefined
  blitzTicker = undefined
}

function armBlitzTimer(
  seconds: number,
  setTimeLeft: (value: number) => void,
  onTimeout: () => void,
) {
  const startedAt = Date.now()

  clearBlitzTimer()
  setTimeLeft(seconds)

  blitzTicker = window.setInterval(() => {
    const nextTimeLeft = Math.max(0, seconds - (Date.now() - startedAt) / 1000)
    setTimeLeft(nextTimeLeft)
  }, 80)

  blitzTimeout = window.setTimeout(() => {
    clearBlitzTimer()
    setTimeLeft(0)
    onTimeout()
  }, seconds * 1000)
}

function createEmptyRegionStats(): Record<Region, RegionStat> {
  return regions.reduce(
    (stats, region) => ({
      ...stats,
      [region]: { correct: 0, total: 0 },
    }),
    {} as Record<Region, RegionStat>,
  )
}

function normalizeProfile(savedProfile?: Partial<PlayerProfile>): PlayerProfile {
  const clearedCountryCodes = [...new Set(savedProfile?.clearedCountryCodes ?? [])]
    .filter((code) => countries.some((country) => country.code === code))

  return {
    nickname: 'Player',
    xp: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalGames: 0,
    playTimeMs: 0,
    ...savedProfile,
    clearedCountryCodes,
    bestAttempts: savedProfile?.bestAttempts ?? {},
    regionStats: {
      ...createEmptyRegionStats(),
      ...(savedProfile?.regionStats ?? {}),
    },
  }
}

function loadProfile(): PlayerProfile {
  try {
    const saved = localStorage.getItem(profileKey) ?? localStorage.getItem(oldProfileKey)

    if (saved) {
      return normalizeProfile(JSON.parse(saved))
    }
  } catch {
    localStorage.removeItem(profileKey)
  }

  return normalizeProfile()
}

function loadAudioEnabled() {
  try {
    if (localStorage.getItem(audioDefaultKey) !== 'ready') {
      localStorage.setItem(audioKey, 'on')
      localStorage.setItem(audioVolumeKey, '1')
      localStorage.setItem(audioDefaultKey, 'ready')
      return true
    }

    return localStorage.getItem(audioKey) !== 'off'
  } catch {
    return true
  }
}

function loadAudioVolume() {
  try {
    const savedVolume = Number(localStorage.getItem(audioVolumeKey))

    if (Number.isFinite(savedVolume)) {
      return Math.max(0, Math.min(1, savedVolume))
    }
  } catch {
    localStorage.removeItem(audioVolumeKey)
  }

  return 1
}

function loadLanguageMode(): Language {
  try {
    const savedLanguage = localStorage.getItem(languageKey)

    if (languageOptions.includes(savedLanguage as Language)) {
      return savedLanguage as Language
    }
  } catch {
    localStorage.removeItem(languageKey)
  }

  return 'en'
}

function loadTheme(): Theme {
  try {
    return localStorage.getItem(themeKey) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function getRank(xp: number, language: Language) {
  return copy[language].ranks.reduce(
    (current, rank) => (xp >= rank.minXp ? rank : current),
    copy[language].ranks[0],
  )
}

function getNextRank(xp: number, language: Language) {
  return copy[language].ranks.find((rank) => rank.minXp > xp) ?? null
}

function getRankBadge(title: string) {
  const index = ['Rookie', 'Scout', 'Expert', 'Pro', 'Elite', 'Legend'].indexOf(title)
  const tier = Math.max(0, index)

  return {
    tier,
    short: ['R', 'S', 'X', 'P', 'E', 'L'][tier] ?? 'R',
    icon: ['◇', '◆', '✦', '★', '✹', '♛'][tier] ?? '◇',
  }
}

function getClearedMapCount(profile: PlayerProfile, seconds: BlitzSeconds) {
  const mapIds: ModeId[] = [...regions, 'world']

  return mapIds.filter((item) => Boolean(profile.bestAttempts[getLevelKey(item, seconds)])).length
}

function getStreakTitle(streak: number, language: Language) {
  if (streak < 5) return `${streak} ${copy[language].comboLabel}`

  const titles = copy[language].streakTitles

  if (streak >= 50) return titles.champion
  if (streak >= 25) return titles.master
  if (streak >= 15) return titles.legend
  if (streak >= 10) return titles.iron
  if (streak >= 5) return titles.moving
  if (streak >= 2) return titles.started

  return titles.warmup
}

function getXpReward(mode: ModeId, streak: number, seconds: BlitzSeconds) {
  const modeBonus = mode === 'world' ? 8 : mode === 'Asia' || mode === 'Africa' ? 5 : 3
  const speedBonus = seconds === 5 ? 8 : seconds === 10 ? 4 : 1
  const streakBonus = Math.min(12, Math.floor(streak / 3) * 2)

  return 10 + modeBonus + speedBonus + streakBonus
}

function formatList(items: string[], language: Language) {
  const list = new Intl.ListFormat(localeByLanguage[language], {
    style: 'long',
    type: 'conjunction',
  })

  return list.format(items.slice(0, 3))
}

function formatArea(area: number, language: Language) {
  return Math.round(area).toLocaleString(localeByLanguage[language])
}

const languageFactCopy: Record<Language, {
  multi: (name: string, count: number) => string
  single: (name: string) => string
}> = {
  ru: {
    multi: (name, count) => `${name} легко запомнить по языковой смеси: в данных страны указано ${count} официальных языка.`,
    single: (name) => `${name} не усложняет языковую подсказку: в данных страны указан один основной официальный язык.`,
  },
  en: {
    multi: (name, count) => `${name} has a language mix: ${count} official languages are listed for it.`,
    single: (name) => `${name} keeps the language clue clean: one main official language is listed for it.`,
  },
  es: {
    multi: (name, count) => `${name} tiene una mezcla lingüística: aparecen ${count} idiomas oficiales en sus datos.`,
    single: (name) => `${name} deja una pista lingüística limpia: en sus datos aparece un idioma oficial principal.`,
  },
  fr: {
    multi: (name, count) => `${name} a un vrai mélange linguistique : ${count} langues officielles sont indiquées dans ses données.`,
    single: (name) => `${name} garde un indice linguistique simple : une seule langue officielle principale est indiquée.`,
  },
  de: {
    multi: (name, count) => `${name} hat einen Sprachmix: In den Daten sind ${count} Amtssprachen aufgeführt.`,
    single: (name) => `${name} macht den Sprachhinweis einfach: In den Daten steht eine wichtigste Amtssprache.`,
  },
  ro: {
    multi: (name, count) => `${name} are un amestec lingvistic: în date apar ${count} limbi oficiale.`,
    single: (name) => `${name} păstrează indiciul lingvistic simplu: în date apare o singură limbă oficială principală.`,
  },
}

function getRegionLabel(region: Region, language: Language) {
  return copy[language].modes[region]
}

function getLanguageOptionLabel(option: Language) {
  return nativeLanguageNames[option]
}

const factCopy: Record<Language, {
  capital: (capital: string) => string
  topWorld: (name: string, rank: number) => string
  topRegion: (name: string, rank: number, region: string) => string
  area: (area: string) => string
  region: (region: string) => string
  hemisphere: (northSouth: string, eastWest: string) => string
  code: (code: string) => string
  borders: (name: string, count: number) => string
  noBorders: string
  landlocked: (name: string) => string
  islandCoast: (name: string) => string
  phone: (code: string) => string
  independent: (name: string) => string
  hemispheres: {
    north: string
    south: string
    east: string
    west: string
  }
}> = {
  ru: {
    capital: (capital) => `Столица: ${capital}. Это хорошая короткая привязка к стране.`,
    topWorld: (name, rank) => `${name} входит в топ-${rank} крупнейших стран мира по площади.`,
    topRegion: (name, rank, region) => `${name} — номер ${rank} по площади в регионе ${region}.`,
    area: (area) => `Площадь страны примерно ${area} км².`,
    region: (region) => `Страна относится к региону: ${region}.`,
    hemisphere: (northSouth, eastWest) => `Географически страна находится в ${northSouth} и ${eastWest} полушариях.`,
    code: (code) => `Трёхбуквенный код страны: ${code}. Такие коды часто встречаются в спорте и таблицах.`,
    borders: (name, count) => `У ${name} ${count} сухопутных соседей — хороший крючок для памяти, если флаг похож на соседние.`,
    noBorders: 'У этой страны нет сухопутных границ — чаще всего это островная или очень маленькая территория.',
    landlocked: (name) => `${name} не имеет выхода к морю.`,
    islandCoast: (name) => `${name} легко запомнить как страну без сухопутных соседей и с выходом к морю.`,
    phone: (code) => `Телефонный код начинается с ${code} — необычная подсказка, если любишь детали.`,
    independent: (name) => `${name} — независимая страна.`,
    hemispheres: {
      north: 'Северном',
      south: 'Южном',
      east: 'Восточном',
      west: 'Западном',
    },
  },
  en: {
    capital: (capital) => `Capital: ${capital}. It is a quick anchor for the country.`,
    topWorld: (name, rank) => `${name} is in the world's top ${rank} countries by area.`,
    topRegion: (name, rank, region) => `${name} ranks #${rank} by area in ${region}.`,
    area: (area) => `Its area is about ${area} km².`,
    region: (region) => `It belongs to the ${region} region.`,
    hemisphere: (northSouth, eastWest) => `Geographically, it sits in the ${northSouth} and ${eastWest} hemispheres.`,
    code: (code) => `Its three-letter country code is ${code}, often used in sports and tables.`,
    borders: (name, count) => `${name} touches ${count} land neighbours, a useful memory hook when nearby flags look alike.`,
    noBorders: 'This country has no land borders, usually a sign of an island or very small state.',
    landlocked: (name) => `${name} has no coastline.`,
    islandCoast: (name) => `${name} is easy to remember as a country with coastline and no land neighbours.`,
    phone: (code) => `Its calling code starts with ${code}, a tiny clue for detail lovers.`,
    independent: (name) => `${name} is an independent country.`,
    hemispheres: {
      north: 'Northern',
      south: 'Southern',
      east: 'Eastern',
      west: 'Western',
    },
  },
  es: {
    capital: (capital) => `Capital: ${capital}. Es una referencia rápida para recordar el país.`,
    topWorld: (name, rank) => `${name} está entre los ${rank} países más grandes del mundo por superficie.`,
    topRegion: (name, rank, region) => `${name} ocupa el puesto ${rank} por superficie en ${region}.`,
    area: (area) => `Su superficie es de unos ${area} km².`,
    region: (region) => `El país pertenece a la región: ${region}.`,
    hemisphere: (northSouth, eastWest) => `Geográficamente está en los hemisferios ${northSouth} y ${eastWest}.`,
    code: (code) => `Su código de tres letras es ${code}, usado a menudo en deporte y tablas.`,
    borders: (name, count) => `${name} toca ${count} vecinos terrestres, una pista útil cuando las banderas cercanas se parecen.`,
    noBorders: 'Este país no tiene fronteras terrestres; suele ser una isla o un estado muy pequeño.',
    landlocked: (name) => `${name} no tiene salida al mar.`,
    islandCoast: (name) => `${name} se recuerda bien como país con costa y sin vecinos terrestres.`,
    phone: (code) => `Su prefijo telefónico empieza por ${code}, un detalle curioso para recordarlo.`,
    independent: (name) => `${name} es un país independiente.`,
    hemispheres: {
      north: 'norte',
      south: 'sur',
      east: 'este',
      west: 'oeste',
    },
  },
  fr: {
    capital: (capital) => `Capitale : ${capital}. C'est un repère simple pour ce pays.`,
    topWorld: (name, rank) => `${name} fait partie des ${rank} plus grands pays du monde par superficie.`,
    topRegion: (name, rank, region) => `${name} est numéro ${rank} par superficie dans la région ${region}.`,
    area: (area) => `Sa superficie est d'environ ${area} km².`,
    region: (region) => `Le pays appartient à la région : ${region}.`,
    hemisphere: (northSouth, eastWest) => `Géographiquement, il se trouve dans les hémisphères ${northSouth} et ${eastWest}.`,
    code: (code) => `Son code pays à trois lettres est ${code}, souvent utilisé dans le sport et les tableaux.`,
    borders: (name, count) => `${name} touche ${count} voisins terrestres, un bon repère quand les drapeaux proches se ressemblent.`,
    noBorders: "Ce pays n'a pas de frontières terrestres ; c'est souvent une île ou un très petit État.",
    landlocked: (name) => `${name} n'a pas d'accès à la mer.`,
    islandCoast: (name) => `${name} se retient bien comme pays côtier sans voisins terrestres.`,
    phone: (code) => `Son indicatif téléphonique commence par ${code}, un petit détail curieux.`,
    independent: (name) => `${name} est un pays indépendant.`,
    hemispheres: {
      north: 'nord',
      south: 'sud',
      east: 'est',
      west: 'ouest',
    },
  },
  de: {
    capital: (capital) => `Hauptstadt: ${capital}. Das ist ein kurzer Anker für das Land.`,
    topWorld: (name, rank) => `${name} gehört flächenmäßig zu den ${rank} größten Ländern der Welt.`,
    topRegion: (name, rank, region) => `${name} liegt flächenmäßig auf Platz ${rank} in der Region ${region}.`,
    area: (area) => `Die Fläche beträgt ungefähr ${area} km².`,
    region: (region) => `Das Land gehört zur Region: ${region}.`,
    hemisphere: (northSouth, eastWest) => `Geografisch liegt es auf der ${northSouth} und ${eastWest} Halbkugel.`,
    code: (code) => `Der dreibuchstabige Ländercode ist ${code}; solche Codes sieht man oft im Sport und in Tabellen.`,
    borders: (name, count) => `${name} hat ${count} Landnachbarn, ein guter Merkhaken bei ähnlich wirkenden Flaggen.`,
    noBorders: 'Dieses Land hat keine Landgrenzen; oft ist es eine Insel oder ein sehr kleiner Staat.',
    landlocked: (name) => `${name} hat keinen Zugang zum Meer.`,
    islandCoast: (name) => `${name} merkt man sich gut als Land mit Küste und ohne Landnachbarn.`,
    phone: (code) => `Die Telefonvorwahl beginnt mit ${code}, ein kleines Detail zum Merken.`,
    independent: (name) => `${name} ist ein unabhängiges Land.`,
    hemispheres: {
      north: 'nördlichen',
      south: 'südlichen',
      east: 'östlichen',
      west: 'westlichen',
    },
  },
  ro: {
    capital: (capital) => `Capitala: ${capital}. Este un reper scurt pentru țară.`,
    topWorld: (name, rank) => `${name} este în top ${rank} cele mai mari țări din lume după suprafață.`,
    topRegion: (name, rank, region) => `${name} este pe locul ${rank} după suprafață în regiunea ${region}.`,
    area: (area) => `Suprafața țării este de aproximativ ${area} km².`,
    region: (region) => `Țara aparține regiunii: ${region}.`,
    hemisphere: (northSouth, eastWest) => `Geografic, se află în emisferele ${northSouth} și ${eastWest}.`,
    code: (code) => `Codul de trei litere al țării este ${code}, folosit des în sport și tabele.`,
    borders: (name, count) => `${name} are ${count} vecini tereștri, un reper bun când steagurile din zonă seamănă.`,
    noBorders: 'Această țară nu are granițe terestre; de obicei este o insulă sau un stat foarte mic.',
    landlocked: (name) => `${name} nu are ieșire la mare.`,
    islandCoast: (name) => `${name} se reține ușor ca țară cu coastă și fără vecini tereștri.`,
    phone: (code) => `Prefixul telefonic începe cu ${code}, un detaliu curios de reținut.`,
    independent: (name) => `${name} este o țară independentă.`,
    hemispheres: {
      north: 'nordică',
      south: 'sudică',
      east: 'estică',
      west: 'vestică',
    },
  },
}

function getHemisphereFact(country: Country, language: Language) {
  const text = factCopy[language]
  const [latitude, longitude] = country.latlng
  const northSouth = latitude >= 0 ? text.hemispheres.north : text.hemispheres.south
  const eastWest = longitude >= 0 ? text.hemispheres.east : text.hemispheres.west

  return text.hemisphere(northSouth, eastWest)
}

type CuratedFactCopy = {
  topWorld: (name: string, rank: number) => string
  topRegion: (name: string, region: string) => string
  tinyArea: (name: string, area: string) => string
  hugeArea: (name: string, area: string) => string
  languageMix: (name: string, languages: string) => string
  singleLanguage: (name: string, languageName: string) => string
  multiCurrency: (name: string) => string
  borderPuzzle: (name: string, count: number) => string
  singleBorder: (name: string) => string
  noLandNeighbours: (name: string) => string
  landlocked: (name: string) => string
  islandCoast: (name: string) => string
  subregion: (name: string, subregion: string) => string
  farEquator: (name: string) => string
  nearEquator: (name: string) => string
  mapEdge: (name: string) => string
  regionChaos: (name: string, region: string) => string
}

const curatedFactCopy: Record<Language, CuratedFactCopy> = {
  en: {
    topWorld: (name, rank) => `${name} is a map boss: it sits in the world's top ${rank} countries by land area.`,
    topRegion: (name, region) => `Inside ${region}, ${name} is one of the three biggest land-area heavyweights.`,
    tinyArea: (name, area) => `${name} is only about ${area} km2, which makes its flag a perfect tiny-map trap.`,
    hugeArea: (name, area) => `${name} covers about ${area} km2, so distance itself becomes part of the country's personality.`,
    languageMix: (name, languages) => `${name} is a language mix: ${languages} are all part of the country.`,
    singleLanguage: (name, languageName) => `${name} keeps the language clue clean: ${languageName} is the main language listed for it.`,
    multiCurrency: (name) => `${name} has a money twist: more than one currency is listed for it.`,
    borderPuzzle: (name, count) => `${name} touches ${count} neighbours, so it is basically a border puzzle.`,
    singleBorder: (name) => `${name} has exactly one land neighbour, a neat little geography clue.`,
    noLandNeighbours: (name) => `${name} has no land neighbours, so the flag often belongs to an island-style memory bucket.`,
    landlocked: (name) => `${name} is landlocked, so every sea route starts with crossing somebody else's map.`,
    islandCoast: (name) => `${name} has coastline but no land neighbours, which makes it easier to mentally file as an island clue.`,
    subregion: (name, subregion) => `${name} belongs to ${subregion}, a useful clue when two flags feel annoyingly similar.`,
    farEquator: (name) => `${name} sits far from the equator, so climate and daylight can be part of the story.`,
    nearEquator: (name) => `${name} is close to the equator, a sneaky geography hint hidden behind the flag.`,
    mapEdge: (name) => `${name} is tucked near the far edge of world maps, the kind of country quizzes love to punish you with.`,
    regionChaos: (name, region) => `${name} sits in ${region}, so its flag belongs to that region's visual chaos.`,
  },
  ru: {
    topWorld: (name, rank) => `${name} - настоящий босс карты: входит в топ-${rank} стран мира по площади.`,
    topRegion: (name, region) => `В регионе ${region} страна ${name} входит в тройку самых больших по площади.`,
    tinyArea: (name, area) => `${name} занимает примерно ${area} км2, поэтому её флаг - идеальная ловушка маленькой карты.`,
    hugeArea: (name, area) => `${name} занимает примерно ${area} км2, так что расстояния там сами становятся частью характера страны.`,
    languageMix: (name, languages) => `${name} - языковой микс: ${languages} реально уживаются в одной стране.`,
    singleLanguage: (name, languageName) => `${name} даёт чистую языковую подсказку: основной язык в данных - ${languageName}.`,
    multiCurrency: (name) => `У ${name} есть денежный твист: в данных указано больше одной валюты.`,
    borderPuzzle: (name, count) => `${name} граничит с ${count} странами - это почти головоломка из соседей.`,
    singleBorder: (name) => `У ${name} ровно один сухопутный сосед - маленькая, но цепкая географическая подсказка.`,
    noLandNeighbours: (name) => `У ${name} нет сухопутных соседей, так что флаг удобно держать в "островной" памяти.`,
    landlocked: (name) => `${name} без выхода к морю: любой путь к океану начинается через чужую карту.`,
    islandCoast: (name) => `${name} имеет берег, но не имеет сухопутных соседей - отличный островной крючок для памяти.`,
    subregion: (name, subregion) => `${name} относится к региону ${subregion}; это помогает, когда два флага бесят похожестью.`,
    farEquator: (name) => `${name} далеко от экватора, поэтому климат и длина дня там уже часть истории.`,
    nearEquator: (name) => `${name} близко к экватору - это скрытая географическая подсказка за флагом.`,
    mapEdge: (name) => `${name} прячется у дальнего края мировых карт - такие страны квизы особенно любят подкидывать.`,
    regionChaos: (name, region) => `${name} находится в регионе ${region}, а значит её флаг - часть местного визуального хаоса.`,
  },
  es: {
    topWorld: (name, rank) => `${name} es un jefe del mapa: esta en el top ${rank} mundial por superficie.`,
    topRegion: (name, region) => `Dentro de ${region}, ${name} esta entre los tres pesos pesados por superficie.`,
    tinyArea: (name, area) => `${name} tiene solo unos ${area} km2, una trampa perfecta de mapa pequeno.`,
    hugeArea: (name, area) => `${name} cubre unos ${area} km2, asi que la distancia forma parte de su personalidad.`,
    languageMix: (name, languages) => `${name} es una mezcla de idiomas: ${languages} conviven en el pais.`,
    singleLanguage: (name, languageName) => `${name} deja una pista limpia: ${languageName} es el idioma principal listado.`,
    multiCurrency: (name) => `${name} tiene un giro monetario: aparece mas de una moneda en los datos.`,
    borderPuzzle: (name, count) => `${name} toca ${count} vecinos, asi que es practicamente un rompecabezas de fronteras.`,
    singleBorder: (name) => `${name} tiene exactamente un vecino terrestre, una pista geografica facil de recordar.`,
    noLandNeighbours: (name) => `${name} no tiene vecinos terrestres, asi que su bandera suele caer en la memoria de islas.`,
    landlocked: (name) => `${name} no tiene salida al mar, asi que toda ruta marina empieza cruzando otro mapa.`,
    islandCoast: (name) => `${name} tiene costa pero no vecinos terrestres, una pista mental muy de isla.`,
    subregion: (name, subregion) => `${name} pertenece a ${subregion}, util cuando dos banderas se parecen demasiado.`,
    farEquator: (name) => `${name} esta lejos del ecuador, asi que el clima y la luz tambien cuentan la historia.`,
    nearEquator: (name) => `${name} esta cerca del ecuador, una pista geografica escondida tras la bandera.`,
    mapEdge: (name) => `${name} queda cerca del borde de muchos mapamundis, justo el tipo de pais que los quiz aman lanzar.`,
    regionChaos: (name, region) => `${name} esta en ${region}, asi que su bandera pertenece al caos visual de esa region.`,
  },
  fr: {
    topWorld: (name, rank) => `${name} est un boss de carte: le pays est dans le top ${rank} mondial par superficie.`,
    topRegion: (name, region) => `Dans ${region}, ${name} fait partie des trois grands poids lourds par superficie.`,
    tinyArea: (name, area) => `${name} fait seulement environ ${area} km2, un piege parfait de petite carte.`,
    hugeArea: (name, area) => `${name} couvre environ ${area} km2, donc la distance fait partie de son identite.`,
    languageMix: (name, languages) => `${name} est un melange de langues: ${languages} font partie du pays.`,
    singleLanguage: (name, languageName) => `${name} donne un indice simple: ${languageName} est la langue principale indiquee.`,
    multiCurrency: (name) => `${name} a une surprise monetaire: plusieurs monnaies sont listees.`,
    borderPuzzle: (name, count) => `${name} touche ${count} voisins, donc c'est presque un puzzle de frontieres.`,
    singleBorder: (name) => `${name} a exactement un voisin terrestre, un petit indice geographique net.`,
    noLandNeighbours: (name) => `${name} n'a aucun voisin terrestre, donc son drapeau se range bien dans la memoire des iles.`,
    landlocked: (name) => `${name} est enclavé: chaque route vers la mer commence par la carte de quelqu'un d'autre.`,
    islandCoast: (name) => `${name} a une cote mais aucun voisin terrestre, un bon indice mental d'ile.`,
    subregion: (name, subregion) => `${name} appartient a ${subregion}, utile quand deux drapeaux se ressemblent trop.`,
    farEquator: (name) => `${name} est loin de l'equateur, donc le climat et la lumiere font partie de l'histoire.`,
    nearEquator: (name) => `${name} est proche de l'equateur, un indice geographique cache derriere le drapeau.`,
    mapEdge: (name) => `${name} se cache pres du bord des cartes du monde, le genre de pays que les quiz adorent sortir.`,
    regionChaos: (name, region) => `${name} est en ${region}, donc son drapeau appartient au chaos visuel de cette region.`,
  },
  de: {
    topWorld: (name, rank) => `${name} ist ein Kartenboss: Das Land liegt weltweit unter den Top ${rank} nach Fläche.`,
    topRegion: (name, region) => `In ${region} gehört ${name} zu den drei großen Flächen-Schwergewichten.`,
    tinyArea: (name, area) => `${name} ist nur etwa ${area} km2 groß, eine perfekte Mini-Kartenfalle.`,
    hugeArea: (name, area) => `${name} umfasst etwa ${area} km2, deshalb wird Entfernung selbst Teil des Landescharakters.`,
    languageMix: (name, languages) => `${name} ist ein Sprachmix: ${languages} gehören alle zum Land.`,
    singleLanguage: (name, languageName) => `${name} macht den Sprachhinweis einfach: ${languageName} ist die wichtigste gelistete Sprache.`,
    multiCurrency: (name) => `${name} hat einen Geld-Twist: In den Daten steht mehr als eine Währung.`,
    borderPuzzle: (name, count) => `${name} berührt ${count} Nachbarn, also ist es praktisch ein Grenzrätsel.`,
    singleBorder: (name) => `${name} hat genau einen Landnachbarn, ein sauberer kleiner Geografie-Hinweis.`,
    noLandNeighbours: (name) => `${name} hat keine Landnachbarn, deshalb passt die Flagge oft in die Insel-Schublade im Kopf.`,
    landlocked: (name) => `${name} hat keinen Meerzugang, jede Seeroute beginnt also über die Karte eines anderen Landes.`,
    islandCoast: (name) => `${name} hat Küste, aber keine Landnachbarn - ein starker Insel-Haken fürs Gedächtnis.`,
    subregion: (name, subregion) => `${name} gehört zu ${subregion}, nützlich, wenn zwei Flaggen nervig ähnlich wirken.`,
    farEquator: (name) => `${name} liegt weit vom Äquator entfernt, daher erzählen Klima und Tageslicht mit.`,
    nearEquator: (name) => `${name} liegt nah am Äquator, ein versteckter Geografie-Hinweis hinter der Flagge.`,
    mapEdge: (name) => `${name} liegt nahe am Rand vieler Weltkarten, genau die Art Land, die Quizspiele gern auspacken.`,
    regionChaos: (name, region) => `${name} liegt in ${region}, seine Flagge gehört also zum visuellen Chaos dieser Region.`,
  },
  ro: {
    topWorld: (name, rank) => `${name} este un boss de hartă: se află în top ${rank} mondial după suprafață.`,
    topRegion: (name, region) => `În ${region}, ${name} este printre cele mai mari trei țări după suprafață.`,
    tinyArea: (name, area) => `${name} are doar aproximativ ${area} km2, o capcană perfectă de hartă mică.`,
    hugeArea: (name, area) => `${name} acoperă aproximativ ${area} km2, așa că distanța devine parte din personalitatea țării.`,
    languageMix: (name, languages) => `${name} este un mix de limbi: ${languages} fac parte din țară.`,
    singleLanguage: (name, languageName) => `${name} oferă un indiciu simplu: ${languageName} este limba principală listată.`,
    multiCurrency: (name) => `${name} are un detaliu monetar curios: este listată mai mult de o monedă.`,
    borderPuzzle: (name, count) => `${name} atinge ${count} vecini, deci este aproape un puzzle de granițe.`,
    singleBorder: (name) => `${name} are exact un vecin terestru, un indiciu geografic mic și clar.`,
    noLandNeighbours: (name) => `${name} nu are vecini tereștri, deci steagul intră ușor în categoria de insule.`,
    landlocked: (name) => `${name} nu are ieșire la mare, deci orice drum maritim începe prin harta altcuiva.`,
    islandCoast: (name) => `${name} are coastă, dar nu are vecini tereștri - un indiciu mental bun de insulă.`,
    subregion: (name, subregion) => `${name} aparține de ${subregion}, util când două steaguri par enervant de similare.`,
    farEquator: (name) => `${name} este departe de ecuator, deci clima și lumina fac parte din poveste.`,
    nearEquator: (name) => `${name} este aproape de ecuator, un indiciu geografic ascuns în spatele steagului.`,
    mapEdge: (name) => `${name} stă aproape de marginea multor hărți ale lumii, genul de țară pe care quizurile adoră să o arunce.`,
    regionChaos: (name, region) => `${name} este în ${region}, deci steagul său face parte din haosul vizual al regiunii.`,
  },
}

function readFactCursors() {
  try {
    const saved = localStorage.getItem(factCursorKey)

    if (!saved) return {}

    const parsed = JSON.parse(saved)

    if (!parsed || typeof parsed !== 'object') return {}

    return parsed as Record<string, number>
  } catch {
    return {}
  }
}

function getNextFactIndex(countryCode: string) {
  const cursors = readFactCursors()
  const nextIndex = Math.max(0, cursors[countryCode] ?? 0)

  try {
    localStorage.setItem(factCursorKey, JSON.stringify({
      ...cursors,
      [countryCode]: nextIndex + 1,
    }))
  } catch {
    // Fact rotation is nice to have; the quiz should keep working if storage is full.
  }

  return nextIndex
}

function buildCountryFactPool(country: Country, language: Language) {
  const providedFacts = getProvidedCountryFacts(country.code, language)

  if (providedFacts?.length) {
    return providedFacts
  }

  const specialCountryFacts = specialFacts[country.code]?.[language] ?? []
  const text = factCopy[language]
  const curated = curatedFactCopy[language]
  const name = country.name[language]
  const regionLabel = getRegionLabel(country.region, language)
  const worldAreaRank = areaRankByCode.get(country.code)
  const regionAreaRank = regionAreaRankByCode.get(country.code)
  const [latitude, longitude] = country.latlng
  const facts = new Set<string>([
    ...specialCountryFacts,
  ])

  if (worldAreaRank && worldAreaRank <= 12) {
    facts.add(curated.topWorld(name, worldAreaRank))
  }

  if (regionAreaRank && regionAreaRank <= 3) {
    facts.add(curated.topRegion(name, regionLabel))
  }

  if (country.area > 0) {
    const formattedArea = formatArea(country.area, language)

    if (country.area <= 1_000) {
      facts.add(curated.tinyArea(name, formattedArea))
    } else if (country.area >= 750_000) {
      facts.add(curated.hugeArea(name, formattedArea))
    }
  }

  if (country.languages.length >= 3) {
    facts.add(
      language === 'en'
        ? curated.languageMix(name, formatList(country.languages, language))
        : languageFactCopy[language].multi(name, country.languages.length),
    )
  } else if (country.languages.length === 1) {
    facts.add(
      language === 'en'
        ? curated.singleLanguage(name, country.languages[0])
        : languageFactCopy[language].single(name),
    )
  }

  if (country.currencies.length > 1) {
    facts.add(curated.multiCurrency(name))
  }

  if (country.borders.length >= 8) {
    facts.add(curated.borderPuzzle(name, country.borders.length))
  } else if (country.borders.length === 1) {
    facts.add(curated.singleBorder(name))
  } else if (country.borders.length === 0) {
    facts.add(curated.noLandNeighbours(name))
  } else {
    facts.add(text.borders(name, country.borders.length))
  }

  if (country.landlocked) {
    facts.add(curated.landlocked(name))
  }

  if (!country.landlocked && !country.borders.length) {
    facts.add(curated.islandCoast(name))
  }

  if (country.subregion) {
    facts.add(curated.subregion(name, language === 'en' ? country.subregion : regionLabel))
  }

  if (Math.abs(latitude) > 50) {
    facts.add(curated.farEquator(name))
  } else if (Math.abs(latitude) < 8) {
    facts.add(curated.nearEquator(name))
  }

  if (Math.abs(longitude) > 150) {
    facts.add(curated.mapEdge(name))
  }

  facts.add(getHemisphereFact(country, language))
  facts.add(curated.regionChaos(name, regionLabel))

  return [...facts].filter(Boolean).slice(0, Math.max(3, facts.size))
}

function getCountryFact(country: Country, language: Language) {
  const facts = buildCountryFactPool(country, language)
  const factIndex = getNextFactIndex(country.code)

  return facts[factIndex % facts.length] ?? factCopy[language].independent(country.name[language])
}

function ModeMap({ mode }: { mode: ModeId }) {
  if (mode === 'world') {
    return (
      <svg className="mode-map mode-map-world" viewBox="0 0 240 160" aria-hidden="true">
        <circle className="globe-shell" cx="130" cy="82" r="54" />
        <path className="globe-line" d="M79 82h102" />
        <path className="globe-line" d="M130 28c-18 20-25 54-2 108" />
        <path className="globe-line" d="M130 28c20 23 26 56 1 108" />
        <path d="M79 61c12-19 34-31 60-29 17 3 31 12 42 28-22-6-39-4-52 5-17 11-33 9-50-4Z" />
        <path d="M85 93c18 8 33 8 47-1 16-9 32-8 48 3-9 24-28 39-57 38-21-3-34-16-38-40Z" />
      </svg>
    )
  }

  const paths: Record<Region, string[]> = {
    Europe: [
      'M69 79 86 63l28-5 20 8 18-8 25 10 12 19-16 11 9 20-20 12-24-7-24 12-23-8 4-21-21-8-18 8-12-12Z',
      'M102 18 130 12l22 16-8 31-28-2-21 13-10-20Z',
      'M69 57 48 48l-23 12 4 18 24 1Z',
      'M129 124 148 132l-2 22-20 2-8-17Z',
      'M161 128 181 129l12 13-23 8-17-8Z',
    ],
    Asia: [
      'M24 59 62 32l58-14 61 12 37 35-13 29 20 22-31 23-45-9-29 18-35-13-18-27-39-14 11-22Z',
      'M124 111 151 121l-4 30-22 4-19-25Z',
      'M167 108 194 113l22 21-31 15-23-18Z',
      'M88 121 105 136l-18 17-22-12Z',
      'M207 70 224 79l-4 20-22 5-9-18Z',
    ],
    Africa: [
      'M93 19 134 26l30 28 8 39-22 35-23 32-33-19-19-39-18-27 14-37Z',
      'M138 54 178 64l18 16-25 11-17-12Z',
      'M81 18 99 13l23 12-16 17-28-6Z',
      'M152 122 169 133l-6 23-21 5-8-17Z',
      'M185 104 199 116l-9 26-14 9-5-24Z',
    ],
    Americas: [
      'M71 14 120 24l34 27-17 27 21 18-27 23-39-18-31 4-22-30 17-21-27-16Z',
      'M132 101 159 113l-9 23 18 20-16 24-24-16-11-33Z',
      'M55 96 86 99l24 18-23 13-29-9Z',
      'M28 50 55 45l17 18-26 16-24-9Z',
      'M145 78 177 83l15 19-25 9-24-15Z',
    ],
    Oceania: [
      'M67 91 102 72l48 8 31 25-9 29-39 13-47-7-34-21Z',
      'M184 121 204 129l10 17-18 10-18-12Z',
      'M205 97 221 103l-10 16-17-4Z',
      'M37 102 57 96l20 9-18 15-24-7Z',
      'M166 59 190 53l21 13-21 17-24-7Z',
      'M111 51 133 45l19 10-18 14-24-5Z',
    ],
  }

  return (
    <svg className={`mode-map mode-map-${mode.toLowerCase()}`} viewBox="0 0 240 160" aria-hidden="true">
      {paths[mode].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}

const modeSceneIcons: Record<ModeId, string> = {
  Europe: europeModeIcon,
  Asia: asiaModeIcon,
  Africa: africaModeIcon,
  Americas: americasModeIcon,
  Oceania: oceaniaModeIcon,
  world: worldModeIcon,
}

function ModeScene({ mode }: { mode: ModeId }) {
  return (
    <span className="mode-scene-shell" aria-hidden="true">
      <img className="mode-scene" src={modeSceneIcons[mode]} alt="" />
    </span>
  )
}

function getAudioContext() {
  const AudioEngine = window.AudioContext || (window as AudioWindow).webkitAudioContext

  if (!AudioEngine) return null
  if (!audioContext) audioContext = new AudioEngine()

  return audioContext
}

function getAudioOutput(context: AudioContext) {
  if (!audioOutputGain || !audioCompressor) {
    audioOutputGain = context.createGain()
    audioCompressor = context.createDynamicsCompressor()

    audioOutputGain.gain.setValueAtTime(1, context.currentTime)
    audioCompressor.threshold.setValueAtTime(-12, context.currentTime)
    audioCompressor.knee.setValueAtTime(18, context.currentTime)
    audioCompressor.ratio.setValueAtTime(4, context.currentTime)
    audioCompressor.attack.setValueAtTime(0.003, context.currentTime)
    audioCompressor.release.setValueAtTime(0.16, context.currentTime)

    audioOutputGain.connect(audioCompressor)
    audioCompressor.connect(context.destination)
  }

  return audioOutputGain
}

function primeAudioEngine() {
  if (audioMuted || audioPausedByLifecycle || masterVolume <= 0 || audioPrimed) return

  const context = getAudioContext()

  if (!context || context.state === 'closed') return

  getAudioOutput(context)

  if (context.state === 'suspended') {
    void context.resume().then(() => {
      audioPrimed = !audioPausedByLifecycle && context.state === 'running'
    })
    return
  }

  audioPrimed = true
}

function withRunningAudio(callback: (context: AudioContext) => void) {
  if (audioMuted || audioPausedByLifecycle || masterVolume <= 0) return

  const context = getAudioContext()

  if (!context || context.state === 'closed') return

  getAudioOutput(context)

  if (context.state === 'suspended') {
    void context.resume().then(() => {
      if (!audioMuted && !audioPausedByLifecycle && masterVolume > 0 && context.state === 'running') {
        audioPrimed = true
        callback(context)
      }
    })
    return
  }

  audioPrimed = true
  callback(context)
}

function setMusicVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume))

  if (musicGain && audioContext) {
    musicGain.gain.cancelScheduledValues(audioContext.currentTime)
    musicGain.gain.setTargetAtTime(musicOutputGain * masterVolume, audioContext.currentTime, 0.03)
  }
}

function setAudioEngineEnabled(enabled: boolean) {
  audioMuted = !enabled

  if (!enabled) {
    stopMusic()
    audioPrimed = false
    void audioContext?.suspend()
  } else if (audioContext?.state === 'suspended') {
    void audioContext.resume()
  }
}

function pauseAudioForLifecycle() {
  audioPausedByLifecycle = true
  audioPrimed = false
  stopMusic()
  void audioContext?.suspend()
}

function resumeAudioForLifecycle() {
  audioPausedByLifecycle = false
}

function playTone(
  frequency: number,
  duration = 0.12,
  volume = 0.08,
  type: OscillatorType = 'sine',
  delay = 0,
) {
  if (audioMuted || masterVolume <= 0) return

  withRunningAudio((context) => {
    const start = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    const boostedVolume = Math.min(0.85, volume * toneGainBoost * masterVolume)

    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, boostedVolume), start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(getAudioOutput(context))
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  })
}

function playClickSound() {
  playTone(420, 0.06, 0.09, 'triangle')
}

function playCorrectSound() {
  playTone(520, 0.11, 0.11, 'sine')
  playTone(780, 0.14, 0.12, 'sine', 0.09)
  playTone(1040, 0.16, 0.09, 'triangle', 0.18)
}

function playVictorySound() {
  stopMusic()
  playTone(392, 0.16, 0.12, 'triangle', 0)
  playTone(523, 0.18, 0.13, 'triangle', 0.13)
  playTone(659, 0.2, 0.14, 'sine', 0.28)
  playTone(784, 0.24, 0.15, 'sine', 0.45)
  playTone(1046, 0.42, 0.13, 'triangle', 0.7)
  playTone(1318, 0.32, 0.09, 'sine', 0.92)
}

function playWrongSound() {
  playTone(210, 0.16, 0.11, 'sawtooth')
  playTone(145, 0.2, 0.09, 'sawtooth', 0.12)
}

function startMusic() {
  if (audioMuted || audioPausedByLifecycle || masterVolume <= 0) return

  withRunningAudio((context) => {
    if (musicTimer) return

    musicGain = context.createGain()
    musicGain.gain.setValueAtTime(musicOutputGain * masterVolume, context.currentTime)
    musicGain.connect(getAudioOutput(context))

    const notes = [196, 247, 294, 247, 220, 262, 330, 262]
    let step = 0

    const playMusicNote = () => {
      if (!audioContext || !musicGain || audioMuted || masterVolume <= 0) return

      const now = audioContext.currentTime
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(notes[step % notes.length], now)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.62, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)
      oscillator.connect(gain)
      gain.connect(musicGain)
      oscillator.start(now)
      oscillator.stop(now + 0.3)
      step += 1
    }

    playMusicNote()
    musicTimer = window.setInterval(playMusicNote, 420)
  })
}

function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer)
    musicTimer = undefined
  }

  if (musicGain && audioContext) {
    musicGain.gain.cancelScheduledValues(audioContext.currentTime)
    musicGain.gain.setValueAtTime(0.0001, audioContext.currentTime)
  }

  musicGain?.disconnect()
  musicGain = null
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [appInForeground, setAppInForeground] = useState(true)
  const [languageMode, setLanguageMode] = useState<Language>(loadLanguageMode)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [mode, setMode] = useState<ModeId>('world')
  const [blitzSeconds, setBlitzSeconds] = useState<BlitzSeconds>(10)
  const [timeLeft, setTimeLeft] = useState(10)
  const [remainingCodes, setRemainingCodes] = useState<string[]>([])
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswerCode, setSelectedAnswerCode] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [lastXpReward, setLastXpReward] = useState(0)
  const [countryFact, setCountryFact] = useState<string | null>(null)
  const [flagMetrics, setFlagMetrics] = useState({ code: '', ratio: 1.5 })
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false)
  const [profile, setProfile] = useState(loadProfile)
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname)
  const [audioEnabled, setAudioEnabled] = useState(loadAudioEnabled)
  const [audioVolume, setAudioVolume] = useState(loadAudioVolume)

  const language = languageMode
  const text = copy[language]
  const currentCountries = useMemo(() => getCountriesForMode(mode), [mode])
  const isAnsweredCorrect = Boolean(
    question && selectedAnswerCode === question.correct.code,
  )
  const isAnsweredWrong = Boolean(
    question && selectedAnswerCode && selectedAnswerCode !== question.correct.code,
  )
  const answeredDeckCount =
    currentCountries.length - remainingCodes.length + (isAnsweredCorrect ? 1 : 0)
  const isDeckCompleteResult = Boolean(
    screen === 'game' &&
      question &&
      selectedAnswerCode &&
      isAnsweredCorrect &&
      answeredDeckCount >= currentCountries.length,
  )
  const activeFlagRatio =
    question && flagMetrics.code === question.correct.code ? flagMetrics.ratio : 1.5
  const musicBlockedByResult = Boolean(
    screen === 'game' && (isAnsweredWrong || isDeckCompleteResult),
  )
  const musicAutoplayScreen =
    screen === 'landing' ||
    screen === 'home' ||
    screen === 'modeSelect' ||
    screen === 'game'
  const rank = getRank(profile.xp, language)
  const nextRank = getNextRank(profile.xp, language)
  const rankBadge = getRankBadge(rank.title)
  const rankBase = rank.minXp
  const rankTarget = nextRank?.minXp ?? rank.minXp + 700
  const rankProgress = Math.min(100, ((profile.xp - rankBase) / (rankTarget - rankBase)) * 100)
  const clearedMapCount = getClearedMapCount(profile, blitzSeconds)
  const clearedCountryCodes = new Set(profile.clearedCountryCodes)
  const countriesClearedCount = countries.filter((country) => clearedCountryCodes.has(country.code)).length
  const modes = useMemo(
    () =>
      ([...(['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'] as Region[]), 'world'] as ModeId[])
        .map((item) => ({
          id: item,
          label: text.modes[item],
          emoji: text.modeInfo[item].emoji,
          description: text.modeInfo[item].description,
          count: getCountriesForMode(item).length,
          bestAttempts: profile.bestAttempts[getLevelKey(item, blitzSeconds)],
        })),
    [text, blitzSeconds, profile.bestAttempts],
  )
  const regionRows = useMemo(
    () =>
      regions.map((item) => {
        const stats = profile.regionStats[item]
        const regionCountries = getCountriesForMode(item)
        const cleared = regionCountries.filter((country) =>
          profile.clearedCountryCodes.includes(country.code),
        ).length
        const total = regionCountries.length
        const accuracy = total > 0 ? Math.round((cleared / total) * 100) : 0

        return {
          id: item,
          label: text.modes[item],
          attemptsCorrect: stats.correct,
          attemptsTotal: stats.total,
          correct: cleared,
          total,
          accuracy,
        }
      }),
    [profile.clearedCountryCodes, profile.regionStats, text],
  )
  const playedHours = (profile.playTimeMs / 3_600_000).toFixed(profile.playTimeMs >= 3_600_000 ? 1 : 2)
  const completedRegionRows = regionRows.filter((item) => item.correct > 0)
  const bestRegion = [...completedRegionRows].sort((first, second) => second.accuracy - first.accuracy)[0]
  const worstRegion = [...completedRegionRows].sort((first, second) => first.accuracy - second.accuracy)[0]

  useEffect(() => {
    setMusicVolume(audioVolume)
  }, [audioVolume])

  useEffect(() => {
    setAudioEngineEnabled(audioEnabled)
  }, [audioEnabled])

  useEffect(() => {
    if (!audioEnabled || audioVolume <= 0) return undefined

    const prime = () => primeAudioEngine()
    const options = { capture: true, passive: true }

    window.addEventListener('pointerdown', prime, options)
    window.addEventListener('touchstart', prime, options)
    window.addEventListener('keydown', prime, true)

    return () => {
      window.removeEventListener('pointerdown', prime, options)
      window.removeEventListener('touchstart', prime, options)
      window.removeEventListener('keydown', prime, true)
    }
  }, [audioEnabled, audioVolume])

  useEffect(() => {
    const pause = () => {
      pauseAudioForLifecycle()
      setAppInForeground(false)
    }
    const resume = () => {
      if (document.hidden) return

      resumeAudioForLifecycle()
      setAppInForeground(true)
    }
    const syncVisibility = () => {
      if (document.hidden) {
        pause()
      } else {
        resume()
      }
    }

    document.addEventListener('visibilitychange', syncVisibility)
    window.addEventListener('pagehide', pause)
    window.addEventListener('beforeunload', pause)
    window.addEventListener('flagrushpause', pause)
    window.addEventListener('flagrushresume', resume)

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('beforeunload', pause)
      window.removeEventListener('flagrushpause', pause)
      window.removeEventListener('flagrushresume', resume)
    }
  }, [])

  useEffect(() => {
    if (
      !appInForeground ||
      !musicAutoplayScreen ||
      musicBlockedByResult ||
      !audioEnabled ||
      audioVolume <= 0
    ) return

    primeAudioEngine()
    startMusic()
    const retryStart = window.setTimeout(startMusic, 140)
    const lateRetryStart = window.setTimeout(startMusic, 700)

    return () => {
      window.clearTimeout(retryStart)
      window.clearTimeout(lateRetryStart)
    }
  }, [
    appInForeground,
    audioEnabled,
    audioVolume,
    musicAutoplayScreen,
    musicBlockedByResult,
  ])

  useEffect(() => {
    if (screen !== 'game' || pauseMenuOpen) return undefined

    const timer = window.setInterval(() => {
      setProfile((currentProfile) => {
        const nextProfile = {
          ...currentProfile,
          playTimeMs: currentProfile.playTimeMs + 10_000,
        }

        localStorage.setItem(profileKey, JSON.stringify(nextProfile))
        return nextProfile
      })
    }, 10_000)

    return () => window.clearInterval(timer)
  }, [pauseMenuOpen, screen])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [screen])

  function persistProfile(nextProfile: PlayerProfile) {
    setProfile(nextProfile)
    localStorage.setItem(profileKey, JSON.stringify(nextProfile))
  }

  function getProfileAfterAnswer(
    currentProfile: PlayerProfile,
    country: Country | null,
    isCorrectAnswer: boolean,
    nextStreakValue: number,
    xpReward: number,
    bestAttempts: Record<string, number> = currentProfile.bestAttempts,
  ) {
    const nextRegionStats = { ...currentProfile.regionStats }
    const nextClearedCountryCodes =
      country && isCorrectAnswer && !currentProfile.clearedCountryCodes.includes(country.code)
        ? [...currentProfile.clearedCountryCodes, country.code]
        : currentProfile.clearedCountryCodes

    if (country) {
      const currentRegionStats = nextRegionStats[country.region] ?? { correct: 0, total: 0 }

      nextRegionStats[country.region] = {
        correct: currentRegionStats.correct + (isCorrectAnswer ? 1 : 0),
        total: currentRegionStats.total + 1,
      }
    }

    return {
      ...currentProfile,
      xp: currentProfile.xp + (isCorrectAnswer ? xpReward : 0),
      bestStreak: Math.max(currentProfile.bestStreak, nextStreakValue),
      totalCorrect: currentProfile.totalCorrect + (isCorrectAnswer ? 1 : 0),
      totalGames: currentProfile.totalGames + 1,
      clearedCountryCodes: nextClearedCountryCodes,
      bestAttempts,
      regionStats: nextRegionStats,
    }
  }

  function playTap() {
    if (!audioEnabled || audioVolume <= 0) return

    playClickSound()
  }

  function ensureBackgroundMusic() {
    if (!audioEnabled || audioVolume <= 0 || musicBlockedByResult) return

    primeAudioEngine()
    startMusic()
  }

  function resumeGameTimer(remainingSeconds = timeLeft) {
    if (!question || selectedAnswerCode) return

    armBlitzTimer(Math.max(1, remainingSeconds), setTimeLeft, () => markTimeout(profile))
  }

  function openPauseMenu() {
    playTap()
    clearBlitzTimer()
    setPauseMenuOpen(true)
  }

  function resumePausedGame() {
    playTap()
    setPauseMenuOpen(false)
    resumeGameTimer()
  }

  function changeMapFromPause() {
    playTap()
    clearBlitzTimer()
    setPauseMenuOpen(false)
    setQuestion(null)
    setSelectedAnswerCode(null)
    setLastXpReward(0)
    setCountryFact(null)
    setStreak(0)
    setAttempts(0)
    setScreen('modeSelect')
  }

  function quitGame() {
    backHome()
  }

  function markTimeout(nextProfile = profile) {
    const nextAttempts = attempts + 1

    stopMusic()

    if (audioEnabled) playWrongSound()

    setSelectedAnswerCode(timeoutAnswerCode)
    setStreak(0)
    setAttempts(nextAttempts)
    setLastXpReward(0)
    setCountryFact(null)
    persistProfile(getProfileAfterAnswer(nextProfile, question?.correct ?? null, false, 0, 0))
  }

  function openModes(seconds: BlitzSeconds) {
    playTap()
    ensureBackgroundMusic()
    clearBlitzTimer()
    setBlitzSeconds(seconds)
    setTimeLeft(seconds)
    setAttempts(0)
    setScreen('modeSelect')
  }

  function startGame(nextMode: ModeId) {
    const nextCountries = getCountriesForMode(nextMode)
    const nextQuestion = createQuestion(nextCountries)

    playTap()
    ensureBackgroundMusic()
    setPauseMenuOpen(false)
    setMode(nextMode)
    setRemainingCodes(nextCountries.map((country) => country.code))
    setQuestion(nextQuestion)
    setSelectedAnswerCode(null)
    setLastXpReward(0)
    setCountryFact(null)
    setStreak(0)
    setAttempts(0)
    setScreen('game')
    armBlitzTimer(blitzSeconds, setTimeLeft, () => markTimeout(profile))
  }

  function backHome() {
    playTap()
    clearBlitzTimer()
    setPauseMenuOpen(false)
    setScreen('home')
    setQuestion(null)
    setSelectedAnswerCode(null)
    setLastXpReward(0)
    setCountryFact(null)
    setStreak(0)
    setAttempts(0)
  }

  function openSettings(returnScreen: Screen) {
    playTap()
    if (returnScreen === 'game') {
      clearBlitzTimer()
      setPauseMenuOpen(false)
      setScreen('gameSettings')
      return
    }

    setScreen(returnScreen === 'landing' ? 'landingSettings' : 'settings')
  }

  function closeSettings() {
    if (screen === 'landingSettings') {
      playTap()
      setScreen('landing')
      return
    }

    if (screen === 'gameSettings') {
      playTap()
      setScreen('game')
      resumeGameTimer()
      return
    }

    backHome()
  }

  function chooseAnswer(answerCode: string) {
    if (!question || selectedAnswerCode) return

    clearBlitzTimer()

    const isCorrect = answerCode === question.correct.code
    const nextStreak = isCorrect ? streak + 1 : 0
    const xpReward = getXpReward(mode, nextStreak, blitzSeconds)
    const nextAttempts = attempts + 1
    const answeredInDeck = currentCountries.length - remainingCodes.length
    const deckProgress = Math.min(
      currentCountries.length,
      answeredInDeck + (isCorrect ? 1 : 0),
    )
    const isDeckComplete = isCorrect && deckProgress === currentCountries.length
    const levelKey = getLevelKey(mode, blitzSeconds)
    const currentBestAttempts = profile.bestAttempts[levelKey]
    const bestAttempts =
      isDeckComplete && (!currentBestAttempts || nextAttempts < currentBestAttempts)
        ? { ...profile.bestAttempts, [levelKey]: nextAttempts }
        : profile.bestAttempts

    if (audioEnabled) {
      playClickSound()

      if (isCorrect) {
        if (isDeckComplete) {
          playVictorySound()
        } else {
          playCorrectSound()
        }
      } else {
        stopMusic()
        playWrongSound()
      }
    }

    setSelectedAnswerCode(answerCode)
    setStreak(nextStreak)
    setAttempts(nextAttempts)
    setLastXpReward(isCorrect ? xpReward : 0)
    setCountryFact(isCorrect ? getCountryFact(question.correct, language) : null)
    persistProfile(
      getProfileAfterAnswer(profile, question.correct, isCorrect, nextStreak, xpReward, bestAttempts),
    )
  }

  function nextQuestion() {
    if (!question) return

    playTap()

    const isCorrect = selectedAnswerCode === question.correct.code
    const nextRemainingCodes = isCorrect
      ? remainingCodes.filter((code) => code !== question.correct.code)
      : currentCountries.map((country) => country.code)

    if (isCorrect && nextRemainingCodes.length === 0) {
      setRemainingCodes([])
      clearBlitzTimer()
      return
    }

    const availableCodes =
      nextRemainingCodes.length > 0
        ? nextRemainingCodes
        : currentCountries.map((country) => country.code)
    const availableCountries = currentCountries.filter((country) =>
      availableCodes.includes(country.code),
    )
    const nextRoundQuestion = createQuestion(availableCountries, question.correct.code)

    setRemainingCodes(availableCodes)
    setQuestion(nextRoundQuestion)
    setSelectedAnswerCode(null)
    setLastXpReward(0)
    setCountryFact(null)
    armBlitzTimer(blitzSeconds, setTimeLeft, () => markTimeout(profile))
  }

  function restartGame() {
    const nextCountries = getCountriesForMode(mode)
    const nextQuestion = createQuestion(nextCountries)

    playTap()
    ensureBackgroundMusic()
    clearBlitzTimer()
    setPauseMenuOpen(false)
    setRemainingCodes(nextCountries.map((country) => country.code))
    setQuestion(nextQuestion)
    setSelectedAnswerCode(null)
    setLastXpReward(0)
    setCountryFact(null)
    setStreak(0)
    setAttempts(0)
    armBlitzTimer(blitzSeconds, setTimeLeft, () => markTimeout(profile))
  }

  function toggleAudio() {
    const nextAudioEnabled = !audioEnabled

    setAudioEngineEnabled(nextAudioEnabled)
    setAudioEnabled(nextAudioEnabled)
    localStorage.setItem(audioKey, nextAudioEnabled ? 'on' : 'off')

    if (nextAudioEnabled) {
      if (audioVolume > 0 && !musicBlockedByResult) {
        playClickSound()
        startMusic()
      }
    } else {
      stopMusic()
    }
  }

  function chooseLanguage(nextLanguage: Language) {
    playTap()
    setLanguageMode(nextLanguage)
    localStorage.setItem(languageKey, nextLanguage)
  }

  function changeVolume(nextVolume: number) {
    const safeVolume = Math.max(0, Math.min(1, nextVolume))

    setMusicVolume(safeVolume)
    setAudioVolume(safeVolume)
    localStorage.setItem(audioVolumeKey, String(safeVolume))

    if (audioEnabled && safeVolume > 0 && !musicBlockedByResult) {
      startMusic()
    }
  }

  function saveNickname() {
    const nextNickname = nicknameDraft.trim() || 'Player'

    playTap()
    persistProfile({
      ...profile,
      nickname: nextNickname,
    })
    setNicknameDraft(nextNickname)
  }

  function resetStats() {
    playTap()
    persistProfile(normalizeProfile({ nickname: profile.nickname }))
  }

  function openMainMenu() {
    playTap()
    setScreen('home')
  }

  function openHowToPlay() {
    playTap()
    setScreen('howToPlay')
  }

  const howToSteps = text.howToSteps

  if (screen === 'landing') {
    return (
      <main className="app landing-app" data-theme={theme}>
        <section className="landing-screen">
          <div className="landing-top-actions">
            <button className="landing-icon-button" onClick={() => {
              openSettings('landing')
            }} aria-label={text.settings}>
              <span>⚙</span>
            </button>
          </div>

          <div className="landing-hero">
            <div className="landing-flag" aria-hidden="true">
              <i className="flag-pole" />
              <i className="flag-wave" />
            </div>
            <div className="landing-logo">
              <span>FLAG</span>
              <strong>RUSH</strong>
            </div>
            <p>{text.landingSubtitle}</p>
          </div>

          <div className="landing-world" aria-hidden="true">
            <img className="landing-landmark landmark-liberty" src={americasModeIcon} alt="" />
            <img className="landing-landmark landmark-eiffel" src={europeModeIcon} alt="" />
            <img className="landing-landmark landmark-clock" src={worldModeIcon} alt="" />
            <img className="landing-landmark landmark-colosseum" src={asiaModeIcon} alt="" />
            <div className="landing-globe">
              <i className="continent continent-one" />
              <i className="continent continent-two" />
              <i className="continent continent-three" />
            </div>
            <i className="balloon balloon-left" />
            <i className="balloon balloon-right" />
          </div>

          <div className="landing-actions">
            <button className="landing-play" onClick={openMainMenu}>
              <span>{text.playNow}</span>
              <b aria-hidden="true">→</b>
            </button>
            <button className="landing-how" onClick={openHowToPlay}>
              <span>{text.howToPlay}</span>
              <b aria-hidden="true">?</b>
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'howToPlay') {
    return (
      <main className="app landing-app" data-theme={theme}>
        <section className="landing-screen howto-screen">
          <div className="screen-bar">
            <button className="hud-button" onClick={() => {
              playTap()
              setScreen('landing')
            }}>
              {text.back}
            </button>
          </div>
          <div className="howto-card">
            <p className="eyebrow">Flag Rush</p>
            <h1>{text.howToPlay}</h1>
            <div className="howto-steps">
              {howToSteps.map((step, index) => (
                <div key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
            <button className="landing-play howto-play" onClick={openMainMenu}>
              <span>{text.playNow}</span>
              <b aria-hidden="true">→</b>
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'home') {
    return (
      <main className="app app-home" data-theme={theme}>
        <section className="rush-machine">
          <div className="hud-top">
            <button className="hud-button language-button" onClick={() => {
              playTap()
              setScreen('profile')
            }}>
              <span className="hud-icon">ID</span>
              {text.profile}
            </button>

            <div className="wordmark">
              <span>FLAG</span>
              <strong>RUSH</strong>
              <i className="mini-mark">FR</i>
            </div>

            <div className="hud-actions">
              <button className="hud-button status-button" onClick={() => {
                openSettings('home')
              }}>
                <span className="hud-icon">EQ</span>
                <span>{text.settings}</span>
              </button>
            </div>
          </div>

          <div className="hero-panel">
            <div className="brand-orbit">
              <div className="brand-mark">
                <img src={appIcon} alt="" />
              </div>
            </div>
            <p className="mode-kicker">
              {text.rush}: <strong>{text.seconds(blitzSeconds)}</strong>
            </p>
            <h1>{text.headline}</h1>
          </div>

          <div className="rush-lanes">
            {blitzModes.map((seconds) => (
              <button
                key={seconds}
                className={
                  seconds === blitzSeconds
                    ? `rush-lane lane-${seconds} active`
                    : `rush-lane lane-${seconds}`
                }
                onClick={() => openModes(seconds)}
              >
                <i />
                <span>{text.seconds(seconds)}</span>
                <strong>{text.rush}</strong>
              </button>
            ))}
          </div>

          <div className="league-strip">
            <div className={`rank-medal rank-tier-${rankBadge.tier}`} aria-hidden="true">
              <span>{rankBadge.icon}</span>
            </div>
            <div>
              <span>{text.yourRank}</span>
              <strong>{rank.title}</strong>
            </div>
            <div className="rank-xp">{profile.xp} XP</div>
            <div className="rank-track" aria-hidden="true">
              <div style={{ width: `${rankProgress}%` }} />
            </div>
            <small>
              {nextRank ? text.nextRank(nextRank.title, nextRank.minXp - profile.xp) : text.maxRank}
            </small>
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'profile') {
    return (
      <main className="app" data-theme={theme}>
        <section className="rush-machine mode-screen profile-screen">
          <div className="screen-bar">
            <button className="hud-button" onClick={closeSettings}>
              {text.back}
            </button>
            <div className="timer-chip">{rank.title}</div>
          </div>

          <p className="eyebrow">{text.appName}</p>
          <h1>{text.profile}</h1>

          <div className="nickname-row profile-name-card">
            <label htmlFor="profile-name">{text.nickname}</label>
            <input
              id="profile-name"
              value={nicknameDraft}
              maxLength={18}
              onChange={(event) => setNicknameDraft(event.target.value)}
              placeholder={text.nickname}
            />
            <button onClick={saveNickname}>{text.saveName}</button>
          </div>

          <div className={`profile-hero league-profile rank-tier-${rankBadge.tier}`}>
            <div className={`profile-avatar rank-shield rank-tier-${rankBadge.tier}`}>
              <span>{rankBadge.icon}</span>
              <small>{rankBadge.short}</small>
            </div>
            <div>
              <span>{text.yourRank}</span>
              <strong>{rank.title}</strong>
              <small>{profile.xp} XP</small>
              <div className="league-progress">
                <i>
                  <b style={{ width: `${rankProgress}%` }} />
                </i>
                <em>{nextRank ? text.nextRank(nextRank.title, nextRank.minXp - profile.xp) : text.maxRank}</em>
              </div>
            </div>
          </div>

          <div className="league-details">
            <div>
              <span>{text.mapsPlayed}</span>
              <strong>{clearedMapCount}/6</strong>
            </div>
            <div>
              <span>{text.countriesCleared}</span>
              <strong>
                {countriesClearedCount}/{countries.length}
              </strong>
            </div>
            <div>
              <span>{text.bestScore}</span>
              <strong>{profile.bestStreak}</strong>
            </div>
            <div>
              <span>{text.totalAttempts}</span>
              <strong>{profile.totalGames}</strong>
            </div>
          </div>

          <div className="profile-stats">
            <div>
              <span>{text.best}</span>
              <strong>{profile.bestStreak}</strong>
            </div>
            <div>
              <span>{text.correctTotal}</span>
              <strong>{profile.totalCorrect}</strong>
            </div>
            <div>
              <span>{text.totalAnswers}</span>
              <strong>{profile.totalGames}</strong>
            </div>
            <div>
              <span>{text.hoursPlayed}</span>
              <strong>{text.hours(playedHours)}</strong>
            </div>
          </div>

          <div className="continent-summary">
            <div>
              <span>{text.bestContinent}</span>
              <strong>{bestRegion ? `${bestRegion.label} · ${bestRegion.accuracy}%` : text.noStats}</strong>
            </div>
            <div>
              <span>{text.worstContinent}</span>
              <strong>{worstRegion ? `${worstRegion.label} · ${worstRegion.accuracy}%` : text.noStats}</strong>
            </div>
          </div>

          <div className="continent-list">
            {regionRows.map((item) => (
              <div key={item.id}>
                <span>{item.label}</span>
                <strong>{item.total ? `${item.accuracy}%` : '0%'}</strong>
                <small>
                  {item.correct}/{item.total}
                </small>
                <i style={{ width: `${item.accuracy}%` }} />
              </div>
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'settings' || screen === 'landingSettings' || screen === 'gameSettings') {
    return (
      <main className="app" data-theme={theme}>
        <section className="rush-machine mode-screen settings-screen">
          <div className="screen-bar">
            <button className="hud-button" onClick={closeSettings}>
              {text.back}
            </button>
          </div>

          <p className="eyebrow">{text.appName}</p>
          <h1>{text.settings}</h1>

          <div className="settings-list">
            <div className="setting-card">
              <div>
                <span>{text.soundSetting}</span>
                <strong>{audioEnabled ? text.soundOn : text.soundOff}</strong>
              </div>
              <button className="setting-action" onClick={toggleAudio}>
                {audioEnabled ? text.onLabel : text.offLabel}
              </button>
            </div>

            <div className="setting-card volume-card">
              <div>
                <span>{text.volume}</span>
                <strong>{Math.round(audioVolume * 100)}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(audioVolume * 100)}
                onChange={(event) => changeVolume(Number(event.target.value) / 100)}
                onInput={(event) => changeVolume(Number(event.currentTarget.value) / 100)}
              />
            </div>

            <div className="setting-card setting-stack">
              <div className="segmented language-segmented">
                {languageOptions.map((item) => (
                  <button
                    key={item}
                    className={languageMode === item ? 'active' : ''}
                    onClick={() => chooseLanguage(item)}
                  >
                    {getLanguageOptionLabel(item)}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-card setting-stack">
              <div>
                <span>{text.themeSetting}</span>
                <strong>{theme === 'dark' ? text.themeDark : text.themeLight}</strong>
              </div>
              <div className="segmented">
                <button className={theme === 'dark' ? 'active' : ''} onClick={() => {
                  playTap()
                  setTheme('dark')
                  localStorage.setItem(themeKey, 'dark')
                }}>
                  {text.themeDark}
                </button>
                <button className={theme === 'light' ? 'active' : ''} onClick={() => {
                  playTap()
                  setTheme('light')
                  localStorage.setItem(themeKey, 'light')
                }}>
                  {text.themeLight}
                </button>
              </div>
            </div>

            <button className="danger-action" onClick={resetStats}>
              {text.resetStats}
            </button>

            <small className="settings-note">{text.dataNote}</small>
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'modeSelect') {
    const countriesLabel = text.countriesLabel

    return (
      <main className="app mode-picker-app" data-theme={theme}>
        <section className="rush-machine mode-screen mode-picker-screen">
          <div className="screen-bar">
            <button className="hud-button" onClick={backHome}>
              {text.back}
            </button>
            <h1>{text.chooseMode}</h1>
            <div className="timer-chip">{text.seconds(blitzSeconds)}</div>
          </div>

          <p className="eyebrow">{text.appName}</p>

          <div className="mode-grid">
            {modes.map((item) => (
              <button
                key={item.id}
                className={
                  item.id === 'world'
                    ? 'mode-card hard-card mode-world'
                    : `mode-card mode-${item.id.toLowerCase()}`
                }
                onClick={() => startGame(item.id)}
              >
                <ModeMap mode={item.id} />
                <ModeScene mode={item.id} />
                <span className="mode-card-title">
                  {item.label}
                </span>
                <em>{item.description}</em>
                <strong>
                  <i className="country-count">{item.count}</i>
                  <span>{countriesLabel}</span>
                </strong>
                <small>
                  {item.bestAttempts
                    ? text.bestAttempts(item.bestAttempts)
                    : text.noBestAttempts}
                </small>
                <b className="mode-arrow" aria-hidden="true">&rsaquo;</b>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (!question) return null

  const activeQuestion = question
  const activeMode = modes.find((item) => item.id === mode)
  const isAnswered = selectedAnswerCode !== null
  const isCorrect = selectedAnswerCode === activeQuestion.correct.code
  const isTimeout = selectedAnswerCode === timeoutAnswerCode
  const answeredInDeck = currentCountries.length - remainingCodes.length
  const deckProgress = Math.min(
    currentCountries.length,
    answeredInDeck + (isAnswered && isCorrect ? 1 : 0),
  )
  const deckPercent = (deckProgress / currentCountries.length) * 100
  const timePercent = Math.max(0, Math.min(100, (timeLeft / blitzSeconds) * 100))
  const isDeckComplete =
    isAnswered && isCorrect && deckProgress === currentCountries.length
  const finishFlagStyle = isDeckComplete
    ? ({
        '--finish-flag': `url(https://flagcdn.com/w640/${activeQuestion.correct.code}.png)`,
      } as CSSProperties)
    : undefined
  const activeLevelKey = getLevelKey(mode, blitzSeconds)
  const bestAttemptsForLevel = profile.bestAttempts[activeLevelKey] ?? attempts
  const completionAccuracy = attempts > 0 ? Math.round((currentCountries.length / attempts) * 100) : 100
  const completionJoke = text.finishJoke(activeMode?.label ?? text.appName, mode === 'world')

  return (
    <main className="app game-app" data-theme={theme}>
      <section className={isAnswered ? 'rush-machine game-screen game-screen-answered' : 'rush-machine game-screen'}>
        <header className="game-header">
          <div>
            <p className="eyebrow">{activeMode?.label ?? text.appName}</p>
            <h1>{text.guessFlag}</h1>
          </div>

          <div className="header-actions">
            <div className="streak-badge">{getStreakTitle(streak, language)}</div>
            <button className="change-mode" onClick={openPauseMenu}>
              {text.menu}
            </button>
          </div>
        </header>

        <div
          className="flag-stage"
          style={{ '--flag-ratio': activeFlagRatio } as CSSProperties}
        >
          <img
            className="flag-image"
            src={`https://flagcdn.com/w640/${activeQuestion.correct.code}.png`}
            alt={activeQuestion.correct.name[language]}
            onLoad={(event) => {
              const image = event.currentTarget
              const ratio = image.naturalWidth / image.naturalHeight

              if (Number.isFinite(ratio) && ratio > 0) {
                setFlagMetrics({
                  code: activeQuestion.correct.code,
                  ratio: Number(ratio.toFixed(3)),
                })
              }
            }}
          />
        </div>

        {!isAnswered && (
          <div className="answers">
            {activeQuestion.options.map((country, index) => (
              <button
                key={country.code}
                className="answer-key"
                onClick={() => chooseAnswer(country.code)}
              >
                <span>{index + 1}</span>
                <strong>{country.name[language]}</strong>
              </button>
            ))}
          </div>
        )}

        {pauseMenuOpen && !isAnswered && (
          <div className="pause-overlay">
            <div className="pause-menu">
              <p className="eyebrow">{text.seconds(blitzSeconds)}</p>
              <h2>{text.menu}</h2>
              <button className="pause-action resume-action" onClick={resumePausedGame}>
                <span>▶</span>
                {text.resumeGame}
              </button>
              <button className="pause-action restart-action" onClick={restartGame}>
                <span>↻</span>
                {text.restart}
              </button>
              <button className="pause-action map-action" onClick={changeMapFromPause}>
                <span>⌘</span>
                {text.changeMap}
              </button>
              <button className="pause-action settings-action" onClick={() => openSettings('game')}>
                <span>⚙</span>
                {text.settings}
              </button>
              <button className="pause-action quit-action" onClick={quitGame}>
                <span>⇥</span>
                {text.quitGame}
              </button>
            </div>
          </div>
        )}

        {isAnswered && (
          <div
            className={
              isCorrect
                ? isDeckComplete
                  ? `result correct-result complete-result result-region-${activeQuestion.correct.region.toLowerCase()}`
                  : `result correct-result reward-result result-region-${activeQuestion.correct.region.toLowerCase()}`
                : 'result wrong-result'
            }
            style={finishFlagStyle}
          >
            {isCorrect ? (
              isDeckComplete ? (
                <div className="finish-card">
                  <div className="finish-trophy" aria-hidden="true">
                    <span>★</span>
                  </div>
                  <p className="finish-kicker">{text.finishLine}</p>
                  <h2>{text.gameFinished}</h2>
                  <strong className="finish-joke">{completionJoke}</strong>

                  <div className="finish-stats">
                    <div>
                      <span>{text.score}</span>
                      <strong>{currentCountries.length}</strong>
                    </div>
                    <div>
                      <span>{text.best}</span>
                      <strong>{bestAttemptsForLevel}</strong>
                    </div>
                    <div>
                      <span>{text.combo}</span>
                      <strong>{streak}</strong>
                    </div>
                  </div>

                  <div className="finish-accuracy">
                    <span>{text.accuracy}</span>
                    <strong>{completionAccuracy}%</strong>
                    <i>
                      <b style={{ width: `${Math.min(100, completionAccuracy)}%` }} />
                    </i>
                  </div>

                  <div className="completion-actions">
                    <button onClick={restartGame}>{text.playAgain}</button>
                    <button onClick={backHome}>{text.home}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="reward-burst" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="reward-check" aria-hidden="true">✓</div>
                  <h2>{text.correctTitle}</h2>
                  <div className="reward-country">
                    <img
                      src={`https://flagcdn.com/w80/${activeQuestion.correct.code}.png`}
                      alt=""
                    />
                    <strong>{activeQuestion.correct.name[language]}</strong>
                  </div>
                  <div className="reward-combo">
                    +{lastXpReward} XP · +{Math.max(1, streak)} {text.comboLabel}
                  </div>
                  {countryFact && (
                    <div className="fact-card reward-fact">
                      <span>{text.countryFact}</span>
                      <strong>{countryFact}</strong>
                    </div>
                  )}
                  <button className="reward-next" onClick={nextQuestion}>
                    <span>{text.nextFlag}</span>
                    <b aria-hidden="true">→</b>
                  </button>
                </>
              )
            ) : (
              <div className="loss-menu">
                <small>
                  {isTimeout
                    ? text.timeout(activeQuestion.correct.name[language])
                    : text.wrong(activeQuestion.correct.name[language])}
                </small>
                <strong>{text.restartPrompt}</strong>
                <div>
                  <button onClick={restartGame}>{text.yes}</button>
                  <button onClick={backHome}>{text.exit}</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="timer-console">
          <div>
            <span>{text.timerLabel}</span>
            <strong>{Math.ceil(timeLeft)}</strong>
          </div>
          <div className="time-track" aria-hidden="true">
            <div style={{ width: `${timePercent}%` }} />
          </div>
        </div>

        <div className="stats">
          <div>
            <span>{text.comboLabel}</span>
            <strong>{streak}</strong>
          </div>

          <div>
            <span>{text.rank}</span>
            <strong>{rank.title}</strong>
          </div>

          <div>
            <span>{text.attempts}</span>
            <strong>{attempts}</strong>
          </div>
        </div>

        <div className="attempt-strip">
          <span>{text.progress}</span>
          <strong>
            {deckProgress}/{currentCountries.length}
          </strong>
        </div>

        <div className="progress-track" aria-hidden="true">
          <div style={{ width: `${deckPercent}%` }} />
        </div>
      </section>
    </main>
  )
}

export default App
