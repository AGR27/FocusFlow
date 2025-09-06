// src/app/api/google-classroom/classes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google, classroom_v1, } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
// NEW: Import the correct, updated server client creator
import { createClient } from '@/utils/supabase/server'; 
// import type { ClassItem } from '@/types'; // Ensure your ClassItem type is imported

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // Used to re-initialize OAuth2 client

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  throw new Error('Missing Google Classroom API environment variables for task fetching.');
}

export async function GET(_req: NextRequest) {
  // Suppress unused parameter warning for Vercel build
  void _req;
  // Use the new, async createClient() function
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // If the user is not authenticated with your Supabase app, they cannot import tasks.
    return NextResponse.json({ message: 'Authentication required to import classes.' }, { status: 401 });
  }

  try {
    // 1. Retrieve the user's Google Classroom tokens from your Supabase DB
    const { data: tokenData, error: tokenError } = await supabase
      .from('integration_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google_classroom')
      .single();

    if (tokenError || !tokenData || !tokenData.access_token) {
      // If no tokens or access token is missing, tell the client to re-authenticate
      return NextResponse.json(
        { message: 'Google Classroom not connected or token expired. Please re-connect.' },
        { status: 401 }
      );
    }

    // 2. Initialize OAuth2 client with the retrieved tokens
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : undefined,
    });

    // 3. Handle token refreshing if needed
    // The googleapis library's oauth2Client automatically attempts to use the refresh token
    // if the access token is expired. We just need to update it in our DB if it changes.
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token || tokens.refresh_token) {
        console.log('Google Classroom tokens refreshed.');
        // Use the new, async createClient() function for the update call as well
        const supabaseUpdate = await createClient(); 
        const { error: updateError } = await supabaseUpdate
          .from('integration_tokens')
          .update({
            access_token: tokens.access_token || tokenData.access_token,
            refresh_token: tokens.refresh_token || tokenData.refresh_token,
            expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : tokenData.expires_at,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('provider', 'google_classroom');
        if (updateError) console.error('Failed to update Google Classroom tokens after refresh:', updateError);
      }
    });

    // 4. Use Google Classroom API client
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

    let allCourses: classroom_v1.Schema$Course[] = [];
    let pageToken: string | undefined = undefined;

    // type ClassListResponse = Awaited<ReturnType<typeof classroom['courses']['list']>>;

    do {
      const classList = await classroom.courses.list({
      pageToken: pageToken,
      courseStates: ['ACTIVE', 'PROVISIONED', 'ARCHIVED'],
    }) as unknown as GaxiosResponse<classroom_v1.Schema$ListCoursesResponse>;

      if (classList.data.courses) {
        allCourses = allCourses.concat(classList.data.courses);
      }
      pageToken = classList.data.nextPageToken || undefined;
    } while (pageToken);

    // Process and upsert courses into your Supabase 'classes' table
    const classesToUpsert = await Promise.all(allCourses.map(async (course) => {
      // Check if a class with this source_id already exists in Supabase
      const { data: existingClass, error: existingClassError } = await supabase
        .from('classes')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', 'google_classroom')
        .eq('source_id', course.id)
        .single();

      if (existingClassError && existingClassError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error('Error checking for existing class:', existingClassError);
        // Decide how to handle this error: skip, rethrow, etc. For now, we'll log and assume it's not a fatal error for the loop
      }

      // If existingClass is found, we'll update it. Otherwise, insert a new one.
      // We will ensure the 'name' is never null.
      const classData = {
        name: course.name || 'Untitled Class', // Provide fallback for null name
        meeting_times: course.section || null, // Often 'section' field in GC maps to meeting times/section name
        location: course.room || null, // 'room' field in GC
        user_id: user.id,
        source: 'google_classroom',
        source_id: course.id, // Google Classroom's course ID
        source_url: course.alternateLink || null, // Link to the course in GC
      };

      if (existingClass) {
        // Update existing class
        const { error: updateError } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', existingClass.id)
          .eq('user_id', user.id); // Ensure user owns it
        if (updateError) {
          console.error(`Error updating class ${existingClass.id}:`, updateError);
        }
        return { ...classData, id: existingClass.id }; // Return updated data
      } else {
        // Insert new class
        const { data: newClass, error: insertError } = await supabase
          .from('classes')
          .insert(classData)
          .select('id')
          .single(); // Select the newly generated ID
        if (insertError) {
          console.error(`Error inserting new class ${course.id}:`, insertError);
        }
        return { ...classData, id: newClass?.id }; // Return newly inserted data with its ID
      }
    }));

    return NextResponse.json({
      message: 'Google Classroom classes imported/updated successfully.',
      importedClasses: classesToUpsert.filter(Boolean), // Filter out any null/undefined from failed upserts
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error importing Google Classroom classes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to import Google Classroom classes: ' + errorMessage }, { status: 500 });
  }
}

