# About Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder About page with a formal neutral-voice image archive page.

**Architecture:** Reuse the existing React route and CSS structure. Keep content static in `About.jsx`, and refine only the About-specific CSS selectors in `styles.css` so the change stays isolated from the photo data pipeline and admin tool.

**Tech Stack:** React, Vite, plain CSS, existing project scripts.

---

## File Structure

- Modify `src/pages/About.jsx`: replace placeholder Chinese copy and placeholder contact information with the approved neutral archive content.
- Modify `src/styles.css`: refine About page layout and side panel styles using existing selectors, without changing global navigation or photo grid behavior.
- Do not modify `src/App.jsx`, `src/components/Header.jsx`, admin files, photo sync scripts, or photo JSON data.

## Scope Check

The approved spec covers one page only. It does not include routing changes, admin changes, photo metadata changes, quotes, animations, or deployment work.

### Task 1: Replace About Page Content

**Files:**
- Modify: `src/pages/About.jsx`

- [ ] **Step 1: Replace the placeholder JSX**

Use this complete component:

```jsx
export default function About() {
  return (
    <main className="section-shell page-top about-page">
      <div className="section-heading about-heading">
        <p className="eyebrow">关于</p>
        <h1>关于这个影像档案</h1>
        <p>
          这里保存一些个人摄影作品，也保存一种观看方式：放慢速度，认真看见，并让某个瞬间继续停留。
        </p>
      </div>

      <div className="about-layout">
        <div className="about-copy">
          <p className="about-lede">
            这个网站不是一份简历，也不是一次作品包装。它更接近一个缓慢生长的影像档案，收集那些在日常、旅途和现场中被认真看见的片刻。
          </p>
          <p>
            照片里的内容可能是光线经过墙面，街角短暂的秩序，人与环境之间不易察觉的关系，也可能只是一个没有被命名的下午。
          </p>
          <p>
            这个档案关心的不是立刻解释一切，而是保留观看本身。先停下来，看清楚，再让瞬间保有它原来的重量。
          </p>
        </div>

        <aside className="contact-panel" aria-label="关于这个影像档案的补充信息">
          <div className="about-note">
            <h2>档案</h2>
            <p>个人摄影作品持续整理中。</p>
          </div>
          <div className="about-note">
            <h2>观看</h2>
            <p>认真观看，不急于解释。</p>
          </div>
          <div className="about-note">
            <h2>联系</h2>
            <p>
              <a href="mailto:paperboxmouse@163.com">paperboxmouse@163.com</a>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Confirm old placeholders are gone**

Run:

```powershell
rg "hello@example.com|your_handle|Instagram" src/pages/About.jsx
```

Expected: no matches.

### Task 2: Refine About Page Styles

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add About-specific heading and copy styles**

Add these rules near the existing `.about-layout`, `.about-lede`, and `.contact-panel` styles:

```css
.about-heading {
  max-width: 880px;
}

.about-copy {
  display: grid;
  gap: 22px;
  max-width: 820px;
}

.about-copy p {
  margin: 0;
  color: #5e5a52;
  font-size: clamp(1rem, 1.5vw, 1.14rem);
}
```

- [ ] **Step 2: Replace the current `.contact-panel` block with an archive-style side panel**

Use this complete block:

```css
.contact-panel {
  align-self: start;
  display: grid;
  gap: 0;
  padding: 0;
  border-top: 1px solid rgba(38, 37, 34, 0.18);
  background: transparent;
}

.about-note {
  display: grid;
  gap: 8px;
  padding: 22px 0;
  border-bottom: 1px solid rgba(38, 37, 34, 0.14);
}

.about-note h2 {
  font-size: 1.15rem;
  line-height: 1.2;
}

.about-note p {
  margin: 0;
}

.about-note a {
  color: #262522;
  text-decoration-color: rgba(38, 37, 34, 0.35);
  text-underline-offset: 4px;
}

.about-note a:hover {
  text-decoration-color: #262522;
}
```

- [ ] **Step 3: Keep the existing responsive behavior**

Do not remove this existing media rule:

```css
@media (max-width: 860px) {
  .hero,
  .about-layout,
  .lightbox-panel {
    grid-template-columns: 1fr;
  }
}
```

Expected: About layout remains two columns on wide screens and one column on small screens.

### Task 3: Verify and Commit the Module

**Files:**
- Verify: `src/pages/About.jsx`
- Verify: `src/styles.css`

- [ ] **Step 1: Run the production build**

Run:

```powershell
npm.cmd run build
```

Expected: Vite build completes successfully.

- [ ] **Step 2: Start or reuse the Vite dev server**

Run if no dev server is already running:

```powershell
npm.cmd run dev
```

Expected: the site is available at `http://127.0.0.1:5173/`.

- [ ] **Step 3: Check the About page in browser**

Open `http://127.0.0.1:5173/`, click `关于`, and confirm:

- Title is `关于这个影像档案`.
- Text uses neutral archive voice, not first person.
- Email is `paperboxmouse@163.com`.
- There is no Instagram placeholder.
- Content does not overflow at desktop width or mobile width.

- [ ] **Step 4: Commit only the About module files**

Run:

```powershell
git status --short
git add src/pages/About.jsx src/styles.css docs/superpowers/plans/2026-06-23-about-page-implementation.md
git commit -m "Improve about page"
```

Expected: commit includes only the About page implementation, CSS refinement, and this implementation plan. Existing unrelated admin, photo data, and manual changes remain untouched unless they were already intentionally staged by the user.

## Self-Review

- Spec coverage: Task 1 implements the approved neutral archive content and contact email. Task 2 implements the restrained visual design and responsive side panel. Task 3 covers build and browser verification.
- Placeholder scan: The plan contains no placeholder markers or unspecified implementation steps.
- Type consistency: All class names introduced in JSX are styled in CSS: `about-heading`, `about-copy`, `about-note`, and existing `contact-panel`.

## GitHub Reminder

After implementation and verification, remind the user to upload to GitHub:

```powershell
git status
git add .
git commit -m "Improve about page"
git push
```
