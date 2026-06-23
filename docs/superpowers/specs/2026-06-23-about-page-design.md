# About Page Design

Date: 2026-06-23

## Goal

Create a formal "About" page for the personal photography website. The page should read like the preface to a quiet image archive, not a personal biography or a commercial landing page.

## Tone

Use a neutral archive voice. Avoid first-person phrasing such as "I photograph..." and write from the perspective of the site or archive.

The tone should carry a light Stoic influence: restraint, attention, acceptance, and serious looking. Do not include direct Stoic quotations in this version, because quotations would require careful source and translation handling and may make the page feel heavier than needed.

## Content Structure

The page will keep the existing "About" route and navigation item.

The main heading area should contain:

- Eyebrow: "关于"
- Title: "关于这个影像档案"
- Supporting sentence about personal photography, careful looking, and preserving moments.

The body should use two main areas:

- A primary text column with three short paragraphs.
- A secondary information panel with concise archive notes and the contact email.

## Primary Text

The body copy should explain:

- The site preserves personal photography work as a slowly growing image archive.
- The photographs may come from travel, everyday scenes, live moments, and relationships between people and their surroundings.
- The archive values the act of looking: slowing down, resisting quick explanation, and allowing a moment to keep its original weight.

## Information Panel

The side panel should contain three compact entries:

- "档案": personal photography work, continuously organized.
- "观看": careful looking, without rushing to interpretation.
- "联系": `paperboxmouse@163.com`.

Remove placeholder contact details such as `hello@example.com` and `@your_handle`.

## Visual Design

Keep the current restrained visual language:

- Warm paper-like background.
- Serif display headings.
- Small uppercase-style eyebrow labels.
- Sparse layout and quiet borders.
- No decorative illustrations, no hero image, and no marketing-style callouts.

The existing `about-layout`, `about-lede`, and `contact-panel` structure can be reused and refined. The page should remain responsive, with the two-column layout collapsing cleanly on small screens.

## Implementation Scope

Expected files:

- `src/pages/About.jsx`
- `src/styles.css`

No changes are expected to the photo data pipeline, admin tool, routes, or navigation behavior.

## Verification

After implementation:

- Run the relevant test/build commands, at least `npm.cmd run build`.
- Check the page in the local Vite site.
- Confirm Chinese text renders correctly and does not overflow on mobile widths.
- Confirm the contact email is `paperboxmouse@163.com`.

## GitHub Reminder

After the module is implemented and verified, remind the user to upload to GitHub with:

```powershell
git status
git add .
git commit -m "Improve about page"
git push
```
