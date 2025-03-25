// Session types for CV generation
export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  cvContent: string;
  selectedTheme: string;
}

export interface CreateSessionRequest {
  initialContent?: string;
  theme?: string;
}

export interface UpdateSessionRequest {
  cvContent?: string;
  selectedTheme?: string;
}