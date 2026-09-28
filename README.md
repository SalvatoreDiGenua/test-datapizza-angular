# Datapizza Angular Chat & Document Workspace

Applicazione web Angular per la gestione di documenti PDF e per un'esperienza di chat con risposte in streaming, citazioni documentali e visualizzazione delle pagine sorgente.

> **Nota architetturale**
>
> Il punto di partenza di questo progetto è il mio boilerplate Angular personale: [SalvatoreDiGenua/angular-boilerplate](https://github.com/SalvatoreDiGenua/angular-boilerplate).
> Il boilerplate fornisce la base applicativa e le scelte infrastrutturali; questo repository aggiunge invece il dominio specifico richiesto dall'applicazione: autenticazione, documenti, chat, citazioni e storico.

## ✨ Panoramica

Il progetto è una **Single Page Application Angular 22** costruita con un'architettura standalone e signal-based.

L'applicazione mette insieme tre aree principali:

- 🔐 **Autenticazione** tramite il mock API e cookie di sessione.
- 📄 **Document workspace** per upload multiplo, stato di elaborazione, paginazione e consultazione dei PDF.
- 💬 **Chat streaming** con rendering Markdown, citazioni provenienti dai documenti e visualizzazione delle evidenze direttamente sul PDF.

L'obiettivo non è soltanto implementare le feature richieste, ma mantenere una struttura che sia leggibile, estendibile e coerente con le moderne API di Angular.

## 🧱 Stack tecnico

| Area | Tecnologia |
| --- | --- |
| Framework | Angular 22 |
| Linguaggio | TypeScript 6 |
| UI | Angular Material / CDK |
| Styling | Tailwind CSS 4 |
| Reactive state | Angular Signals |
| Async resources | `resource()` / `rxResource()` |
| HTTP | Angular HttpClient + Fetch |
| API contract | OpenAPI Generator |
| Streaming chat | Fetch + NDJSON |
| Markdown | `ngx-markdown` + `marked` |
| PDF | `ngx-extended-pdf-viewer` |
| Request state | `ngx-request-lock` |
| Rx | RxJS 7 |
| Formatting | Prettier + Tailwind plugin |
| Linting | ESLint / angular-eslint |
| Testing | Vitest |

## 🏗️ Scelte architetturali

### Standalone Angular e feature-based architecture

Il progetto segue l'architettura moderna di Angular:

- componenti standalone;
- routing standalone e lazy loading delle feature;
- dependency injection tramite `inject()`;
- stato locale e derivato tramite Signals;
- `rxResource()` per legare richieste HTTP a parametri reattivi;
- change detection zoneless;
- separazione tra infrastruttura applicativa, feature e componenti condivisi.

La struttura principale è organizzata per responsabilità:

```text
src/app/
├── api/                         # API generate da OpenAPI
├── core/
│   ├── auth/                    # sessione e autenticazione
│   ├── http/
│   │   └── interceptors/        # auth, request lock, error handling
│   ├── i18n/                    # configurazione lingue
│   └── services/
│       ├── api-error/
│       └── chat/                # streaming e sessione chat
├── features/
│   ├── chat/                    # chat, messaggi, citazioni
│   ├── documents/               # upload e gestione documenti
│   └── login/                   # autenticazione
├── shared/
│   ├── components/              # UI riutilizzabile
│   ├── pipes/
│   └── services/
├── app.config.ts
├── app.routes.ts
└── app.ts
```

La separazione è intenzionale: la cartella `core` contiene infrastruttura condivisa dall'applicazione, mentre la logica specifica del dominio rimane nelle `features`.

### State management con Signals

Non è stato introdotto un global state management library perché il dominio dell'applicazione non ne richiede la complessità.

Lo stato viene mantenuto vicino alla feature che lo utilizza:

- `signal()` per stato mutabile;
- `computed()` per stato derivato;
- `rxResource()` per dati asincroni reattivi;
- servizi scoped alla feature quando serve isolare una sessione.

Un esempio importante è la chat: `ChatSession` gestisce la risorsa della conversazione, mentre `ChatMessageSender` incapsula il ciclo di vita dello streaming, evitando di concentrare tutta la responsabilità in un unico servizio.

### API generate da OpenAPI

Il backend espone uno schema OpenAPI. I client Angular utilizzati dall'applicazione vengono generati con **OpenAPI Generator**.

Questo permette di evitare DTO e metodi HTTP duplicati manualmente e mantiene il contratto TypeScript sincronizzato con lo schema API.

La generazione è disponibile tramite:

```bash
npm run generate:api
```

Il comando assume che il backend mock sia disponibile su:

```text
http://localhost:8000/openapi.json
```

> La directory `src/app/api` è codice generato: la logica applicativa non deve essere inserita direttamente nei file generati.

### HTTP e gestione degli errori

Le chiamate HTTP passano attraverso interceptor funzionali dedicati:

1. autenticazione;
2. request locking;
3. normalizzazione degli errori API.

Gli errori HTTP vengono trasformati in un errore applicativo comune e presentati all'utente tramite Snackbar con messaggi comprensibili.

Questo mantiene separati:

- il dettaglio tecnico dell'errore;
- la rappresentazione applicativa;
- la presentazione UI.

Lo streaming della chat usa invece Fetch perché la risposta è una sequenza NDJSON e non una normale richiesta HTTP gestita da `HttpClient`. Gli errori di streaming vengono quindi gestiti nel relativo servizio.

## 📚 Librerie esterne e motivazioni

Le dipendenze non sono state aggiunte solo per comodità: ciascuna risponde a una necessità concreta dell'applicazione.

### Markdown: ngx-markdown + marked

Le risposte della chat possono contenere Markdown. Per questo il rendering non viene effettuato manualmente tramite HTML concatenato.

Il progetto utilizza:

- [ngx-markdown](https://github.com/jfcere/ngx-markdown) per l'integrazione con Angular;
- [marked](https://github.com/markedjs/marked) come parser Markdown.

La pipeline permette di visualizzare titoli, liste, codice e formattazione delle risposte mantenendo il rendering all'interno di un componente Angular dedicato.

Particolare attenzione è stata data alla **sicurezza del contenuto HTML**: il Markdown proveniente dalla risposta non viene trattato come HTML arbitrario fidato.

### PDF: ngx-extended-pdf-viewer

La gestione delle citazioni richiede qualcosa di più di un semplice link al documento.

L'utente deve poter:

- aprire il PDF;
- raggiungere la pagina citata;
- vedere le citazioni associate alla pagina;
- visualizzare le aree evidenziate corrispondenti ai bounding regions restituiti dall'API.

Per questo viene utilizzato [ngx-extended-pdf-viewer](https://github.com/stephanrauh/ngx-extended-pdf-viewer), che fornisce l'infrastruttura necessaria per la visualizzazione e l'interazione con i PDF direttamente nell'applicazione.

### Request state: ngx-request-lock

[ngx-request-lock](https://github.com/SalvatoreDiGenua/ngx-request-lock-docs) è una mia libreria Angular utilizzata per coordinare lo stato di richieste HTTP che influenzano la UI.

In questo progetto viene utilizzata dove il concetto di "richiesta in corso" deve essere condiviso da più operazioni correlate.

Un esempio è l'upload dei documenti: lo stato di upload viene utilizzato per:

- impedire azioni concorrenti non desiderate;
- mostrare lo stato di caricamento;
- coordinare upload e refresh della lista;
- mantenere la UI coerente durante l'operazione.

Non viene utilizzata indiscriminatamente per ogni operazione asincrona: lo streaming della chat mantiene il proprio ciclo di vita perché non è una normale richiesta `HttpClient`.

## 💬 Chat e streaming

La chat riceve la risposta dal backend come stream NDJSON.

Il flusso è concettualmente:

```text
User message
    │
    ▼
ChatMessageSender
    │
    ├── content ───────► aggiorna progressivamente il messaggio
    ├── citations ─────► aggiorna le citazioni
    └── error ─────────► stato errore + feedback UI
```

Durante lo streaming:

- il testo dell'assistente viene aggiornato progressivamente;
- la UI segue automaticamente il contenuto finché l'utente rimane vicino al fondo della chat;
- l'utente può interrompere la richiesta;
- gli errori non vengono persi;
- le citazioni vengono associate al messaggio.

La logica è stata separata dalla gestione della sessione per evitare un servizio monolitico.

## 📄 Documenti e citazioni

La sezione documenti supporta:

- upload di uno o più PDF;
- filtro dei file non PDF;
- progress dell'upload;
- stato di elaborazione lato server;
- lista paginata;
- refresh reattivo;
- apertura del documento.

Le citazioni della chat sono collegate al documento e alla pagina sorgente.

Quando più citazioni appartengono alla stessa pagina, la UI le raggruppa in un'unica voce:

```text
Pagina 7  ③
Pagina 12
Pagina 18  ②
```

La selezione della pagina aggrega le evidenze disponibili e visualizza i relativi bounding regions sul PDF.

## 🧭 Chat history

Lo storico delle conversazioni è integrato nel routing dell'applicazione.

La selezione di una conversazione porta alla relativa chat e permette di caricare il contenuto dal backend senza introdurre uno stato globale dedicato esclusivamente alla navigazione.

La sessione di chat e i messaggi temporaneamente in streaming vengono mantenuti separati dai dati già persistiti, così da poter rappresentare correttamente anche lo stato intermedio della risposta.

## 🎨 UI e accessibilità

La UI utilizza Angular Material come base per i componenti interattivi e Tailwind CSS per il layout e la composizione visuale.

Sono stati mantenuti alcuni principi del boilerplate:

- navigazione accessibile da tastiera;
- focus visibile;
- semantic HTML;
- label e attributi ARIA dove necessari;
- stati di loading e errore espliciti;
- supporto responsive;
- rispetto di `prefers-reduced-motion`.

Angular Material viene preferito quando esiste un componente che rappresenta correttamente il pattern UI richiesto, mentre Tailwind viene utilizzato per layout, spacing e personalizzazioni visive.

## 🔐 Autenticazione

L'applicazione utilizza il mock backend fornito per il progetto.

Il flusso prevede:

1. inserimento dello user id;
2. chiamata al login API;
3. gestione della sessione tramite cookie;
4. accesso alle route protette;
5. logout con ritorno alla pagina di login.

Il frontend non memorizza direttamente credenziali o token in local storage.

## 🚀 Esecuzione locale

### Prerequisiti

Sono necessari:

- Node.js compatibile con Angular 22;
- npm;
- il backend mock del progetto avviato localmente sulla porta `8000`.

### Installazione

Clonare il repository e installare le dipendenze:

```bash
git clone https://github.com/SalvatoreDiGenua/test-datapizza-angular.git
cd test-datapizza-angular
npm install
```

### Avvio in sviluppo

Con il backend disponibile su `http://localhost:8000`:

```bash
npm start
```

L'applicazione viene servita tramite Angular CLI e aperta automaticamente nel browser.

Per esporre il dev server sulla macchina locale/rete:

```bash
npm run start-local-machine
```

Questa modalità utilizza la porta `5200`.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Formattazione

Applicare Prettier:

```bash
npm run format
```

Verificare la formattazione senza modificare i file:

```bash
npm run format:check
```

### Test

```bash
npm test
```

Modalità watch:

```bash
npm run test:watch
```

### Pulizia

Per rimuovere gli output generati:

```bash
npm run clean
```

### Generazione client API

Con il backend avviato e lo schema OpenAPI raggiungibile:

```bash
npm run generate:api
```

Il comando legge:

```text
http://localhost:8000/openapi.json
```

e genera il client TypeScript/Angular in:

```text
src/app/api
```

## 🐳 Esecuzione con Docker

Per rendere il frontend facilmente eseguibile su macchine diverse è disponibile un'immagine Docker **multi-stage**:

1. una fase Node.js installa le dipendenze e compila l'app Angular;
2. una fase Nginx serve gli asset statici risultanti;
3. Nginx espone l'API del mock backend tramite reverse proxy su `/api`.

Il container frontend non contiene il backend: il mock API rimane un servizio separato e deve essere raggiungibile sulla porta `8000` della macchina host.

### Prerequisiti

Sono necessari:

- Docker;
- Docker Compose, incluso nelle installazioni moderne di Docker Desktop;
- il mock backend avviato localmente sulla porta `8000`.

### Avvio con Docker Compose

Dalla root del progetto:

```bash
docker compose up --build
```

L'applicazione sarà disponibile su:

```text
http://localhost:8080
```

Per arrestare e rimuovere il container:

```bash
docker compose down
```

### Avvio con Docker CLI

È possibile costruire e avviare l'immagine senza Compose:

```bash
docker build -t datapizza-angular .
docker run --rm -p 8080:80 --add-host host.docker.internal:host-gateway datapizza-angular
```

### Perché il proxy Nginx

In ambiente Docker il browser non deve conoscere l'indirizzo interno del container o modificare manualmente la configurazione API.

L'applicazione Angular viene compilata con:

```text
/api
```

come base URL del backend Docker. Nginx inoltra quindi le richieste `/api/*` al mock backend disponibile sulla macchina host alla porta `8000`.

Questo mantiene frontend e API sullo stesso origin dal punto di vista del browser e semplifica anche la gestione della sessione tramite cookie.

### Configurazione per sviluppo locale

La configurazione Docker è separata da quella di sviluppo:

- `npm start` continua a utilizzare `http://localhost:8000`;
- `npm run build:docker` utilizza `/api`;
- il container Nginx gestisce il proxy verso il backend.

In questo modo il flusso di sviluppo Angular non viene alterato dalla presenza del container.

## ⚙️ Configurazione API

L'URL del backend di sviluppo è configurato nell'environment Angular.

Il client generato viene inizializzato con:

- base URL del backend;
- `withCredentials: true`, necessario per la sessione basata su cookie.

Prima di avviare il frontend assicurarsi quindi che il mock backend sia raggiungibile sulla porta prevista.

## 🧪 Quality checks

Per una verifica completa del progetto:

```bash
npm run format:check
npm run lint
npm run build
npm test
```

Questi comandi verificano rispettivamente formattazione, qualità statica, compilazione e test.

## 🔄 Rapporto con il boilerplate

Questo progetto non nasce da una configurazione Angular completamente nuova.

La base deriva dal mio boilerplate personale:

**[SalvatoreDiGenua/angular-boilerplate](https://github.com/SalvatoreDiGenua/angular-boilerplate)**

Il boilerplate definisce il punto di partenza infrastrutturale e alcuni principi condivisi:

- Angular moderno e standalone;
- Signals;
- dependency injection;
- routing;
- HTTP infrastructure;
- accessibilità;
- linting e formatting;
- struttura `core / features / shared`.

Questo progetto estende quella base con il dominio specifico dell'applicazione e con le dipendenze necessarie alla gestione di Markdown, PDF, streaming e request state.

La scelta di partire da un boilerplate personale ha anche un vantaggio progettuale: le decisioni infrastrutturali non vengono reinventate per ogni progetto, mentre la logica di dominio rimane specifica dell'applicazione.

## 👤 Autore

**Salvatore Di Genua**

- [GitHub](https://github.com/SalvatoreDiGenua)
- [Angular Boilerplate](https://github.com/SalvatoreDiGenua/angular-boilerplate)
- [ngx-request-lock](https://github.com/SalvatoreDiGenua/ngx-request-lock-docs)
