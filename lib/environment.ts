import { LogLevel } from "./logger";

export type Environment = 'development' | 'production';

export const APP_ENV: Environment = process.env.APP_ENV === 'production' ? 'production' : 'development';
export const LOG_LEVEL: LogLevel = process.env.LOG_LEVEL as LogLevel || 'info';
export const CVWONDER_VERSION: string = process.env.CVWONDER_VERSION || '0.3.0';
export const CVWONDER_PDF_GENERATION_PORT: number = parseInt(process.env.CVWONDER_PDF_GENERATION_PORT || '9889', 10);
