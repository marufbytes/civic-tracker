'use server';

import { db } from './lib/db';
import { comments, issues, spamFlags } from '../db/schema';
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { CATEGORIES, SEVERITIES, STATUSES } from '../lib/constants';
import { getCurrentUser } from '../lib/session';
import { validUploadUrl } from '../lib/uploads';

export type ActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  /** True when the action failed because the visitor is not logged in. */
  authRequired?: boolean;
};

function fail(message: string, fieldErrors?: Record<string, string>): ActionResult {
  return { success: false, message, fieldErrors };
}

const LOGIN_REQUIRED: ActionResult = { success: false, message: 'Please log in to continue.', authRequired: true };

export async function createIssue(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? '');
  const severity = String(formData.get('severity') ?? 'Medium');
  const latitude = parseFloat(String(formData.get('latitude') ?? ''));
  const longitude = parseFloat(String(formData.get('longitude') ?? ''));
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();
  const locationName = String(formData.get('locationName') ?? '').trim();

  const errors: Record<string, string> = {};
  if (title.length < 3 || title.length > 120) errors.title = 'Title must be 3-120 characters.';
  if (description.length < 10 || description.length > 2000)
    errors.description = 'Description must be 10-2000 characters.';
  if (!(CATEGORIES as readonly string[]).includes(category)) errors.category = 'Invalid category.';
  if (!(SEVERITIES as readonly string[]).includes(severity)) errors.severity = 'Invalid severity.';
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    errors.latitude = 'Latitude must be between -90 and 90.';
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    errors.longitude = 'Longitude must be between -180 and 180.';
  if (locationName.length > 150) errors.locationName = 'Location name is too long (150 characters max).';
  if (!imageUrl) errors.image = 'A photo is required to submit a report.';
  else if (!(await validUploadUrl(imageUrl))) errors.image = 'Uploaded photo is invalid. Please upload it again.';
  if (Object.keys(errors).length > 0) return fail('Please fix the highlighted fields.', errors);

  try {
    await db.insert(issues).values({
      title,
      description,
      category,
      severity,
      latitude,
      longitude,
      imageUrl,
      locationName: locationName || null,
      userId: user.id,
      authorName: user.name,
    });
  } catch (e) {
    console.error('createIssue failed', e);
    return fail('Could not save the report. Please try again.');
  }

  revalidatePath('/');
  return { success: true, message: 'Issue reported successfully!' };
}

export async function upvoteIssue(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (!Number.isInteger(id)) return fail('Invalid issue id.');
  try {
    const res = await db
      .update(issues)
      .set({ upvotes: sql`${issues.upvotes} + 1` })
      .where(eq(issues.id, id))
      .returning({ id: issues.id });
    if (res.length === 0) return fail('Issue not found.');
  } catch (e) {
    console.error('upvoteIssue failed', e);
    return fail('Could not register your upvote.');
  }
  revalidatePath('/');
  return { success: true, message: 'Upvoted!' };
}

/** Each user can cast one spam vote per report. Votes never hide the report. */
export async function flagSpam(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (!Number.isInteger(id)) return fail('Invalid issue id.');

  try {
    const flagged = await db
      .insert(spamFlags)
      .values({ issueId: id, userId: user.id })
      .onConflictDoNothing()
      .returning({ id: spamFlags.id });
    if (flagged.length === 0) return fail('You already reported this issue as spam.');

    const [issue] = await db
      .update(issues)
      .set({ spamCount: sql`${issues.spamCount} + 1` })
      .where(eq(issues.id, id))
      .returning({ spamCount: issues.spamCount });
    if (!issue) return fail('Issue not found.');
  } catch (e) {
    console.error('flagSpam failed', e);
    return fail('Could not report this issue.');
  }

  revalidatePath('/');
  return { success: true, message: 'Thanks, the report was flagged as spam.' };
}

/** Admin only. Makes a previously unapproved report public again. */
export async function approveIssue(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (user.role !== 'admin') return fail('Only admins can approve reports.');

  await db.update(issues).set({ isApproved: true }).where(eq(issues.id, id));
  revalidatePath('/');
  return { success: true, message: 'Report approved.' };
}

export async function addComment(issueId: number, text: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;

  text = text.trim();
  if (text.length < 2 || text.length > 500) return fail('Comment must be 2-500 characters.');

  try {
    await db.insert(comments).values({ issueId, userId: user.id, authorName: user.name, text });
  } catch (e) {
    console.error('addComment failed', e);
    return fail('Could not post your comment.');
  }
  revalidatePath('/');
  return { success: true, message: 'Comment posted.' };
}
/** Admin only. Marking an issue Resolved requires an "after" photo (uploaded via /api/upload). */
export async function updateIssueStatus(
  id: number,
  newStatus: string,
  afterImageUrl?: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (user.role !== 'admin') return fail('Only admins can change issue status.');
  if (!Number.isInteger(id)) return fail('Invalid issue id.');
  if (!(STATUSES as readonly string[]).includes(newStatus)) return fail('Invalid status.');

  try {
    const [current] = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
    if (!current) return fail('Issue not found.');

    let after: string | null = null;
    if (newStatus === 'Resolved') {
      after = afterImageUrl || current.afterImageUrl;
      if (!after) return fail('Upload an "After" photo as proof before resolving.');
      if (afterImageUrl && !(await validUploadUrl(afterImageUrl))) return fail('Uploaded photo is invalid.');
    }

    await db.update(issues).set({ status: newStatus, afterImageUrl: after }).where(eq(issues.id, id));
  } catch (e) {
    console.error('updateIssueStatus failed', e);
    return fail('Could not update status.');
  }
  revalidatePath('/');
  return { success: true, message: `Status changed to ${newStatus}.` };
}

/** Admins can delete any issue; normal users only their own. */
export async function deleteIssue(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (!Number.isInteger(id)) return fail('Invalid issue id.');
  try {
    const where = user.role === 'admin' ? eq(issues.id, id) : and(eq(issues.id, id), eq(issues.userId, user.id));
    const res = await db.delete(issues).where(where).returning({ id: issues.id });
    if (res.length === 0) return fail('Issue not found or you are not allowed to delete it.');
  } catch (e) {
    console.error('deleteIssue failed', e);
    return fail('Could not delete the issue.');
  }
  revalidatePath('/');
  return { success: true, message: 'Issue deleted.' };
}

