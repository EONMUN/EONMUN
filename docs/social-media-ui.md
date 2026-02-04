# Social Media Metadata UI Documentation

## Admin Post Form - New Section

When creating or editing a post in `/admin/posts/new` or `/admin/posts/edit/[slug]`, admins will now see a new section at the bottom of the form (above the action buttons):

```
┌─────────────────────────────────────────────────────────────┐
│ Social Media Guidelines                                      │
├─────────────────────────────────────────────────────────────┤
│ Provide guidelines and metadata for sharing this post on    │
│ social media platforms.                                      │
│                                                              │
│ X (Twitter)                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Guidelines for X (Twitter) posts. Note: Consider        │ │
│ │ creating tweet threads rather than linking back...      │ │
│ │                                                          │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ For X: Create tweet threads instead of linking directly     │
│ to avoid penalties. Include thread structure and key         │
│ talking points.                                              │
│                                                              │
│ Instagram                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Guidelines for Instagram posts. Include caption         │ │
│ │ suggestions, hashtags, image requirements...            │ │
│ │                                                          │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Include caption, hashtags, visual requirements, and any      │
│ story/reel suggestions.                                      │
│                                                              │
│ Threads                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Guidelines for Threads posts. Include post structure,   │ │
│ │ tone, and any specific linking strategy.                │ │
│ │                                                          │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Provide post structure, tone guidelines, and engagement      │
│ strategies for Threads.                                      │
└─────────────────────────────────────────────────────────────┘
```

## Field Details

### 1. X (Twitter) Field
- **Label**: "X (Twitter)"
- **Input Type**: Textarea (4 rows)
- **Placeholder**: "Guidelines for X (Twitter) posts. Note: Consider creating tweet threads rather than linking back (avoids penalties). Include suggested thread structure, key points, and hashtags."
- **Helper Text**: "For X: Create tweet threads instead of linking directly to avoid penalties. Include thread structure and key talking points."
- **Database Field**: `socialMetaX` (text, nullable)

### 2. Instagram Field
- **Label**: "Instagram"
- **Input Type**: Textarea (4 rows)
- **Placeholder**: "Guidelines for Instagram posts. Include caption suggestions, hashtags, image requirements, and story ideas."
- **Helper Text**: "Include caption, hashtags, visual requirements, and any story/reel suggestions."
- **Database Field**: `socialMetaInstagram` (text, nullable)

### 3. Threads Field
- **Label**: "Threads"
- **Input Type**: Textarea (4 rows)
- **Placeholder**: "Guidelines for Threads posts. Include post structure, tone, and any specific linking strategy."
- **Helper Text**: "Provide post structure, tone guidelines, and engagement strategies for Threads."
- **Database Field**: `socialMetaThreads` (text, nullable)

## Styling
- Section has top border and padding to separate from other form sections
- Uses consistent Tailwind CSS classes matching the rest of the form
- Textareas use monospace font for better readability of structured content
- All fields have proper focus states with ring styling
- Helper text is smaller and uses muted color scheme

## User Experience
- All fields are optional - users can skip them entirely
- Fields are preserved when editing existing posts
- Empty fields are saved as null in the database
- Form validation doesn't block submission if social media fields are empty
- Section is positioned logically at the end of content-related fields, before action buttons

## Example Use Case

When creating a post about a new artwork collection:

**X (Twitter) Field:**
```
Thread structure:
1/ 🎨 Excited to announce my new collection "Urban Dreams"
2/ This collection explores the intersection of nature and city life
3/ Each piece captures a moment of serenity in urban chaos
4/ Available now at [website] #contemporaryart #urbanart

Key hashtags: #contemporaryart #urbanart #fineart
Tone: Enthusiastic but professional
```

**Instagram Field:**
```
Caption: ✨ Introducing "Urban Dreams" - my latest collection exploring the hidden beauty of city life. Swipe to see the full series →

Hashtags: #contemporaryart #urbanart #fineart #artcollection #artistsoninstagram

Visual: Use carousel post with all artworks
Story: Behind-the-scenes shots of studio work
```

**Threads Field:**
```
Opening post: Just launched my new "Urban Dreams" collection! 
Follow-up: Each piece in this series captures those quiet moments you find in busy cities
CTA: Full collection linked in bio
Tone: Conversational and approachable
```
