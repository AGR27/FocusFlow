// src/app/api/google-classroom/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google, classroom_v1, } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
// NEW: Import the correct, updated server client creator
import { createClient } from '@/utils/supabase/server'; 
import type { TaskItem, ClassItem } from '@/types'; // Ensure your TaskItem type is imported

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // Used to re-initialize OAuth2 client

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  throw new Error('Missing Google Classroom API environment variables for task fetching.');
}

export async function GET(_req: NextRequest) {
  // Use the new, async createClient() function
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // If the user is not authenticated with your Supabase app, they cannot import tasks.
    return NextResponse.json({ message: 'Authentication required to import tasks.' }, { status: 401 });
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

    const importedTasks: TaskItem[] = [];
    const importedClasses: ClassItem[] = [];

    // --- Fetch and Upsert Classes (Courses) ---
    const allCourses: classroom_v1.Schema$Course[] = [];
    let coursesPageToken: string | undefined = undefined;

    do {
      const coursesResponse = await classroom.courses.list({
        studentId: 'me',
        courseStates: ['ACTIVE', 'PROVISIONED'], // Include provisioned classes too
        pageToken: coursesPageToken,
      }) as unknown as GaxiosResponse<classroom_v1.Schema$ListCoursesResponse>; // Cast to GaxiosResponse

      if (coursesResponse.data.courses) {
        allCourses.push(...coursesResponse.data.courses);
      }
      coursesPageToken = coursesResponse.data.nextPageToken || undefined;
    } while (coursesPageToken);

    // Upsert each fetched course into your Supabase 'classes' table
    for (const course of allCourses) {
      if (!course.id) continue;

      const newClass: ClassItem = {
        id: '', // Will be set by database
        name: course.name || 'Untitled Class',
        meeting_times: course.section || undefined,
        location: course.room || undefined,
        user_id: user.id,
        source: 'google_classroom',
        source_id: course.id,
        source_url: course.alternateLink || undefined,
      };

      // Check if class already exists in Supabase
      const { data: existingClass, error: existingClassError } = await supabase
        .from('classes')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', 'google_classroom')
        .eq('source_id', course.id)
        .single();

      let localClassId: string;
      if (existingClass && !existingClassError) {
        // Class exists, update it
        localClassId = existingClass.id;
        const { error: updateError } = await supabase
          .from('classes')
          .update(newClass) // Update with new data
          .eq('id', localClassId);
        if (updateError) console.error(`Error updating class ${course.id}:`, updateError);
      } else {
        // Class does not exist, insert it
        const { data: insertedClass, error: insertError } = await supabase
          .from('classes')
          .insert(newClass)
          .select('id') // Select the ID of the newly inserted row
          .single();
        if (insertError) {
          console.error(`Error inserting new class ${course.id}:`, insertError);
          continue; // Skip processing tasks for this class if insertion fails
        }
        localClassId = insertedClass.id;
      }
      importedClasses.push({ ...newClass, id: localClassId }); // Add to tracking array if needed for response

      // --- Fetch and Process Coursework (Tasks) for this Class ---
      const allCourseWork: classroom_v1.Schema$CourseWork[] = [];
      let courseWorkPageToken: string | undefined = undefined;

      do {
        const courseworkResponse = await classroom.courses.courseWork.list({
          courseId: course.id,
          courseWorkStates: ['PUBLISHED'], // Only fetch published coursework
          pageToken: courseWorkPageToken,
        }) as unknown as GaxiosResponse<classroom_v1.Schema$ListCourseWorkResponse>;

        if (courseworkResponse.data.courseWork) {
          allCourseWork.push(...courseworkResponse.data.courseWork);
        }
        courseWorkPageToken = courseworkResponse.data.nextPageToken || undefined;
      } while (courseWorkPageToken);

      for (const work of allCourseWork) {
        if (work.id && work.title) {
          const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
            courseId: course.id,
            courseWorkId: work.id,
            userId: 'me', 
          });
          const submissions = submissionsResponse.data.studentSubmissions || [];
          
          const isTurnedIn = submissions.some(sub => sub.state === 'TURNED_IN' || sub.state === 'GRADED' || sub.state === 'RECLAIMED_BY_STUDENT');

          if (!isTurnedIn) {
            const dueDate = work.dueDate;
            const dueTime = work.dueTime; 

            let fullDueDate: string | null = null;
            if (dueDate && dueDate.year && dueDate.month && dueDate.day) {
                const date = new Date(dueDate.year, dueDate.month - 1, dueDate.day);
                if (dueTime) { // Check if dueTime object exists
                    date.setHours(dueTime.hours || 0, dueTime.minutes || 0);
                } else {
                    date.setHours(23, 59, 59); // Default to end of day if no specific time
                }
                fullDueDate = date.toISOString();
            }

            const newTask: TaskItem = {
              id: '', // Will be set by database
              name: work.title,
              due_date_time: fullDueDate,
              class_id: localClassId, // Link to the Supabase class ID!
              user_id: user.id, 
              priority: 'medium', // Default priority, Google doesn't provide this
              type: work.workType === 'ASSIGNMENT' ? 'Assignment' : (work.workType === 'QUIZ' ? 'Quiz' : 'Other'),
              source: 'google-classroom',
              source_id: work.id, // Store Google's unique ID
              source_url: work.alternateLink || undefined,
            };

            // Add the task to the list for batch upsert or individual upsert
            importedTasks.push(newTask);
          }
        }
      }
    }

    // --- Upsert all collected tasks into Supabase 'tasks' table ---
    const successfullyUpsertedTasks: TaskItem[] = [];
    for (const task of importedTasks) {
      const { data: existingTask, error: existingTaskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', task.source)
        .eq('source_id', task.source_id)
        .single();

      if (existingTask && !existingTaskError) {
        // Task exists, update it
        const { error: updateTaskError } = await supabase
          .from('tasks')
          .update(task)
          .eq('id', existingTask.id);
        if (updateTaskError) {
          console.error(`Error updating task ${task.source_id}:`, updateTaskError);
        } else {
          successfullyUpsertedTasks.push({ ...task, id: existingTask.id });
        }
      } else {
        // Task does not exist, insert it
        const { data: insertedTask, error: insertTaskError } = await supabase
          .from('tasks')
          .insert(task)
          .select('id')
          .single();
        if (insertTaskError) {
          console.error(`Error inserting task ${task.source_id}:`, insertTaskError);
        } else {
          successfullyUpsertedTasks.push({ ...task, id: insertedTask.id });
        }
      }
    }

    if (successfullyUpsertedTasks.length === 0) {
        return NextResponse.json({ message: 'No new tasks found or all existing tasks are turned in.' }, { status: 200 });
    }

    return NextResponse.json({ 
        message: `Successfully imported/updated ${successfullyUpsertedTasks.length} tasks and ${importedClasses.length} classes.`,
        tasks: successfullyUpsertedTasks 
    });

  } catch (error: unknown) {
    console.error('Error fetching/importing Google Classroom tasks:', error);
    // Return specific status code if re-authentication is likely needed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = error as any;
    if (errorMessage.includes('re-connect') || errorResponse?.response?.status === 401) {
        return NextResponse.json({ message: 'Google Classroom connection error. Please re-authenticate.' }, { status: 401 });
    }
    return NextResponse.json({ message: errorMessage || 'Failed to fetch Google Classroom tasks' }, { status: 500 });
  }
}
