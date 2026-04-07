import { db } from "@/lib/db";
import { lookupCollegeByEmail, type CollegeInfo } from "@/lib/college-domain-map";

/**
 * Resolve an Organization from a user's email domain.
 *
 * 1. Extract domain from email
 * 2. Look up in the college-domain-map
 * 3. If found → findOrCreate the Organization in DB
 * 4. If not found → return null (unknown college)
 *
 * Returns the organization ID or null.
 */
export async function resolveOrgFromEmail(
  email: string
): Promise<{ orgId: string; college: CollegeInfo } | null> {
  const college = lookupCollegeByEmail(email);
  if (!college) return null;

  // Try to find existing org by slug
  let org = await db.organization.findUnique({
    where: { slug: college.slug },
  });

  if (!org) {
    // Also check by name (handles orgs created before this mapping existed,
    // e.g. the original "IET Lucknow" org)
    org = await db.organization.findFirst({
      where: { name: college.name },
    });

    if (org && org.slug !== college.slug) {
      // Update slug to match our canonical mapping
      org = await db.organization.update({
        where: { id: org.id },
        data: { slug: college.slug },
      });
    }
  }

  if (!org) {
    // Create new organization
    org = await db.organization.create({
      data: {
        name: college.name,
        slug: college.slug,
        settings: JSON.stringify({
          city: college.city,
          type: college.type,
        }),
      },
    });
  }

  return { orgId: org.id, college };
}
