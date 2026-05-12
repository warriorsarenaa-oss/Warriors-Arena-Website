import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section } = await params;
    
    const { data, error } = await supabaseService
      .from('cms_content')
      .select('*')
      .eq('section', section);

    if (error) throw error;
    
    // Format response: { en: { key: value }, ar: { key: value } }
    const result = {
      en: {} as Record<string, any>,
      ar: {} as Record<string, any>
    };
    
    data.forEach(item => {
      result.en[item.key] = item.value_en;
      result.ar[item.key] = item.value_ar || item.value_en; // Fallback to EN if AR is missing
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[PUBLIC_CMS_${(await params).section.toUpperCase()}_GET]`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
