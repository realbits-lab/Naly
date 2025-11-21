# Migration Guide: NextAuth to better-auth with Anonymous Sessions

This guide explains the migration from NextAuth to better-auth, including support for anonymous guest sessions.

## What Changed

### 1. Authentication Library
- **From**: NextAuth v5 (beta.30)
- **To**: better-auth v1.3.34

### 2. Key Features Added
- ✅ Anonymous/guest sessions - users can interact without signing up
- ✅ Guest users can write replies
- ✅ Guest users can like content
- ✅ Anonymous sessions can be converted to full accounts later

### 3. Database Schema Changes

New tables added:
- `user` - Better-auth user table (replaces `users`)
- `session` - Session management
- `account` - OAuth/provider accounts
- `verification` - Email verification tokens
- `replies` - User replies/comments on content
- `likes` - User likes on content

Legacy table kept for migration:
- `users` - Old user table (will be migrated)

## Migration Steps

### Step 1: Run Database Migrations

```bash
# Generate migration (already done)
npx drizzle-kit generate

# Push to database
npx drizzle-kit push
```

### Step 2: Migrate Existing Users

If you have existing users in the `users` table, run the migration script:

```bash
# Run the migration script
npx tsx scripts/migrate-users.ts
```

This will:
- Copy all users from old `users` table to new `user` table
- Preserve usernames and password hashes
- Mark all migrated users as non-anonymous

### Step 3: Environment Variables

Add this to your `.env.local`:

```env
# Required for better-auth
BETTER_AUTH_SECRET=<your-secret-key>
BETTER_AUTH_URL=http://localhost:3000

# For production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Generate a secret:
```bash
openssl rand -base64 32
```

### Step 4: Test the Migration

1. **Admin Login**: Try logging in at `/admin/login`
   - Should work with existing credentials (migrated users)

2. **Anonymous Sessions**: Visit the homepage
   - Should automatically create an anonymous session
   - Check browser dev tools → Application → Cookies

3. **Guest Interactions**:
   - Try liking content (should work for anonymous users)
   - Try writing a reply (should work for anonymous users)

## API Changes

### Authentication

**Before (NextAuth)**:
```typescript
import { auth } from '@/auth';
const session = await auth();
```

**After (better-auth)**:
```typescript
import { auth } from '@/lib/auth';
const session = await auth.api.getSession({ headers });
```

### Client-side Auth

**Before**:
```typescript
import { signIn, signOut } from 'next-auth/react';
```

**After**:
```typescript
import { signIn, signOut } from '@/lib/auth-client';
```

## New API Endpoints

### Auth
- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-in/anonymous` - Create anonymous session
- `POST /api/auth/sign-out` - Sign out

### Content Interactions
- `POST /api/likes` - Toggle like on content
- `GET /api/likes?contentId=x` - Get like status
- `POST /api/replies` - Create reply
- `GET /api/replies?contentId=x` - Get replies

## Anonymous Session Flow

1. User visits site → `SessionProvider` auto-creates anonymous session
2. User can like/reply as anonymous user
3. User data stored with `isAnonymous: true`
4. Later, user can convert to full account (preserving their likes/replies)

## Security Considerations

- Anonymous users are rate-limited per session
- All content interactions require a session (prevents abuse)
- Anonymous sessions expire after 7 days
- Admin routes require authenticated (non-anonymous) users
- Password hashes preserved during migration (bcrypt)

## Rollback Plan

If issues occur, you can rollback by:
1. Revert code changes to previous commit
2. The old `users` table is preserved
3. Drop new tables: `user`, `session`, `account`, `verification`, `likes`, `replies`

## Testing Checklist

- [ ] Admin login works with existing credentials
- [ ] Anonymous sessions created automatically
- [ ] Guest users can like content
- [ ] Guest users can write replies
- [ ] Like counts display correctly
- [ ] Reply counts display correctly
- [ ] Admin routes protected (no anonymous access)
- [ ] Sign out works correctly

## Support

For issues or questions:
1. Check the better-auth docs: https://better-auth.com
2. Check existing database schema in `src/db/schema.ts`
3. Review migration logs for errors

## Next Steps

After successful migration:
1. Monitor error logs for auth issues
2. Consider adding email verification
3. Add OAuth providers (Google, GitHub, etc.) if needed
4. Implement rate limiting for anonymous users
5. Add moderation tools for anonymous content
