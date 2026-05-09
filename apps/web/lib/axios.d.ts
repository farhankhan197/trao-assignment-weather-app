import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipCache?: boolean;
    skipAuthRedirect?: boolean;
    __cachedData?: unknown;
  }

  export interface InternalAxiosRequestConfig {
    skipCache?: boolean;
    skipAuthRedirect?: boolean;
    __cachedData?: unknown;
  }
}
