
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get Google Drive credentials from secrets
    const driveApiKey = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    const driveClientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const driveClientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

    if (!driveApiKey || !driveClientId || !driveClientSecret || !refreshToken) {
      throw new Error('Missing Google Drive credentials');
    }

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: driveClientId,
        client_secret: driveClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Export data from key tables
    const tables = ['profiles', 'tasks', 'mandirs', 'kshetras', 'villages', 'mandals'];
    const backupData: Record<string, any> = {};

    for (const table of tables) {
      const { data, error } = await supabaseClient
        .from(table)
        .select('*');
      
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        continue;
      }
      
      backupData[table] = data;
    }

    // Create backup file content
    const backupContent = JSON.stringify({
      timestamp: new Date().toISOString(),
      data: backupData,
    }, null, 2);

    // Upload to Google Drive
    const fileName = `seva-sarthi-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/related; boundary="backup_boundary"',
      },
      body: [
        '--backup_boundary',
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify({
          name: fileName,
          parents: [Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') || 'root'],
        }),
        '--backup_boundary',
        'Content-Type: application/json',
        '',
        backupContent,
        '--backup_boundary--',
      ].join('\r\n'),
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadResult)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup completed successfully',
        fileId: uploadResult.id,
        fileName: fileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
