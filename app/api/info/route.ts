import { NextRequest, NextResponse } from 'next/server';
import { APP_ENV, LOG_LEVEL, CVWONDER_VERSION, CVWONDER_PDF_GENERATION_PORT } from '../../../lib/environment';

export async function GET(req: NextRequest) {
  const envInfo = {
    env: APP_ENV,
    logLevel: LOG_LEVEL,
    pdfGenerationPort: CVWONDER_PDF_GENERATION_PORT,
    cvwonder: {
      version: CVWONDER_VERSION,
    },
  };
  return NextResponse.json(envInfo);
}
