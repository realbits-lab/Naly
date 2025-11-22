# Guest Interactions Guide

This guide explains how to use the like button and reply/comment features with anonymous guest sessions.

## Overview

The application now supports anonymous guest interactions, allowing users to:
- Like content without creating an account
- Write replies/comments without creating an account
- Automatically receive an anonymous session on page visit
- Optionally convert their anonymous session to a full account later

## Components

### 1. LikeButton
Located: `src/components/interactions/like-button.tsx`

A toggleable like button that works with both authenticated and anonymous users.

**Features:**
- Heart icon that fills when liked
- Like count display
- Optimistic updates for instant feedback
- Automatic session detection
- Loading states

**Usage:**
```tsx
import { LikeButton } from "@/components/interactions";

<LikeButton
  contentId="article-123"
  initialLiked={false}
  initialCount={42}
/>
```

**Props:**
- `contentId` (required): The ID of the content being liked
- `initialLiked` (optional): Whether user has already liked (default: false)
- `initialCount` (optional): Initial like count (default: 0)

### 2. ReplyForm
Located: `src/components/interactions/reply-form.tsx`

A form for submitting replies/comments.

**Features:**
- Single-line input with send button
- Character limit (500 chars)
- Anonymous user indicator
- Loading states and error handling
- Callback on successful submission

**Usage:**
```tsx
import { ReplyForm } from "@/components/interactions";

<ReplyForm
  contentId="article-123"
  onReplySubmitted={() => console.log("Reply posted!")}
  placeholder="Share your thoughts..."
/>
```

**Props:**
- `contentId` (required): The ID of the content being replied to
- `onReplySubmitted` (optional): Callback fired after successful reply
- `parentReplyId` (optional): For nested replies (not yet implemented)
- `placeholder` (optional): Input placeholder text

### 3. RepliesList
Located: `src/components/interactions/replies-list.tsx`

Displays all replies/comments for a piece of content.

**Features:**
- Lists all replies with user info
- Shows "Anonymous User" for guests
- Guest badge for anonymous users
- Relative timestamps
- Loading and error states
- Empty state message

**Usage:**
```tsx
import { RepliesList } from "@/components/interactions";

<RepliesList
  contentId="article-123"
  refreshTrigger={0}
/>
```

**Props:**
- `contentId` (required): The ID of the content
- `refreshTrigger` (optional): Increment to force refresh

### 4. ContentInteractions (All-in-One)
Located: `src/components/interactions/content-interactions.tsx`

Combines like button and reply functionality into one component.

**Features:**
- Like button with count
- Reply button with count
- Expandable reply section
- Auto-refresh on new replies
- Clean, unified UI

**Usage:**
```tsx
import { ContentInteractions } from "@/components/interactions";

<ContentInteractions
  contentId="article-123"
  initialLikeCount={42}
  initialReplyCount={15}
  initialLiked={false}
/>
```

**Props:**
- `contentId` (required): The ID of the content
- `initialLikeCount` (optional): Initial like count
- `initialReplyCount` (optional): Initial reply count
- `initialLiked` (optional): Whether user already liked

## Integration with ContentCard

The `ContentCard` component has been updated to include interactions:

```tsx
import { ContentCard } from "@/components/feed/content-card";

<ContentCard
  card={contentCardData}
  showInteractions={true}  // Set to false to hide
/>
```

The interactions appear at the bottom of each content card, separated by a border.

## How Anonymous Sessions Work

### Session Creation
1. User visits any page
2. `SessionProvider` component detects no session
3. Automatically calls `signIn.anonymous()` via better-auth
4. User gets a session with `isAnonymous: true`
5. User can now interact with content

### Session Flow
```
Visit Site → Auto Anonymous Session → Like/Reply → Data Saved
                                           ↓
                           (Optional) Sign Up → Convert to Full Account
```

### Backend Session Check
All interaction endpoints check for a valid session:

```typescript
const session = await auth.api.getSession({ headers });

if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Use session.user.isAnonymous to check if guest
```

## API Endpoints

### Likes

**Toggle Like**
```http
POST /api/likes
Content-Type: application/json

{
  "contentId": "article-123"
}

Response:
{
  "liked": true
}
```

**Get Like Status**
```http
GET /api/likes?contentId=article-123

Response:
{
  "count": 42,
  "liked": true
}
```

### Replies

**Create Reply**
```http
POST /api/replies
Content-Type: application/json

{
  "contentId": "article-123",
  "content": "Great article!",
  "parentReplyId": null
}

Response:
{
  "reply": {
    "id": "...",
    "contentId": "article-123",
    "userId": "...",
    "content": "Great article!",
    "createdAt": "..."
  },
  "user": {
    "id": "...",
    "name": "Anonymous",
    "isAnonymous": true
  }
}
```

**Get Replies**
```http
GET /api/replies?contentId=article-123

Response:
{
  "replies": [
    {
      "id": "...",
      "content": "Great article!",
      "createdAt": "...",
      "user": {
        "name": "Anonymous User",
        "isAnonymous": true
      }
    }
  ],
  "count": 1
}
```

## Database Schema

### Likes Table
```sql
CREATE TABLE "likes" (
  "content_id" text NOT NULL,
  "user_id" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  PRIMARY KEY ("user_id", "content_id")
);
```

Composite primary key ensures one like per user per content.

### Replies Table
```sql
CREATE TABLE "replies" (
  "id" text PRIMARY KEY,
  "content_id" text NOT NULL,
  "user_id" text NOT NULL,
  "content" text NOT NULL,
  "parent_reply_id" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
```

Supports nested replies via `parent_reply_id`.

## Styling

All components use Tailwind CSS with a consistent design:

**Colors:**
- Primary (Like/Active): Pink (`pink-600`, `pink-100`)
- Secondary (Reply/Neutral): Gray (`gray-600`, `gray-100`)
- Accent (Links/Actions): Indigo (`indigo-600`)

**Icons:**
- Using `lucide-react` for consistent iconography
- Heart for likes (filled when active)
- MessageCircle for replies
- Send for submit
- User for anonymous avatars

## Best Practices

### 1. Optimistic Updates
The LikeButton uses optimistic updates for better UX:
```typescript
// Update UI immediately
setLiked(!liked);
setCount(newCount);

// Then make API call
await fetch('/api/likes', { ... });

// Revert on error
if (!response.ok) {
  setLiked(liked);
  setCount(count);
}
```

### 2. Error Handling
All components handle errors gracefully:
- Show error messages
- Provide retry options
- Don't crash on network failures

### 3. Loading States
All interactive components show loading states:
- Disabled buttons during operations
- Loading spinners for lists
- Visual feedback for actions

### 4. Accessibility
Components include ARIA labels and semantic HTML:
```tsx
<button aria-label={liked ? "Unlike" : "Like"}>
```

## Security Considerations

### Rate Limiting
Consider implementing rate limiting for anonymous users:
- Limit likes per IP/session
- Limit replies per hour
- Prevent spam

### Content Moderation
For anonymous replies, consider:
- Profanity filters
- Spam detection
- Manual moderation queue
- Report functionality

### Session Security
- Anonymous sessions expire after 7 days
- Sessions are tied to cookies
- CSRF protection via better-auth

## Future Enhancements

Potential features to add:
1. **Nested Replies** - Full reply threading
2. **Reply Reactions** - Like replies themselves
3. **Edit/Delete** - Let users modify their content
4. **Real-time Updates** - WebSocket for live updates
5. **Notifications** - Notify on replies to your comments
6. **Moderation Tools** - Flag/hide inappropriate content
7. **User Profiles** - See all likes/replies by a user
8. **Anonymous to Auth Conversion** - Preserve data when upgrading

## Testing

To test the interactions:

1. **Test Anonymous Session**
   - Open incognito window
   - Visit homepage
   - Check DevTools → Application → Cookies
   - Should see better-auth session cookie

2. **Test Like**
   - Click heart icon
   - Should fill and increment count
   - Refresh page - state should persist

3. **Test Reply**
   - Type comment and submit
   - Should appear in list immediately
   - Should show "Anonymous User" badge

4. **Test Persistence**
   - Interact as guest
   - Sign up for account
   - Check if interactions persist (TBD)

## Troubleshooting

**Issue: Likes not working**
- Check session exists (DevTools → Application → Cookies)
- Check browser console for errors
- Verify `/api/likes` endpoint is accessible

**Issue: Anonymous session not created**
- Check `SessionProvider` is in app layout
- Check better-auth configuration
- Verify `BETTER_AUTH_SECRET` is set

**Issue: Replies not showing**
- Check database has user data joined
- Verify `/api/replies` returns user object
- Check for CORS errors

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migrations ran successfully
3. Check better-auth session cookie exists
4. Review API response in Network tab
