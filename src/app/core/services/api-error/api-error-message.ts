import { HttpErrorResponse } from '@angular/common/http';
import { ApiHttpError } from './api-http-error';

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'La richiesta non è valida. Controlla i dati inseriti e riprova.',
  401: 'La sessione non è più valida. Effettua nuovamente l’accesso.',
  403: 'Non hai i permessi necessari per eseguire questa operazione.',
  404: 'La risorsa richiesta non è stata trovata.',
  409: 'L’operazione non può essere completata perché c’è un conflitto con lo stato attuale.',
  422: 'Alcuni dati non sono validi. Controllali e riprova.',
  429: 'Hai effettuato troppe richieste. Attendi qualche istante e riprova.',
  500: 'Si è verificato un problema sul server. Riprova più tardi.',
  502: 'Il servizio non è momentaneamente disponibile. Riprova più tardi.',
  503: 'Il servizio non è momentaneamente disponibile. Riprova più tardi.',
  504: 'Il server ha impiegato troppo tempo a rispondere. Riprova più tardi.',
};

const DEFAULT_HTTP_ERROR_MESSAGE =
  'Si è verificato un errore imprevisto. Riprova più tardi.';

const NETWORK_ERROR_MESSAGE =
  'Impossibile raggiungere il server. Controlla la connessione e riprova.';

export function getApiErrorMessage(error: unknown): string {
  const status = getApiErrorStatus(error);

  if (status === 0 || !status) {
    return NETWORK_ERROR_MESSAGE;
  }

  return HTTP_ERROR_MESSAGES[status as number] ?? DEFAULT_HTTP_ERROR_MESSAGE;
}

export function getApiErrorStatus(error: unknown): number | null {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }

  if (error instanceof ApiHttpError) {
    return error.status;
  }

  return null;
}

export function getTechnicalErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
