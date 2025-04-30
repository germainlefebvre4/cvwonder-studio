// Session types for CV generation
export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  cvContent: string;
  selectedTheme: string;
}

export interface CreateSessionRequest {
  initialContent?: string;
  theme?: string;
  retentionDays?: number;
}

export interface UpdateSessionRequest {
  cvContent?: string;
  selectedTheme?: string;
  retentionDays?: number;
}

export interface ShareSessionRequest {
  retentionDays: number;
}