import { NextRequest, NextResponse } from 'next/server';
import { 
  APP_ENV, 
  LOG_LEVEL, 
  CVWONDER_VERSION, 
  CVWONDER_PDF_GENERATION_PORT, 
  CVWONDER_PDF_GENERATION_ENABLED,
} from '../../../lib/environment';

export async function GET(req: NextRequest) {
  const envInfo = {
    env: APP_ENV,
    logLevel: LOG_LEVEL,
    pdfGenerationPort: CVWONDER_PDF_GENERATION_PORT,
    pdfGenerationEnabled: CVWONDER_PDF_GENERATION_ENABLED,
    cvwonder: {
      version: CVWONDER_VERSION,
    },
  };
  return NextResponse.json(envInfo);
}
