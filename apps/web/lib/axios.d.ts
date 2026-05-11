import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipCache?: boolean;
    skipAuthRedirect?: boolean;
    cacheTTL?: number; // Override default TTL in milliseconds
  }

  export interface InternalAxiosRequestConfig {
    skipCache?: boolean;
    skipAuthRedirect?: boolean;
    cacheTTL?: number;
  }
}
