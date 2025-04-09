import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logger.info("[THEMES_SEARCH] Request received");
  logger.info("[THEMES_SEARCH] Request URL:", req.url);
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '6');
    const query = searchParams.get('q') || '';
    
    // Ensure valid pagination parameters
    const validPage = page > 0 ? page : 1;
    const validPerPage = perPage > 0 && perPage <= 50 ? perPage : 6;
    
    // Calculate skip value for pagination
    const skip = (validPage - 1) * validPerPage;
    
    // Build search criteria
    const where = query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    } : {};
    
    // Get total count of themes matching the search
    const totalItems = await prisma.theme.count({
    //   where
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalItems / validPerPage);
    
    // Get paginated themes matching the search
    const themes = await prisma.theme.findMany({
    //   where,
      skip,
      take: validPerPage,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      items: themes,
      page: validPage,
      perPage: validPerPage,
      totalItems,
      totalPages,
      query: query || null
    });
  } catch (error) {
    console.error('[THEMES_SEARCH]', error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
