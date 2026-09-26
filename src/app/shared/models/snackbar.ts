export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarData {
  type: SnackbarType;
  message: string;
  title?: string;
}
