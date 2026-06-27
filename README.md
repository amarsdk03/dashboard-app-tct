# Dashboard "Torneo Città di Trento"

Questa repository GitHub contiene tutto il codice della nostra applicazione sviluppata per il corso di **Laboratorio di 
programmazione per sistemi mobili e tablet**, tenuta dal prof. Mauro Dragoni durante l'anno accademico 2025/2026.

Il nostro progetto consiste in una dashboard per soli amministratori (nel nostro caso, arbitri e gestori) per il 
[torneo di calcio della città di Trento](https://www.instagram.com/torneocittaditrento/), uno degli eventi calcistici 
amatoriali più riconosciuti e partecipati del territorio trentino da oltre trent’anni.

A partire dall'edizione di quest'estate abbiamo deciso di sviluppare due piattaforme apposite per migliorare 
l'esperienza generale degli utenti e dei partecipanti:
1. Un [sito web](https://torneo-citta-di-trento.vercel.app/) pubblico per i vari utenti, giocatori e spettatori
2. Un'app mobile per la dashboard amministrativa, da cui aggiornare e gestire i vari dati mostrati sul sito

L'applicazione mobile è stata sviluppata per essere multiplatform (*iOS, Android e Web).

_***Nota:** purtroppo, al momento non è disponibile una versione scaricabile dall'App Store dei dispositivi iOS a causa 
del costo richiesto di **99 USD annuali** per il rilascio tramite l'Apple Developer Program._



## Feature disponibili

![Mockup dell'app](https://raw.githubusercontent.com/amarsdk03/dashboard-app-tct/refs/heads/main/assets/screen-mockups/all.png)

- **Login:**
    - Accesso tramite email e password
    - Credenziali e sessione salvate in maniera persistente e sicura

- **Homepage:**
    - Mostra una lista delle partite di oggi
    - Mostra le azioni rapide per Tornei, Partite, Squadre e Giocatori
    - Mostra alcune statistiche generali

- **Lista tornei:**
    - Possibilità di visualizzare, cercare e filtrare la lista dei tornei
    - Pulsante di feedback/assistenza e link rapido alla pagina pubblica del torneo
    - Modal per visualizzare i dati di un torneo
    - Modal per creare un nuovo torneo (tramite procedura guidata):
        - Inserimento dei dati del torneo
        - Inserimento dei dati delle categorie
    - Modal per modificare i dati di un torneo

- **Lista partite:**
    - Possibilità di visualizzare, cercare e filtrare la lista delle partite
    - Pulsante di feedback/assistenza e link rapido alla pagina pubblica della partita
    - Modal per visualizzare i dati di una partita
    - Modal per creare una nuova partita (tramite procedura guidata):
        - Inserimento dei dati della partita
        - Selezione della categoria e del torneo
    - Modal per modificare i dati di una partita

- **Lista squadre:**
    - Possibilità di visualizzare, cercare e filtrare la lista delle squadre
    - Pulsante di feedback/assistenza e link rapido alla pagina pubblica della squadra
    - Modal per visualizzare i dati di una squadra
    - Modal per creare una nuova squadra (tramite procedura guidata):
        - Inserimento dei dati della squadra
        - Selezione dei giocatori dell'edizione attuale
    - Modal per modificare i dati di una squadra

- **Lista giocatori:**
    - Possibilità di visualizzare, cercare e filtrare la lista dei giocatori
    - Pulsante di feedback/assistenza e link rapido alla pagina pubblica del giocatore
    - Modal per visualizzare i dati di un giocatore
    - Modal per creare un nuovo giocatore (tramite procedura guidata):
        - Inserimento dei dati del giocatore
        - Selezione di una o più iscrizioni, ognuna associata a torneo e squadra
    - Modal per modificare i dati di un giocatore

- **Impostazioni:**
    - Mostra le info principali (email di accesso, ultimo log-in...)
    - Pulsante per abilitare il permesso delle notifiche locali
    - Promemoria locale 30 minuti prima dell'inizio di una partita
    - Pulsante di logout
    - Contatti vari per supporto tecnico
    - Versione app e altre info secondarie



## Possibili feature future

- Visualizzazione, inserimento e modifica anche delle seguenti tabelle:
    - `trofeo` (e `assegnazione_trofeo`)
    - `campo`
    - `staff`
- Possibilità di eliminare anche i dati delle tabelle in maniera sicura (es: tramite rate limiting)
- Possibilità di estendere la gestione degli amministratori in maniera più dinamica, ad esempio:
    - Visualizzando un log read-only di chi ha fatto cosa e quando
    - Dando la possibilità di registrarsi tramite un proprio profilo e attendere l'approvazione di un'amministratore
    - Cambiando la propria password in maniera autonoma, senza dover contattare il team di sviluppo
    - Permettendo l'accesso anche tramite Social Auth (es: tramite Google o Apple)



## Come funziona

### Struttura del codice:

#### `app/`

Contiene tutte le schermate e la navigazione dell'applicazione tramite **Expo Router**. Le route sono organizzate in gruppi e layout annidati.

* `(app)/`: area autenticata dell'app.
* `(tabs)/`: schermate accessibili tramite la barra di navigazione inferiore.
* `login.tsx`: schermata di autenticazione.
* `_layout.tsx`: configurazione dei navigator e dei layout condivisi.

#### `assets/`

Raccoglie tutte le risorse statiche utilizzate dall'app.

* `images/`: immagini, sfondi e logo.
* `screen-mockups/`: screenshot dell'app utilizzati nella documentazione.

#### `components/`

Contiene i componenti React riutilizzabili.

* `giocatori/`, `squadre/`, `partite/`, `tornei/`: componenti specifici delle varie sezioni funzionali.
* `input/`: componenti generici per i vari campi di input.
* `login/`: componenti relativi all'autenticazione.
* `ui/`: componenti generici dell'interfaccia utente (button, input, card, dialog, ecc.).
* `generic/`: componenti trasversali come testi Inter, pulsanti header, feedback e messaggi di errore.
* `splash-screen-controller.tsx`: gestione della schermata iniziale dell'app.

#### `data/`

Contiene le funzioni Supabase utilizzate per recuperare e aggiornare i dati delle sezioni principali.

#### `hooks/`

Custom React Hooks che incapsulano logiche condivise tra più componenti.

#### `lib/`

Raccoglie utility e configurazioni condivise.

* `supabase.ts`: client Supabase per piattaforme native.
* `supabase.web.ts`: configurazione specifica per il web.
* `notifications.ts`: gestione dei promemoria locali delle partite.
* `registration-utils.ts`: utilità di validazione per le iscrizioni dei giocatori.
* `theme.ts`: gestione del tema chiaro e scuro.
* `utils.ts`: funzioni di utilità generiche.

#### `providers/`

Contiene i React Context Provider utilizzati per la gestione dello stato globale dell'applicazione.

* `auth-provider.tsx`: gestione dell'autenticazione e della sessione utente.

#### `types/`

Definizioni TypeScript condivise in tutto il progetto.

* `database.types.ts`: tipi generati dal database Supabase.

#### `android/`

Progetto Android generato da Expo per la compilazione e l'esecuzione dell'app su dispositivi Android.

### File di configurazione:

| File                 | Descrizione                                   |
| -------------------- | --------------------------------------------- |
| `app.json`           | Configurazione principale di Expo.            |
| `.env.example`       | Esempio delle variabili d'ambiente richieste. |
| `.env.local`         | Variabili d'ambiente locali.                  |
| `package.json`       | Dipendenze e script del progetto.             |
| `tsconfig.json`      | Configurazione TypeScript.                    |
| `tailwind.config.js` | Configurazione Tailwind CSS / NativeWind.     |
| `babel.config.js`    | Configurazione Babel.                         |
| `metro.config.js`    | Configurazione del bundler Metro.             |
| `global.css`         | Stili globali dell'applicazione.              |
| `components.json`    | Configurazione dei componenti UI generati.    |

Di seguito la struttura parziale del progetto:

```text
.
├── app
│   ├── (app)
│   │   ├── (tabs)
│   │   │   ├── giocatori
│   │   │   ├── partite
│   │   │   ├── squadre
│   │   │   ├── tornei
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx
│   │   ├── impostazioni.tsx
│   │   └── _layout.tsx
│   ├── +html.tsx
│   ├── +not-found.tsx
│   ├── login.tsx
│   └── _layout.tsx
├── assets
│   ├── images
│   │   ├── background-login.png
│   │   ├── background.png
│   │   ├── logo.png
│   │   └── logo-eagle-only.png
│   └── screen-mockups
├── components
│   ├── generic
│   ├── giocatori
│   ├── input
│   ├── login
│   ├── partite
│   ├── squadre
│   ├── tornei
│   ├── ui
│   └── splash-screen-controller.tsx
├── data
│   ├── campi.ts
│   ├── classifiche.ts
│   ├── giocatori.ts
│   ├── partite.ts
│   ├── squadre.ts
│   └── tornei.ts
├── hooks
│   └── use-auth-context.tsx
├── lib
│   ├── supabase.ts
│   ├── supabase.web.ts
│   ├── notifications.ts
│   ├── registration-utils.ts
│   ├── theme.ts
│   └── utils.ts
├── providers
│   └── auth-provider.tsx
├── types
│   └── database.types.ts
├── android
├── .env.example
├── .env.local
├── app.json
├── babel.config.js
├── components.json
├── expo-env.d.ts
├── global.css
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

### Database:

Per il database è stato scelto Supabase, sia per i dati SQL che per la gestione dell'autenticazione, data la sua facilità d'uso e integrità di sicurezza.

I dati sono protetti tramite **Row Level Security**, in particolare:
- Tutte le info sono apertamente reperibili con l'operazione `SELECT`, anche dal sito web principale (o chiunque chiami l'API)
- Le operazioni di `INSERT` e `UPDATE` sono disponibili solamente agli utenti registrati per la dashboard admin

Al momento, si è deciso di non includere l'operazione di `DELETE`, lasciandola disponibile a soli noi amministratori, per evitare possibili problemi.

_Schema della versione 1.0 del sito web e della dashboard:_

![Schema del database SQL](https://raw.githubusercontent.com/amarsdk03/sito-web-tct/db38d42c41049e4ce0d00658e432952ce040d96f/public/temp/schema.jpg)



## Informazioni tecniche

Questa repository contiene codice [React Native](https://reactnative.dev/) basata sul framework [Expo](https://expo.dev/), e usa la 
libreria di componenti [React Native Reusables](https://reactnativereusables.com) (stilizzata con [Tailwind CSS](https://tailwindcss.com/), tramite [Nativewind](https://www.nativewind.dev/)).

### Configurazione progetto:

1. Prima di iniziare, assicurati di aver installato nel tuo sistema i seguenti:
    ``` 
    Node.js (versione 12 o successive)
    ```
    ``` 
    npm (arriva installato con Node.js)
    ```

2. Clona la repository:
    ```bash
    git clone https://github.com/AmarS03/dashboard-app-tct.git
    ```

3. Installa le varie dependencies:
    ```bash
    npm install
    # oppure
    yarn install
    # oppure
    pnpm install
    # oppure
    bun install
    ```

4. Aggiungi le variabili d'ambiente necessarie (listate anche in `.env.example`):
    ```
    EXPO_PUBLIC_SUPABASE_URL=
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
    ```

### Esecuzione e anteprima:

Esegui il server per visualizzare un'anteprima dell'app:
```bash
npx expo start
```

Questo avvierà Expo Dev Server. Per aprire l'app su:

- **iOS**: premi `i` per avviare l'emulatore iOS _(solo su Mac)_
- **Android**: premi `a` per avviare l'emulatore Android
- **Web**: premi `w` per avviare sul browser

Puoi anche scannerizzare il codice QR, utilizzando l'app [Expo Go](https://expo.dev/go) per testare l'app sul tuo dispositivo fisico.

Oppure esegui il seguente comando:
```bash
npm run ios
```

### Documentazione:

Per maggiori info sulle tecnologie di sviluppo utilizzate:

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [React Native Reusables Docs](https://reactnativereusables.com)

### Deployment:

Per il deployment viene usato [Expo Application Services (EAS)](https://expo.dev/eas).

La configurazione per il deployment può essere direttamente eseguita tramite il seguente comando:
```bash
eas build
```



## Contatti

La progettazione, lo sviluppo, il rilascio e il mantenimento del progetto sono state gestite da Alessandro Gremes e 
Amar Sidkir.

Per qualsiasi dubbio o segnalazione, potete contattarci tramite email:
- [amarsdk03@gmail.com](mailto:amarsdk03@gmail.com)
- [alessandrogremes04@gmail.com](mailto:alessandrogremes04@gmail.com)

oppure potete contattare direttamente gli organizzatori del torneo alla loro [pagina Instagram qui](https://www.instagram.com/torneocittaditrento/).
