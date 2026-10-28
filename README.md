# Respiro

App mobile per allenamento all'apnea a secco (tabelle CO2 e O2), pranayama e meditazioni guidate in italiano con voce narrante.
Gratuita e open source (licenza MIT). Funziona nel browser, si installa sul telefono come app (PWA) anche senza connessione, ed esiste in versione Android (APK).

> **Sicurezza.** L'apnea si pratica solo a secco, seduti o sdraiati, mai in acqua, alla guida o dopo iperventilazione. Kapalabhati e Bhastrika sono respirazioni forzate, da evitare o da fare solo con parere medico in gravidanza e con problemi cardiovascolari, di pressione, epilessia o asma. Respiro non è un dispositivo medico.

## Cosa contiene

- **Test del massimo** per misurare il personal best (PB). Il PB cambia solo se lo confermi.
- **Tabelle CO2 e O2** calcolate sul PB, con parametri modificabili e avviso oltre l'85% del PB.
- **Sessione di apnea** con fasi, segnali sonori e di vibrazione, pulsante "Respira" sempre visibile, pausa, riepilogo con sforzo percepito.
- **Pranayama**: respirazione coerente, diaframmatica, box breathing, 4-7-8, Anulom Vilom, Bhramari, Ujjayi, Kapalabhati e Bhastrika, con fasi modificabili e preset personali.
- **40 meditazioni guidate in italiano** (20 brevi da 2-5 minuti, 10 da circa 10 minuti, 10 da circa 20 minuti), lette da una voce italiana, con filtri per categoria e durata, scelta della voce, velocità e sottotitoli.
- **Timer di meditazione** da 5 a 60 minuti con campane.
- **Storico** con grafico del PB e delle sessioni per settimana; **Impostazioni** con esportazione e cancellazione dei dati.

I dati restano sul dispositivo (localStorage). Nessun account, nessun server, nessuna analisi di utilizzo.

## Provarla sul tuo computer

Serve [Node.js](https://nodejs.org) 20 o successivo.

```bash
npm install
npm run dev
```

Apri l'indirizzo mostrato nel terminale (di solito http://localhost:5173). Per provarla dal telefono, collega telefono e computer alla stessa rete Wi-Fi e usa `npm run dev -- --host`.

Altri comandi:

```bash
npm test          # test automatici (tabelle, meditazioni, SSML)
npm run typecheck # controllo dei tipi
npm run build     # versione di produzione nella cartella dist
npm run preview   # prova la versione di produzione
```

## Pubblicarla gratis su GitHub Pages

Il progetto include già il workflow che compila e pubblica l'app a ogni modifica.

1. Crea un account su [github.com](https://github.com) e un nuovo repository **pubblico**, per esempio `respiro` (senza README, senza .gitignore).
2. Dalla cartella del progetto:

   ```bash
   git init -b main
   git add .
   git commit -m "Prima versione di Respiro"
   git remote add origin https://github.com/TUO-UTENTE/respiro.git
   git push -u origin main
   ```

   In alternativa carica i file dal sito di GitHub (Add file, Upload files). Controlla che la cartella nascosta `.github` sia inclusa, altrimenti la pubblicazione automatica non parte.
3. Nel repository apri **Settings, Pages** e in **Source** scegli **GitHub Actions**.
4. Apri la scheda **Actions**: il workflow "Pubblica su GitHub Pages" parte da solo. Se non è partito, avvialo con "Run workflow". Dopo circa un minuto l'app è online su:

   `https://TUO-UTENTE.github.io/respiro/`

Il workflow usa il nome del repository come percorso: se lo chiami in un altro modo, funziona uguale.

## Installarla sul telefono

- **Android (Chrome):** apri l'indirizzo, menu a tre puntini, **Installa app**.
- **iPhone (Safari):** apri l'indirizzo, tasto Condividi, **Aggiungi a Home**.

Dopo il primo avvio funziona anche offline.

## La voce delle meditazioni

La lettura usa la sintesi vocale del dispositivo (Web Speech API) con le voci italiane installate.

- **Android:** impostazioni, Lingua, Sintesi vocale, Google: installa i dati vocali italiani.
- **iPhone:** impostazioni, Accessibilità, Contenuto letto, Voci, Italiano: scarica una voce "avanzata" o "premium".
- **Computer:** Chrome ed Edge offrono voci italiane naturali.

La qualità cambia da dispositivo a dispositivo. Per una voce professionale che suona uguale su tutti i telefoni:

1. Nella scheda Respira, Meditazioni, tocca **SSML** accanto alla meditazione e copia il testo.
2. Incollalo in un servizio di sintesi vocale che supporta SSML e le voci neurali italiane e scarica l'MP3. Controlla i termini d'uso, in particolare per un uso commerciale.
3. Metti il file in `public/audio/` (per esempio `public/audio/scansione-corpo.mp3`).
4. In `src/data/meditations.ts` aggiungi alla meditazione `audioUrl: "audio/scansione-corpo.mp3"`.

Se `audioUrl` c'è, l'app riproduce il file invece di leggere il testo.

## Aggiungere meditazioni

Tutte le meditazioni sono in `src/data/meditations.ts`. Per aggiungerne una, inserisci un elemento in fondo alla lista:

```ts
{
  id: "mia-meditazione",            // unico, senza spazi
  title: "Titolo che vedi nell'app",
  category: "Rilassamento",         // una categoria esistente o una nuova
  description: "Una riga di descrizione.",
  segments: [
    ["Prima frase da leggere.", 8],  // [testo, secondi di silenzio dopo]
    ["Ultima frase.", 0],
  ],
},
```

La durata si calcola da parole e pause (a velocità 0,85 servono circa 1,9 secondi per parola più le pause); le pause non possono superare 90 secondi. I test (`npm test`) controllano che gli id siano unici e che le meditazioni da 10 e 20 minuti durino davvero quanto dichiarato.

## Dove cambiare le cose

| Cosa | File |
| --- | --- |
| Formule e livelli delle tabelle | `src/lib/tables.ts` |
| Meditazioni (testi e pause) | `src/data/meditations.ts` |
| Tecniche di pranayama | `src/data/pranayama.ts` |
| Timer a fasi (orari assoluti) | `src/lib/hooks.ts` |
| Lettura con la voce | `src/lib/narrator.ts` |
| Dati salvati sul dispositivo | `src/store.ts` |
| Funzioni native (vibrazione, schermo acceso, voce) | `src/lib/platform.ts`, `audio.ts`, `hooks.ts`, `narrator.ts` |
| Progetto Android | `android/`, `capacitor.config.ts` |
| Colori e stile | `src/styles.css` |
| Schermate | `src/screens/` |

Ogni meditazione è una lista di segmenti `[testo, pausa in secondi]`. La durata mostrata si calcola da parole e pause.

## App Android (APK)

Il progetto include la versione nativa Android, creata con [Capacitor](https://capacitorjs.com). Rispetto alla versione web ha vibrazione nativa, schermo acceso durante le sessioni e lettura con la voce di sintesi di Android. Si installa direttamente, senza Google Play.

### Ottenere l'APK con GitHub (consigliato, non serve installare nulla)

1. Pubblica il progetto su GitHub come spiegato sopra.
2. Apri la scheda **Actions**, scegli **Compila APK Android** e premi **Run workflow**.
3. Dopo 4-6 minuti apri l'esecuzione completata e scarica **respiro-apk** in fondo alla pagina (è uno zip che contiene `respiro.apk`).

Per avere l'APK come download diretto (più comodo dal telefono), crea un tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

L'APK compare nella sezione **Releases** del repository.

### Installarlo sul telefono

1. Copia `respiro.apk` sul telefono (o scaricalo da Releases direttamente dal telefono).
2. Aprilo dal gestore file. Android chiede di consentire l'installazione da questa origine: accetta.
3. Se compare l'avviso di Play Protect, scegli **Installa comunque**: è normale per un'app non pubblicata sullo store.

L'APK prodotto è "debug": è firmato con una chiave di prova, va bene per uso personale e per amici. Per pubblicare su Google Play serve una versione "release" firmata con una tua chiave, in formato AAB, e un account sviluppatore Google (pagamento una tantum).

### Compilarlo sul tuo computer (facoltativo)

Servono Node.js 22, JDK 21 e [Android Studio](https://developer.android.com/studio) (che installa l'Android SDK).

```bash
npm install
npm run android:apk
# l'APK si trova in android/app/build/outputs/apk/debug/app-debug.apk
```

Oppure `npm run android:sync` e poi `npm run android:open` per aprire il progetto in Android Studio.

Dopo ogni modifica al codice web, `npm run android:sync` copia la nuova versione nel progetto Android.

## Limiti noti

- La voce delle meditazioni dipende dalle voci italiane installate sul telefono. In Android: impostazioni, Gestione generale, Sintesi vocale, e scarica i dati vocali italiani.
- Con lo schermo bloccato a mano la lettura può fermarsi: durante le sessioni l'app tiene lo schermo acceso, ma non usa un servizio in primo piano per l'audio a schermo spento.
- Su iPhone la versione web non ha la vibrazione. Una versione iOS con Capacitor richiede un Mac e un account sviluppatore Apple e non è inclusa.
- L'interfaccia è solo in italiano; i testi sono scritti direttamente nelle schermate.

## Licenza

MIT. Vedi `LICENSE`.
