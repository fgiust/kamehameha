const it = {
  common: {
    home: 'Home',
    back: 'Indietro',
    contact: 'Contatto',
    disclaimer: 'Disclaimer',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Termini di servizio',
    feedback: 'Feedback',
    loading: '...',
    or: 'o',
    soon: 'Presto',
    contentComingSoon: 'Contenuti in arrivo...',
    toggleDarkMode: 'Attiva/disattiva modalità scura',
    language: 'Lingua',
    english: 'Inglese',
    italian: 'Italiano',
    translation: 'Traduzione',
    switchLanguage: 'Cambia lingua',
    debugModeActive: 'Debug',
    debugModeHint: 'Modalità debug attiva (?debug=42). Prompt alternativi visibili negli esercizi sentence.',
    debugPanelTitle: 'Debug panel',
    debugPanelShow: 'Apri debug panel',
    debugPanelHide: 'Chiudi debug panel',
    previousAnswers: 'Risposte precedenti',
    forms: 'Forme:',
    kanji: 'Kanji',
    furigana: 'Furigana ⇧',
    type: 'Tipo',
    reverseQA: 'Inverte D/R',
    randomize: 'casuale',
  },
  settings: {
    options: 'Opzioni',
    language: 'Lingua',
    theme: 'Tema',
    themeDark: 'Modalità scura',
    themeLight: 'Modalità chiara',
    syncDebugSection: 'Sync debug',
    syncDebugEnabled: 'Sync cloud',
    syncDebugEnabledOn: 'attiva',
    syncDebugEnabledOff: 'disattivata',
    syncDebugConnection: 'Connessione',
    syncDebugOnline: 'online',
    syncDebugOffline: 'offline',
    syncDebugPhase: 'Stato sync',
    syncDebugPending: 'Coda pending',
    syncDebugInflight: 'Upload in corso',
    syncDebugRemote: 'Record cloud',
    syncDebugImported: 'Import da locale',
    syncDebugUploadedNewer: 'Upload locali piu recenti',
    syncDebugLastPush: 'Ultimo push',
    syncDebugLastBootstrap: 'Ultimo riallineamento',
    syncDebugPhaseValues: {
      idle: 'idle',
      syncing: 'sincronizzazione',
      ready: 'ok',
      offline: 'in attesa di rete',
      error: 'errore',
    },
    speechSection: 'Speech (sperimentale)',
    speechEnabled: 'Leggi le frasi ad alta voce',
    speechUseKanji: 'Usa kanji nella lettura',
    speechEnabledHint:
      'Legge prompt e risposta con la sintesi vocale del sistema. Qualità e voci disponibili variano in base a browser e dispositivo.',
    speechUseKanjiHint:
      'Pronuncia le risposte leggendo la versione in kanji anziché in kana. Può migliorare l’accento tonico ma usare letture diverse da quella mostrata. Se disattivato, usa la traslitterazione in kana, più fedele all’esercizio ma senza contrasto di accenti. Disabilitala solo nel caso in cui sul tuo dispositivo noti frequentemente pronunce errate.',
    speechTestLink: 'Test audio',
  },
  auth: {
    account: 'Account',
    accountSection: 'Account',
    loginSection: 'Login',
    signIn: 'Login',
    signOut: 'Logout',
    continueWithGoogle: 'Continua con Google',
    syncDescription: 'Accedi per sincronizzare i tuoi progressi tra diversi dispositivi.',
    notConfigured: 'Autenticazione non ancora configurata.',
    genericError: 'Errore di autenticazione',
    callbackLoading: 'Completamento login...',
    callbackLoadingBody: 'Un attimo, sto collegando la tua sessione Google.',
    callbackErrorTitle: 'Login Google non riuscito',
    callbackMissingCode: 'Manca il codice di autorizzazione nell’URL di callback.',
  },
  speechTest: {
    title: 'Test audio',
    intro:
      'Con queste frasi di esempio puoi verificare la qualità della sintesi vocale sul tuo dispositivo. Confronta i pulsanti kanji e kana e fai attenzione agli accenti tonali nelle coppie di omografi (es. 雨 vs 飴). Poi decidi se conviene abilitare «Usa kanji nella lettura» nelle impostazioni.',
    speakKanji: 'Leggi con kanji',
    speakKana: 'Leggi con kana',
  },
  sentenceExercise: {
    promptTranslate: 'Traduci in giapponese:',
    editData: 'Modifica',
  },
  sentenceEdit: {
    title: 'Modifica dati esercizio',
    answer: 'Risposta (template)',
    fileHint: '{{file}} - esercizio {{index}}',
    save: 'Salva nel file',
    saving: 'Salvataggio…',
    cancel: 'Annulla',
    saveError: 'Impossibile salvare le modifiche',
    validation: {
      'unclosed-brace': 'Parentesi graffa { non chiusa',
      'unclosed-bracket': 'Parentesi quadra [ non chiusa',
      'nested-brace': 'Parentesi graffe { annidate non consentite',
      'nested-bracket': 'Parentesi quadre [ annidate non consentite',
      'brace-inside-bracket': 'Parentesi graffe dentro [ ] non consentite',
      'single-alternative': 'Ogni gruppo {…} deve contenere almeno un separatore |',
      'missing-furigana': '{{message}}',
      'invalid-ruby': '{{message}}',
    },
  },
  readingExercise: {
    prompt: 'Scrivi la lettura in hiragana',
  },
  exerciseCompleted: {
    title: 'Ce l’hai fatta!',
    subtitle: 'KAMEHAMEHA: CARICA COMPLETA',
    body1: 'Missione compiuta: hai distrutto questo esercizio.',
    body2: 'Ma non rilassarti - torna alla lista e inizia subito una nuova missione!',
    cta: '← Torna alla lista',
  },
  home: {
    genkitext: 'Esercizi di grammatica organizzati per argomenti delle lezioni del Genki.\nQuesta app non riproduce alcun contenuto protetto da copyright dei libri di testo, gli esercizi sono originali e sono semplicemente organizzati seguendo lo stesso ordine delle lezioni per fornire una pratica supplementare ben strutturata per gli studenti di Genki.',
    taglineLead: 'Carica la tua かめはめ波 e distruggi le barriere con il giapponese!',
    taglineBody: 'Allenamento interattivo per grammatica, vocabolario e kanji. Carica, spara, sali di livello. Nessuna pietà.',
    sections: {
      verbConjugation: 'Coniugazione verbi',
      adjectiveConjugation: 'Coniugazione aggettivi',
      other: 'Di tutto un po\'',
      genkiSupplementary: 'Esercizi supplementari Genki',
    },
    exercises: {
      counters: 'Contatori',
      numbers: 'Numeri',
      time: 'Orario',
    },
    genkiOverrides: {
      verbConjugation: 'Coniugazione verbi',
      pastTenseVerbs: 'Passato dei verbi',
      counting: 'Contare',
      teForm: 'Te-form',
      pastShortFormsVerbs: 'Forme brevi al passato (verbi)',
      pastShortFormsAdjectives: 'Forme brevi al passato (aggettivi)',
      adjectiveNaru: 'Forma なる (aggettivi)',
      potentialVerbs: 'Verbi potenziali',
    },
  },
  genkiLessonPage: {
    notFoundTitle: 'Lezione non trovata: {{id}}',
    notFoundBody: 'Questa lezione non è stata ancora implementata.',
  },
  contact: {
    intro: 'Suggerimenti, complimenti o lamentele? Scrivimi pure, mi fa piacere sentirti.',
    name: 'Nome',
    email: 'Email',
    message: 'Messaggio',
    send: 'Invia',
    sending: 'Invio in corso...',
    sent: 'Messaggio inviato',
    failed: 'Invio fallito',
  },
  disclaimer: {
    p1: 'Questa app è stata ispirata dall’eccellente lavoro di Steven Kraft (',
    p1b: '), con l’obiettivo di offrire una serie di esercizi più aggiornata e interattiva per chi studia.',
    p2: 'Tutti gli esercizi inclusi in questa app sono originali e non riproducono materiale protetto da copyright. Anche se gli esercizi sono organizzati seguendo la struttura dei libri Genki per comodità, sono creati in modo indipendente e non derivano né sono copiati dai libri o dai workbook Genki.',
    p3: 'Nota: essendo un progetto indipendente creato da un altro studente, i contenuti possono contenere occasionalmente errori o imprecisioni. Il feedback è molto apprezzato: puoi segnalare errori o suggerire miglioramenti usando gli strumenti di feedback disponibili nelle pagine degli esercizi.',
  },
  legal: {
    effectiveDate: 'Data di efficacia',
  },
  privacyPolicy: {
    effectiveDateValue: '29 giugno 2026',
    introTitle: 'Panoramica',
    introP1:
      'Questa Privacy Policy spiega come kamehameha! raccoglie, utilizza e conserva le informazioni quando usi l’applicazione.',
    introP2:
      'L’app è pensata per esercitarsi con il giapponese. La maggior parte dei contenuti può essere usata senza account, mentre il login opzionale serve ad abilitare la sincronizzazione cloud dei progressi tra diversi dispositivi.',
    dataTitle: 'Informazioni raccolte',
    dataP1:
      'Se effettui l’accesso con Google, l’app può ricevere da Google e da Supabase Authentication informazioni base dell’account come nome, indirizzo email e immagine del profilo.',
    dataP2:
      'L’app può inoltre salvare i dati di progresso degli esercizi, come lo stato di completamento delle barre, e le informazioni tecniche strettamente necessarie per far funzionare autenticazione, sincronizzazione, analytics o strumenti di feedback.',
    useTitle: 'Come vengono usate le informazioni',
    useP1:
      'Le informazioni vengono usate per autenticare l’account, mantenere sincronizzati i progressi tra dispositivi, fornire le funzionalità principali dell’app e garantire sicurezza e affidabilità del servizio.',
    useP2:
      'Le informazioni possono anche essere utilizzate in forma aggregata per capire come viene usata l’app e migliorare l’esperienza di studio, la qualità dei contenuti e la stabilità tecnica.',
    sharingTitle: 'Servizi usati e condivisione dati',
    sharingP1:
      'L’app si appoggia a fornitori terzi di infrastruttura come Supabase per autenticazione e database, Google per il login, e Vercel per hosting e distribuzione.',
    sharingP2:
      'I dati personali non vengono venduti. Le informazioni vengono condivise con i fornitori di servizio solo quando necessario per far funzionare l’applicazione e le sue funzionalità principali.',
    retentionTitle: 'Conservazione e scelte dell’utente',
    retentionP1:
      'I progressi salvati localmente restano sul tuo dispositivo finché non cancelli i dati del browser. I progressi sincronizzati nel cloud vengono conservati per il tempo necessario a fornire le funzionalità legate all’account.',
    retentionP2:
      'Puoi smettere di usare l’app in qualsiasi momento. Se vuoi richiedere la rimozione dei dati legati all’account, puoi contattare il gestore del progetto tramite i riferimenti o il canale di supporto indicati nel progetto.',
    childrenTitle: 'Minori',
    childrenP1:
      'L’app non è intenzionalmente rivolta a minori che, secondo la normativa applicabile, non abbiano l’età sufficiente per acconsentire autonomamente ai servizi online.',
    changesTitle: 'Modifiche a questa policy',
    changesP1:
      'Questa policy può essere aggiornata nel tempo. Continuando a usare l’app dopo una modifica accetti la versione aggiornata della policy.',
  },
  termsOfService: {
    effectiveDateValue: '29 giugno 2026',
    acceptanceTitle: 'Accettazione dei termini',
    acceptanceP1:
      'Accedendo o usando kamehameha! accetti questi Termini di servizio. Se non sei d’accordo, non usare l’applicazione.',
    acceptanceP2:
      'Questi termini si applicano sia se usi l’app come ospite, sia se usi un account autenticato opzionale.',
    useTitle: 'Uso consentito',
    useP1:
      'L’app è fornita per uso personale ed educativo, in relazione alla pratica della lingua giapponese. Ti impegni a non abusare del servizio, a non interferire con il suo normale funzionamento e a non tentare di accedere a dati che non ti appartengono.',
    useP2:
      'Ti impegni inoltre a non usare l’app per attività illecite, abusive o distruttive, inclusi tentativi di reverse engineering, scraping o sovraccarico del servizio oltre un uso personale ragionevole.',
    accountTitle: 'Account',
    accountP1:
      'Se scegli di effettuare il login, sei responsabile dell’uso lecito del tuo account e delle attività eseguite tramite la tua sessione autenticata sui tuoi dispositivi.',
    accountP2:
      'Il gestore dell’app può sospendere o limitare l’accesso alle funzionalità autenticate in caso di abuso, uso improprio o problemi di sicurezza.',
    contentTitle: 'Contenuti e proprietà intellettuale',
    contentP1:
      'Salvo diversa indicazione, interfaccia dell’applicazione, esercizi originali, codice e materiali correlati sono forniti dal proprietario del progetto o dai rispettivi licenzianti.',
    contentP2:
      'Questa app è un progetto di studio indipendente e non è affiliata né approvata da editori di libri di testo o altri terzi, salvo indicazione esplicita.',
    availabilityTitle: 'Disponibilità e modifiche del servizio',
    availabilityP1:
      'L’app è fornita “così com’è” e “secondo disponibilità”. Le funzionalità possono cambiare, essere migliorate, rimosse o diventare temporaneamente non disponibili senza preavviso.',
    availabilityP2:
      'Il proprietario può aggiornare in qualsiasi momento l’applicazione, i metodi di autenticazione, il modello di storage o i contenuti degli esercizi per mantenere o migliorare il servizio.',
    liabilityTitle: 'Esclusione di garanzie e responsabilità',
    liabilityP1:
      'Viene fatto uno sforzo ragionevole per mantenere l’app utile e accurata, ma non viene garantito che il servizio sia sempre ininterrotto, privo di errori o perfettamente accurato.',
    liabilityP2:
      'Nei limiti massimi consentiti dalla legge, il proprietario dell’app non è responsabile per danni indiretti o consequenziali derivanti dall’uso o dall’impossibilità di usare l’applicazione.',
    changesTitle: 'Modifiche ai termini',
    changesP1:
      'Questi Termini di servizio possono essere aggiornati nel tempo. Continuando a usare l’app dopo l’entrata in vigore delle modifiche accetti i termini aggiornati.',
  },
  answerTemplatePreview: {
    label: 'Anteprima risposta',
  },
  diffTest: {
    title: 'TenshinDiff test',
    correctAnswer: 'Risposta corretta:',
    userInput: 'Input utente:',
    heading: 'TenshinDiff - Analisi del Terzo Occhio',
    body1: 'TenshinDiff è un componente di diff specializzato nel matching di frasi giapponesi. Supporta sia rappresentazioni in kanji che in kana, oltre a grafie alternative per parti della frase.',
    body2: 'La frase target può definire le letture dei kanji con le parentesi quadre e specificare alternative usando parentesi graffe con opzioni separate da |. Per esempio:',
  },
  pages: {
    numbers: { title: 'Numeri' },
    time: { title: 'Orario' },
    days: { title: 'Giorni del mese' },
    counters: { title: 'Contatori' },
    countersPeople: { title: 'Contare persone' },
    randomizeVerb: { title: 'Forme verbali casuali' },
    randomizeAdj: { title: 'Forme aggettivali casuali' },
    countingThings: { title: 'Contare oggetti' },
    transitive: { title: 'Coppie transitivo / intransitivo' },
    familyNames: { title: 'Cognomi comuni' },
    adjectivesNouns: { title: 'Aggettivi + nomi' },
  },
  forms: {
    te: 'Forma て',
    causative: 'Forma causativa',
    conditional: 'Forma condizionale',
    imperative: 'Forma imperativa',
    negative: 'Forma negativa',
    passive: 'Forma passiva',
    past: 'Forma passata',
    polite: 'Forma cortese',
    short: 'Forme brevi',
    potential: 'Forma potenziale',
    provisional: 'Forma provvisoria',
    volitional: 'Forma volitiva',
    randomized: 'Forme casuali',
    naru: 'Forma なる',
  },
  formsShort: {
    te: 'て',
    causative: 'Causativa',
    conditional: 'Condizionale',
    imperative: 'Imperativa',
    negative: 'Negativa',
    passive: 'Passiva',
    past: 'Passata',
    polite: 'Cortese',
    potential: 'Potenziale',
    provisional: 'Provvisoria',
    volitional: 'Volitiva',
    naru: 'なる',
  },
  genki: {
    lessonTitle: '{{book}} - Lezione {{lesson}}',
  },
  numbers: {
    reverseLabel: 'Hiragana⇄Numero',
    digits: 'Cifre: {{count}}',
    modeHiraToNum: 'Hiragana → Numero',
    modeNumToHira: 'Numero → Hiragana',
    feedbackSection: '{{title}} ({{digits}} cifre, Modalità: {{mode}})',
  },
  randomizeVerb: {
    feedbackSection: '{{form}} ({{hint}})',
  },
  randomizeAdj: {
    feedbackSection: 'Aggettivi {{form}} ({{hint}})',
  },
  conjugationHint: {
    template: 'forma {{parts}}',
    plain: 'piana',
    negative: 'negativa',
    polite: 'cortese',
    opts: {
      short: 'breve',
      passive: 'passiva',
    },
  },
  conjugation: {
    randomizeAriaLabel: 'Forme casuali a ogni domanda',
    randomizeTitle: 'Forme casuali a ogni domanda',
    randomizeActiveLabel: 'casuale ad ogni domanda',
  },
  counters: {
    selectAll: 'Seleziona tutto',
    selectNone: 'Deseleziona tutto',
    feedbackQuestion: '{{question}} (significato: {{meaning}})',
  },
  familyNames: {
    hint: 'Scrivi la lettura in hiragana',
  },
  transitive: {
    transitive: 'Transitivo',
    intransitive: 'Intransitivo',
    hintTransitive: 'Forma transitiva',
    hintIntransitive: 'Forma intransitiva',
    transitiveOf: 'Transitivo di: {{verb}}',
    intransitiveOf: 'Intransitivo di: {{verb}}',
    feedbackQuestion: '{{verb}} ({{meaning}}) - Modalità: chiedi {{ask}}',
    feedbackCorrectAnswer: '{{kana}} ({{kanji}}) - {{meaning}}',
  },
  errors: {
    exerciseNotFound: 'Esercizio non trovato: {{id}}',
  },
  feedbackPanel: {
    tabTitle: 'Invia feedback sull’esercizio',
    heading: 'Feedback esercizio',
    section: 'Sezione',
    sectionPlaceholder: 'es. Giorni del mese',
    question: 'Domanda',
    altLangEnglish: 'Inglese:',
    altLangItalian: 'Italiano:',
    questionPlaceholder: 'Il prompt/kanji attivo',
    correctAnswer: 'Risposta corretta',
    correctAnswerPlaceholder: 'La risposta corretta attesa',
    yourAnswer: 'La tua risposta (opzionale)',
    yourAnswerPlaceholder: 'Cosa hai inserito',
    notes: 'Note / Descrizione problema',
    notesPlaceholder: 'Descrivi il problema, alternativa mancante, refuso, ecc. nel modo più dettagliato possibile...',
    saving: 'Salvataggio...',
    save: 'Salva feedback',
    saved: 'Feedback salvato!',
    failed: 'Impossibile salvare il feedback.',
    networkError: 'Errore di comunicazione con il server di sviluppo.',
  },
  verb: {
    typeLabels: {
      u: 'Verbo う (Godan)',
      ru: 'Verbo る (Ichidan)',
      irr: 'Verbo irregolare',
    },
  },
  adjective: {
    typeLabels: {
      i: 'Aggettivo い',
      na: 'Aggettivo な',
    },
  },
  keyboardTip: {
    japanese: 'suggerimento: passa alla tastiera giapponese per l\'inserimento dei kanji',
    latin: 'suggerimento: usa la tastiera latina per l\'inserimento in hiragana senza conversione kanji',
  },
  seo: {
    homeTitle: '亀 kamehameha! - Esercizi di grammatica giapponese',
    homeDescription:
      'Esercizi gratuiti di grammatica giapponese: frasi in stile Genki, coniugazione di verbi e aggettivi, contatori e altro. Esercizi supplementari originali per studenti di Genki.',
    genkiExerciseTitle: '亀 kamehameha! · {{topic}} · Esercizio Genki lezione {{lesson}}',
    genkiExerciseDescription:
      'Esercizi di traduzione in giapponese su {{topic}} (Genki lezione {{lesson}}, esercizio {{exercise}}). Esercizi supplementari originali per studenti di Genki.',
    sentenceExerciseTitle: '亀 kamehameha! · {{topic}} · Esercizio di frasi giapponesi',
    sentenceExerciseDescription:
      'Esercizi di traduzione in giapponese: {{topic}}. Esercizi interattivi con feedback immediato per studenti di livello intermedio.',
    conjugationTitle: '亀 kamehameha! · {{form}} · Esercizio coniugazione verbale',
    conjugationDescription:
      'Esercizi online di coniugazione verbale giapponese: {{form}}. Verbi godan, ichidan e irregolari con feedback immediato - allenamento gratuito in stile Genki.',
    adjectiveConjugationTitle: '亀 kamehameha! · {{form}} · Esercizio coniugazione aggettivi',
    adjectiveConjugationDescription:
      'Esercizi online di coniugazione degli aggettivi giapponesi: {{form}}. Aggettivi い e な con feedback immediato.',
    exerciseTitle: '亀 kamehameha! · {{name}} · Esercizi di giapponese',
    exerciseDescription:
      'Esercizi di {{name}} in giapponese con drill interattivi e feedback immediato. Allenamento grammaticale gratuito su kamehameha!',
    disclaimerTitle: '亀 kamehameha! · Disclaimer',
    disclaimerDescription:
      'Disclaimer di kamehameha! - app indipendente di grammatica giapponese con esercizi originali allineati al Genki.',
    privacyPolicyTitle: '亀 kamehameha! · Privacy Policy',
    privacyPolicyDescription:
      'Privacy Policy di kamehameha! - informazioni su autenticazione, sincronizzazione cloud dei progressi e gestione dei dati nell’app.',
    termsOfServiceTitle: '亀 kamehameha! · Termini di servizio',
    termsOfServiceDescription:
      'Termini di servizio di kamehameha! - regole, uso consentito ed esclusioni di responsabilità per questa app di studio del giapponese.',
    contactTitle: '亀 kamehameha! · Contatti',
    contactDescription:
      'Contatta il creatore di kamehameha! - suggerimenti, feedback e domande su questa app di grammatica giapponese.',
    notFoundTitle: '亀 kamehameha! · Pagina non trovata',
    notFoundDescription: 'La pagina richiesta non è stata trovata su kamehameha! esercizi di grammatica giapponese.',
  },
};

export default it;
