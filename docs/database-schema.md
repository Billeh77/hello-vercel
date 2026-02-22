# Supabase Database Schema Reference

This document contains the database schema details for the Supabase project.

## Connection Details

- **Project ID**: `qihsgnfjqmkjmoowyfbn`
- **Supabase URL**: `https://qihsgnfjqmkjmoowyfbn.supabase.co`
- **Image CDN**: `https://images.almostcrackd.ai/`

---

## Core Tables

### `captions`

Stores captions for images with vote counts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_datetime_utc` | timestamp | When caption was created |
| `modified_datetime_utc` | timestamp | Last modification time |
| `content` | text | The caption text |
| `is_public` | boolean | Whether caption is publicly visible |
| `profile_id` | UUID | FK to profiles - who created the caption |
| `image_id` | UUID | FK to images table |
| `humor_flavor_id` | integer | FK to humor_flavors (nullable) |
| `is_featured` | boolean | Shows on landing page if true |
| `caption_request_id` | integer | FK to caption_requests (nullable) |
| `like_count` | integer | Aggregated vote count |
| `llm_prompt_chain_id` | integer | FK to llm_prompt_chains (nullable) |

**Sample query:**
```sql
SELECT * FROM captions WHERE is_public = true ORDER BY created_datetime_utc DESC;
```

---

### `caption_votes`

Stores each upvote/downvote for each caption.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key (auto-increment) |
| `created_datetime_utc` | timestamp | When vote was cast |
| `modified_datetime_utc` | timestamp | Last modification time |
| `vote_value` | integer | 1 for upvote, -1 for downvote |
| `profile_id` | UUID | FK to profiles - who voted |
| `caption_id` | UUID | FK to captions - which caption |

**Sample query:**
```sql
INSERT INTO caption_votes (caption_id, profile_id, vote_value, created_datetime_utc, modified_datetime_utc)
VALUES ('uuid', 'user-uuid', 1, NOW(), NOW());
```

---

### `images`

Stores image metadata and URLs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_datetime_utc` | timestamp | When image was uploaded |
| `modified_datetime_utc` | timestamp | Last modification time |
| `url` | text | Full URL to image (e.g., `https://images.almostcrackd.ai/{profile_id}/{image_id}.jpeg`) |
| `is_common_use` | boolean | Whether image is for common/shared use |
| `profile_id` | UUID | FK to profiles - who uploaded |
| `additional_context` | text | Extra context about the image |
| `is_public` | boolean | Whether image is publicly visible |
| `image_description` | text | AI-generated description of the image |
| `celebrity_recognition` | jsonb | Celebrity detection results |
| `embedding` | vector | Image embedding for similarity search |

**Image URL Pattern:**
```
https://images.almostcrackd.ai/{profile_id}/{image_id}.{extension}
```

---

### `profiles`

User profiles linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (matches auth.users.id) |
| `created_datetime_utc` | timestamp | Account creation time |
| `modified_datetime_utc` | timestamp | Last modification time |
| `first_name` | text | User's first name |
| `last_name` | text | User's last name |
| `email` | text | User's email |
| `is_superadmin` | boolean | Admin privileges |
| `is_in_study` | boolean | Part of research study |
| `is_matrix_admin` | boolean | Matrix admin role |

---

### `universities`

List of universities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | University name |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

---

### `university_majors`

List of academic majors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Major name |

---

## Humor & Content Tables

### `humor_flavors`

Different styles/types of humor.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `created_datetime_utc` | timestamp | Creation time |
| `description` | text | Description of humor style |
| `slug` | text | URL-friendly identifier |

---

### `humor_themes`

Themes for humor categorization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `created_datetime_utc` | timestamp | Creation time |
| `name` | text | Theme name |
| `description` | text | Theme description |

---

### `caption_examples`

Examples of good captions for few-shot learning.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_datetime_utc` | timestamp | Creation time |
| `modified_datetime_utc` | timestamp | Last update |
| `image_description` | text | Description of example image |
| `caption` | text | The example caption |
| `explanation` | text | Why this caption is good |
| `priority` | integer | Display order priority |
| `image_id` | UUID | FK to images (nullable) |

---

## Common Joins

### Captions with Images

```typescript
const { data } = await supabase
  .from('captions')
  .select(`
    id,
    content,
    like_count,
    images (
      id,
      url,
      image_description
    )
  `)
  .eq('is_public', true)
  .order('created_datetime_utc', { ascending: false });
```

### User's Votes

```typescript
const { data } = await supabase
  .from('caption_votes')
  .select('caption_id, vote_value')
  .eq('profile_id', userId);
```

---

## All Available Tables

From the REST API schema, these tables exist:

- `allowed_signup_domains`
- `bug_reports`
- `caption_examples`
- `caption_likes` (bookmarks)
- `caption_requests`
- `caption_saved` (deprecated)
- `caption_votes`
- `captions`
- `common_use_categories`
- `common_use_category_image_mappings`
- `communities`
- `community_context_tag_mappings`
- `community_context_tags`
- `community_contexts`
- `dorms`
- `humor_flavor_mix`
- `humor_flavor_step_types`
- `humor_flavor_steps`
- `humor_flavor_theme_mappings`
- `humor_flavors`
- `humor_themes`
- `images`
- `invitations`
- `link_redirects`
- `llm_input_types`
- `llm_model_responses`
- `llm_models`
- `llm_output_types`
- `llm_prompt_chains`
- `llm_providers`
- `news_entities`
- `news_snippets`
- `personalities`
- `profile_dorm_mappings`
- `profile_university_major_mappings`
- `profile_university_mappings`
- `profiles`
- `reported_captions`
- `reported_images`
- `screenshots`
- `share_to_destinations`
- `shares`
- `sidechat_posts`
- `studies`
- `study_caption_mappings`
- `study_image_set_image_mappings`
- `study_image_sets`
- `term_types`
- `terms`
- `testflight_errors`
- `transcript_personality_mappings`
- `transcripts`
- `universities`
- `university_major_mappings`
- `university_majors`

---

## RPC Functions Available

- `can_access_caption`
- `can_access_invitation_by_token`
- `check_unique_image_report`
- `can_access_image`
- `is_superadmin`
- `match_community_contexts`
- `increment_link_visit_count`
- `smart_deactivate_news`
- `is_valid_category_image_mapping`
- `cleanup_expired_invitations`

---

## Notes

- Images are stored externally at `images.almostcrackd.ai`, not in Supabase Storage
- Most tables have Row Level Security (RLS) enabled
- The `profiles` table is linked to Supabase Auth users via `id`
- Vote values: `1` = upvote, `-1` = downvote
- Timestamps use UTC timezone
