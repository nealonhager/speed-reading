# Chapter Progress Strip Design

## Goal

Replace the reader's chapter sidebar with a compact top-of-reader chapter progress strip that shows completed, current, and upcoming chapters while preserving direct chapter navigation.

## Why

The sidebar gives access to chapter navigation, but it takes a large amount of space and separates chapter context from the main reading surface. A top progress strip keeps the chapter map visible inside the primary reader layout and better matches the mental model of reading through a book from left to right.

## Scope

This design covers the in-reader chapter navigation UI only.

In scope:
- Remove the dedicated chapter sidebar from the reader screen.
- Add a horizontal chapter progress strip near the top of the reader.
- Preserve direct click-to-jump chapter navigation.
- Show three chapter states: completed, current, upcoming.
- Show intra-chapter reading progress inside the active chapter segment.
- Preserve disabled styling for unreadable or skipped chapters.
- Update tests to validate the new strip behavior.

Out of scope:
- Changes to EPUB parsing or chapter extraction.
- Changes to playback controls beyond keeping previous/next chapter buttons.
- Multi-row chapter strip layouts.

## Recommended Approach

Implement a dedicated `ChapterProgressStrip` component rendered in the reader header area above the main reading surface.

Each chapter is represented as a horizontal segment:
- Completed chapters render as filled segments.
- The active chapter renders wider than the others and includes a partial fill that reflects token progress within that chapter.
- Upcoming chapters render as unfilled muted segments.
- Unavailable chapters render as disabled segments that remain visible but are not interactive.

Every available segment is clickable and jumps directly to that chapter.

## Component Design

### `ReaderScreen`

`ReaderScreen` remains the source of truth for:
- ordered sections
- active section id
- completed section ids
- current token index
- playback state

It will stop rendering the sidebar provider and chapter list, and instead compute chapter-strip view data for a child component.

### `ChapterProgressStrip`

Create a new `ChapterProgressStrip` component with a focused API:
- `chapters`
- `activeSectionId`
- `completedSectionIds`
- `activeChapterProgress`
- `onSelectChapter`

Each item should derive a visual state from existing reader state rather than storing its own state.

### Chapter segment model

Each rendered segment should be able to answer:
- is this chapter completed?
- is this chapter active?
- is this chapter available?
- what fill percentage should it display?

Rules:
- Completed chapter: `100%`
- Active chapter: current token progress clamped to `0-100%`
- Upcoming chapter: `0%`
- Unavailable chapter: `0%` plus disabled styling

## Data Flow

1. `ReaderScreen` determines the active section and current token progress from existing playback state.
2. `ReaderScreen` maps `chapters` into strip-friendly display data.
3. `ChapterProgressStrip` renders the ordered chapter segments.
4. Clicking a segment calls `onSelectChapter(sectionId)`.
5. `ReaderScreen` handles the selection by:
   - stopping playback
   - setting the active section id
   - resetting token index to the beginning of the selected section

No separate progress store is introduced.

## Interaction Details

### Navigation

- Clicking an available chapter segment jumps directly to that chapter.
- Clicking the active chapter is a no-op to avoid surprising resets.
- Previous and next chapter buttons remain in playback controls as secondary navigation.

### Visual behavior

- The strip stays on a single row.
- Inactive chapters compress to thin pill segments.
- The active chapter stays visually wider so its partial progress is easy to read.
- The strip should remain legible on smaller screens without reintroducing a full chapter drawer.

### Long books

For books with many chapters, keep all segments visible on one row by allowing inactive segments to shrink. The active segment should keep a minimum width larger than its neighbors so users can still identify where they are in the book.

## Error Handling And Edge Cases

- If there is no active section, render nothing, matching the current reader guard.
- If a chapter is unavailable, render it as disabled and ignore clicks.
- If tokenized content is empty or nearly empty, clamp active progress safely to avoid divide-by-zero behavior.
- If the current chapter is the first or last chapter, strip rendering should still work without any special casing beyond existing reader navigation guards.

## Testing

Replace sidebar-specific tests with chapter-strip tests that cover:
- active chapter segment is rendered correctly
- clicking a different available segment switches the reader and preview content
- unavailable chapters render disabled and do not navigate
- active chapter progress changes as reading advances
- completed chapters render with completed styling once marked complete

Testing should stay focused on user-visible behavior rather than implementation details.

## Implementation Notes

- Prefer small helper functions with explicit names for chapter state and progress calculations.
- Keep type signatures explicit for any derived chapter-strip view model.
- Avoid adding comments where naming can make the code self-explanatory.
- Preserve current reader layout and control behavior outside the removed sidebar.

## Acceptance Criteria

- The reader no longer uses the chapter sidebar.
- A top chapter strip is visible in the reader.
- The strip shows completed, current, and upcoming chapter states.
- The active chapter segment displays partial progress within the chapter.
- Users can click any available chapter segment to jump directly to that chapter.
- Unavailable chapters remain visible but disabled.
- Existing chapter switching behavior still works from playback controls.
- Automated tests cover the new strip interaction model.
