/** The single error shape every endpoint responds with. */
export interface ApiError {
  error: {
    message: string;
    details?: unknown;
  };
}
