# Respiro

App mobile per allenamento all'apnea a secco (tabelle CO2 e O2), pranayama e meditazioni guidate in italiano con voce narrante.
Gratuita e open source (licenza MIT). Funziona nel browser e si installa sul telefono come app (PWA), anche senza connessione.

> **Sicurezza.** L'apnea si pratica solo a secco, seduti o sdraiati, mai in acqua, alla guida o dopo iperventilazione. Kapalabhati e Bhastrika sono respirazioni forzate, da evitare o da fare solo con parere medico in gravidanza e con problemi cardiovascolari, di pressione, epilessia o asma. Respiro non è un dispositivo medico.

## Cosa contiene

- **Test del massimo** per misurare il personal best (PB). Il PB cambia solo se lo confermi.
- **Tabelle CO2 e O2** calcolate sul PB, con parametri modificabili e avviso oltre l'85% del PB.
- **Sessione di apnea** con fasi, segnali sonori e di vibrazione, pulsante "Respira" sempre visibile, pausa, riepilogo con sforzo percepito.
- **Pranayama**: respirazione coerente, diaframmatica, box breathing, 4-7-8, Anulom Vilom, Bhramari, Ujjayi, Kapalabhati e Bhastrika, con fasi modificabili e preset personali.
- **25 meditazioni guidate in italiano** (20 da 2-4 minuti, 5 da circa 10 minuti), lette da una voce italiana, con scelta della voce, velocità e sottotitoli.
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

La qualità cambia da dispositivo a dispositivo, e a schermo spento la lettura nel browser può fermarsi. Per una voce professionale che funziona sempre:

1. Nella scheda Respira, Meditazioni, tocca **SSML** accanto alla meditazione e copia il testo.
2. Incollalo in un servizio di sintesi vocale che supporta SSML e le voci neurali italiane e scarica l'MP3. Controlla i termini d'uso, in particolare per un uso commerciale.
3. Metti il file in `public/audio/` (per esempio `public/audio/scansione-corpo.mp3`).
4. In `src/data/meditations.ts` aggiungi alla meditazione `audioUrl: "audio/scansione-corpo.mp3"`.

Se `audioUrl` c'è, l'app riproduce il file invece di leggere il testo.

## Dove cambiare le cose

| Cosa | File |
| --- | --- |
| Formule e livelli delle tabelle | `src/lib/tables.ts` |
| Meditazioni (testi e pause) | `src/data/meditations.ts` |
| Tecniche di pranayama | `src/data/pranayama.ts` |
| Timer a fasi (orari assoluti) | `src/lib/hooks.ts` |
| Lettura con la voce | `src/lib/narrator.ts` |
| Dati salvati sul dispositivo | `src/store.ts` |
| Colori e stile | `src/styles.css` |
| Schermate | `src/screens/` |

Ogni meditazione è una lista di segmenti `[testo, pausa in secondi]`. La durata mostrata si calcola da parole e pause.

## Limiti noti

- Su iPhone la vibrazione del browser non è disponibile. Con Capacitor (sotto) si ottiene.
- Audio e voce a schermo spento sono affidabili solo nella versione nativa.
- L'interfaccia è solo in italiano; i testi sono scritti direttamente nelle schermate.

## Versione per gli store (facoltativo)

Per pubblicare su Google Play e App Store, il progetto si può impacchettare con [Capacitor](https://capacitorjs.com): aggiunge audio in background, vibrazione affidabile e schermo sempre acceso. Pubblicare sugli store richiede gli account sviluppatore (a pagamento) di Google e Apple.

## Licenza

MIT. Vedi `LICENSE`.
