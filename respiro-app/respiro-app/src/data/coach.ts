/**
 * Frasi del coach per l'apnea a secco, in italiano, con il "tu".
 * Sono testi originali scritti sui principi che ricorrono nella didattica dell'apnea:
 * rilassare mascella, spalle e mani (meno muscoli attivi = meno ossigeno consumato),
 * vivere il bisogno di respirare come un segnale da osservare e non come un'emergenza,
 * usare ancore mentali (battito, immagini calme), ricordare che si può sempre respirare.
 * Brevi (al massimo 12 parole circa) perché vengono lette durante l'apnea.
 * Per aggiungerne o cambiarne basta modificare le liste qui sotto.
 */

export const coachPhrases = {
  /** Primi secondi dell'apnea. */
  inizio: [
    "Rilassa la mascella e le spalle.",
    "Lascia andare ogni tensione. Il corpo è pesante e fermo.",
    "Occhi morbidi, fronte distesa.",
    "Resta immobile. Meno ti muovi, meno ossigeno consumi.",
    "Sciogli le mani, sciogli i piedi.",
  ],
  /** Prima metà: calma e immagini. */
  calma: [
    "Sei calmo. Sei fermo. Va tutto bene.",
    "Immagina un mare liscio, senza onde.",
    "Segui il battito del cuore e lascia che rallenti.",
    "Ogni secondo di calma è un secondo guadagnato.",
    "Il corpo sa cosa fare. Tu devi solo restare rilassato.",
    "Respira nella mente, lentamente, senza muoverti.",
  ],
  /** Quando arriva il bisogno di respirare. */
  contrazioni: [
    "Il bisogno di respirare è un segnale, non un'emergenza. Resta rilassato.",
    "Se arrivano le contrazioni, osservale. Poi passano.",
    "Ammorbidisci la gola e il collo.",
    "Lascia che il diaframma si muova da solo, senza contrarre il resto.",
    "Una contrazione alla volta. Non combatterla, lasciala passare.",
    "Spalle giù, mascella morbida. Sei ancora tranquillo.",
  ],
  /** Incoraggiamento nella parte avanzata. */
  avanti: [
    "Stai andando bene. Continua con calma.",
    "Un momento alla volta. Ci sei.",
    "Resta qui, rilassato. Stai facendo un ottimo lavoro.",
    "Concentrati solo sul secondo che sta passando.",
  ],
  /** Promemoria di sicurezza, mescolati nelle apnee più lunghe. */
  sicurezza: [
    "Ricorda: puoi respirare in qualsiasi momento.",
    "Ascolta il tuo corpo. Quando è il momento, respira.",
    "Non devi dimostrare niente. Respira quando vuoi.",
  ],
  /** Ultimi dieci secondi di un'apnea di tabella. */
  fine: [
    "Ancora dieci secondi. Resta calmo.",
    "Dieci secondi alla fine. Stai andando bene.",
    "Quasi finito. Rilassa le spalle.",
  ],
  /** Primo round di una tabella. */
  primoRound: [
    "Si comincia. Resta rilassato e ricorda che puoi respirare in qualsiasi momento.",
    "Primo round. Parti con calma, senza fretta.",
  ],
  /** Ultimo round di una tabella. */
  ultimoRound: [
    "Ultima apnea. Ci sei quasi, resta calmo.",
    "L'ultimo round. Hai fatto un ottimo lavoro finora.",
  ],
  /** Tabella CO2: i recuperi sono brevi. */
  co2: [
    "In questa tabella i recuperi sono brevi: è normale sentire il bisogno di respirare. Resta calmo.",
    "Il bisogno di respirare arriva presto, ed è proprio quello che alleni. Rilassati.",
  ],
  /** Tabella O2: le apnee si allungano. */
  o2: [
    "Le apnee si allungano: la tua forza è la calma.",
    "Rilassati più che puoi. Il corpo ha ancora ossigeno.",
  ],
  /** Durante il recupero. */
  recupero: [
    "Respira con calma. Inspira dal naso, espira lungo dalla bocca.",
    "Lascia scendere il battito. Respiro tranquillo, senza forzare.",
    "Rilassa le spalle e la mascella. Respira piano.",
    "Bene. Ora recupera, senza fretta.",
  ],
  /** Verso la fine del recupero. */
  prepara: [
    "Tra poco si riparte. Ultimi respiri lenti, senza iperventilare.",
    "Preparati. Un respiro calmo, niente respiri forzati.",
  ],
  /** Prima di una sessione. */
  inizioSessione: ["Mettiti comodo. Respira con calma e lascia andare le spalle."],
  /** Fine della tabella. */
  fineTabella: ["Tabella completata. Bravo. Respira con calma e rilassa tutto il corpo."],
  /** Test del massimale: all'inizio. */
  testInizio: [
    "Rilassati. Non c'è fretta, e puoi respirare quando vuoi.",
    "Resta calmo e immobile. Il tempo scorre da solo.",
  ],
  /** Test del massimale: obiettivo del record personale. */
  testRecord: {
    vicino: "Sei a due terzi del tuo record. Resta calmo e rilassato.",
    dieci: "Mancano dieci secondi al tuo record. Rilassa le spalle.",
    raggiunto: "Hai raggiunto il tuo record. Ascolta il corpo e respira quando senti che è il momento.",
    oltre: "Sei oltre il tuo record. Ottimo. Respira appena senti di averne bisogno.",
  },
};

export type PhrasePool = keyof Omit<typeof coachPhrases, "testRecord">;
