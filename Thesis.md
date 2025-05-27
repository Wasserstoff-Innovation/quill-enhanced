Thanks for confirming. I'll now begin a detailed step-by-step research report for creating a full-featured React + TypeScript-based NPM SDK for a multi-purpose, extensible document editor with diff, track changes, plugin support, and export capabilities. It will be based on an architecture like react-quill-new or StackEdit, with support for local saving and Git-style versioning.

I'll share the research and implementation plan with code architecture, toolchain, and packaging strategies when it's ready.


# Development Plan for a React + TypeScript WYSIWYG Editor SDK

## **Overview and Objectives**

This plan outlines the step-by-step strategy to build a **React + TypeScript NPM SDK** for a lightweight, full-featured WYSIWYG document editor. The SDK will provide an embeddable React component (or set of components) that delivers rich text editing with extensibility and performance in mind. Key objectives include:

* **Metadata Initialization:** Accept document metadata (ID, date, version, etc.) and initial content to load the editor state.
* **Rich Text Editing UI:** Render a fully-equipped editing interface (toolbars, formatting buttons, etc.) for a Word-like experience.
* **Content Retrieval API:** Expose methods to get the edited content on demand (as HTML, plain text, Delta, Markdown, etc.).
* **Diff and Track Changes:** Enable loading two document versions and displaying differences in *unified (inline)* or *split (side-by-side)* views with inline changes and block-level additions/removals highlighted. Implement "track changes" Git-style with each change annotated by author and timestamp.
* **Live Change Tracking:** Optionally track edits in real-time (suggestion mode) – insertions highlighted, deletions shown but not removed – and support local autosave (using `localStorage` or IndexedDB).
* **Page Layout Options:** Support configurable page margins (left, right, top) and an optional header/letterhead section (e.g. logo + org name) with specified dimensions.
* **Selection-based Actions:** Allow custom actions on selected content (e.g. "Accept"/Accept change buttons for tracked edits) with programmatic hooks to highlight text ranges and apply patches.
* **Optional Plugins:** Provide optional features that can be toggled – e.g. line numbering in a margin, automatic index/toc generation from headings, or a Markdown mode/converter plugin.
* **Single Package, Modular Design:** All features provided in one NPM package (no multi-package complexity), but architected for tree-shaking so unused features can be dropped.
* **Leverage Mature Foundations:** Use a proven editor core (such as **Quill.js v2** via **react-quill-new**, or insights from StackEdit) to minimize reinventing the wheel and ensure stability.
* **Modern Build & Typing:** Use modern build tools (ESBuild/Rollup or similar) to produce a bundle optimized for tree-shaking and include full TypeScript type declarations for the SDK's API.

By meeting these goals, the SDK will offer developers a plug-and-play rich text editor that is **extensible, performant, and easy to integrate** into React applications.

## **Architectural Decisions and Core Technologies**

**Choosing Quill.js v2 as Editor Core:** We will build on **Quill.js 2.0+** – a modern, well-supported rich text engine – to handle content editing. Quill provides an internal document model (called Parchment) and a structured change format (Delta) which is ideal for implementing features like diffing and track changes. We will utilize **react-quill-new** (a maintained React wrapper for Quill v2) as the integration layer, giving us a React component with Quill under the hood. This choice is motivated by Quill v2's improved performance on large documents and its modular, extensible architecture. Quill's design features a small core with an expressive API, extended by modules for additional functionality – a philosophy we will adopt in our SDK design.

**Single Package, Modular Internals:** The SDK will be delivered as **one NPM package**, but internally structured into modules/plugins. This means developers install one package, import the main Editor component, and enable features via props or configuration. Under the hood, each feature (diffing, markdown, etc.) will be implemented as a **plugin module** that hooks into the core editor. Unused modules won't execute, and with proper build configuration they won't even be included in the bundle (making the package tree-shakable). We'll achieve this by code-splitting optional features and using ES Modules export structure – e.g., only importing the Markdown parser when the Markdown plugin is enabled. Modern bundlers will drop code that isn't referenced, ensuring the SDK remains **lightweight** when features are toggled off.

**TypeScript First:** All code will be written in TypeScript, providing **full type definitions** for consumers. We will design clear interfaces/types for document content (e.g. a `DocumentData` type containing content and metadata), for change objects (representing tracked changes), and for plugin APIs. This will catch errors early and give SDK users autocompletion and documentation in their IDE. The build process will emit `.d.ts` files alongside the JavaScript.

**External Dependencies:**

* *React and DOM libraries:* The SDK targets React (16.8+ with Hooks, ideally React 18) as a peer dependency. We'll also include `react-dom` as peer.
* *Quill.js v2:* As mentioned, Quill will be a core dependency (brought in via react-quill-new). This covers the rich text editing, selection handling, history (undo) management, and built-in modules (clipboard, keyboard shortcuts, etc.).
* *Diff Algorithm:* For diffing, we rely primarily on Quill's Delta diff. Quill's Delta object has a built-in `diff()` method to compute differences between two documents. This is ideal for comparing rich-text content because it takes formatting into account and results in a Delta of changes (insertions/deletions). In case we need more granular or alternative diff approaches (e.g. for block-level comparisons or non-Quill content), we might consider proven text diff libraries like **jsdiff** or Google's **diff-match-patch** (these handle character/word/line diffs). However, Quill's Delta diff is the *most idiomatic* approach within Quill's ecosystem and will form our primary diff engine.
* *Storage:* For autosave and offline storage, we may use a lightweight wrapper like **localForage** (which abstracts IndexedDB vs localStorage) or even the browser's `localStorage` API directly for simplicity. No heavy DB libraries are needed; the data volume (document content and change log) is manageable in browser storage.
* *Export Utilities:* To implement export features, we'll integrate specialized libraries:

  * **HTML to PDF**: We can leverage a client-side PDF generator like **jsPDF** or **html2canvas + jsPDF** to convert the editor's HTML content to PDF. These allow capturing styled content and outputting a PDF file. (Alternatively, we could provide an optional integration point to send content to a server for PDF generation using a headless browser or service, but an in-browser solution keeps the SDK self-contained.)
  * **HTML to DOCX**: Use an existing utility such as **html-to-docx** which converts HTML DOM to a Word `.docx` file. For example, *html-to-docx* is a JS library that produces Word-compatible DOCX files from HTML content. We'll include this as an optional dependency; if the host app needs DOCX export, the SDK can import it on-demand to generate the file.
  * **Markdown Conversion**: For the Markdown plugin, use a library like **marked** or **remark** to parse Markdown to HTML, and **Turndown** (or **showdown** in reverse) to convert HTML back to Markdown. These libraries are mature and will save us from writing our own MD parser. They can be loaded only when the Markdown feature is used.
* *Others:* No other major dependencies are anticipated. We will avoid large frameworks for state management (no Redux or MobX by default) – React's context and Quill's internal state should suffice. We will also use lightweight utility libraries (if needed) in a minimal way to keep bundle size small.

**State Management:** The SDK will manage state using a mix of internal React state and Quill’s own data model. Content and formatting state live within the Quill editor (which uses the Delta document model and Parchment for DOM mapping). Quill also provides an event system to notify on changes (text-change, selection-change). We will wrap those events to update any React state needed for our UI (for example, toggling an “unsaved changes” indicator or updating a list of tracked changes). For most use cases, we can treat the Editor as an uncontrolled component and provide callbacks (e.g. `onChange`) and imperative methods (via `ref`) to get state when needed, rather than re-rendering on every keystroke. If the user wants a fully controlled component, we can also support a `value` and `onChange` prop that ties to the content (similar to how ReactQuill works). Complex UI state, such as a list of change suggestions or the visibility of optional UI elements (line numbers, rulers, etc.), can be managed with React context or a simple internal store. The guiding principle is to **keep state handling simple and aligned with React practices** – utilize local component state and context for internal matters, and expose high-level state via props/callbacks for the host app when necessary.

**Plugin Architecture:** We design the editor core to be **plugin-friendly**. Each optional feature (track changes, markdown, etc.) will be implemented as a plugin module that can hook into lifecycle events and extend functionality. The core Editor will have an extension API something like: `Editor.registerPlugin(pluginModule)` or an array prop `<Editor plugins={[plugin1, plugin2]}>`. For built-in features, we may allow enabling them via boolean props (for convenience), but under the hood it triggers the inclusion of the corresponding plugin. For example, `trackChanges={true}` might internally load the TrackChanges module. Plugins will use Quill’s extension points where possible (e.g., Quill modules or Parchment blots), or wrap higher-level behaviors around the Editor. This architecture ensures that adding/removing a feature is as easy as toggling a flag, and it keeps the core clean and focused. Quill itself was built to be modular: *“The core is augmented by modules, using the same APIs you have access to.”* – we will follow the same approach, making features like diff-view, markdown, etc. into **pluggable modules**.

To summarize, the architecture is **React + Quill (v2)** at the core, packaged as a single TypeScript SDK. We leverage Quill’s strengths (rich text editing, Delta ops, module system) and complement it with our own plugins for diffing, track changes, and other features. The design emphasizes **modularity, performance, and developer experience** – minimal overhead when features are off, but easy extensibility when needed.

## **SDK Structure and Components**

We will organize the codebase for clarity and tree-shaking. A possible file layout:

```
src/
├─ index.tsx             # Exports main SDK components and types
├─ Editor.tsx            # Core React component for the WYSIWYG editor
├─ DiffViewer.tsx        # React component for side-by-side or unified diff view
├─ plugins/
│   ├─ TrackChanges.ts   # Module implementing track-changes (diff, annotations)
│   ├─ Autosave.ts       # Module for local autosave (storage logic)
│   ├─ MarkdownPlugin.ts # Module for Markdown import/export and mode
│   ├─ LineNumbers.ts    # Module to render line numbers gutter
│   └─ ... (other plugins as needed)
├─ components/
│   ├─ Toolbar.tsx       # Custom toolbar component (if we override or extend Quill's)
│   ├─ Header.tsx        # Component for rendering the letterhead/header
│   └─ ... (e.g., a Sidebar for comments or track changes list)
├─ utils/
│   ├─ diffUtils.ts      # Helper functions for diffing (wrap Delta.diff, etc.)
│   ├─ contentUtils.ts   # e.g., conversion between formats (HTML <-> Delta <-> MD)
│   ├─ storageUtils.ts   # Helper for saving to localStorage/IndexedDB
│   └─ exportUtils.ts    # Functions to export to PDF/DOCX (using external libs)
└─ types/
    ├─ index.d.ts        # Master type declarations (if not auto-generated)
    └─ editor.d.ts       # Specific type definitions (DocumentMeta, Change, etc.)
```

In this setup, **`Editor.tsx`** is the primary component that developers will use. It encapsulates a Quill editor instance. It accepts props for initial content, metadata, feature toggles, and event callbacks. It also manages mounting/unmounting the Quill instance via react-quill-new. We’ll likely wrap the `ReactQuill` component from react-quill-new, attaching additional behavior and UI around it.

The **`DiffViewer.tsx`** component is used when two documents need to be compared. This could be a separate component that takes in two versions of content (and maybe their metadata for display) and renders either:

* a *unified diff* (single-column view with changes marked inline), or
* a *split diff* (two side-by-side columns, original on left and modified on right).

`DiffViewer` can internally utilize the Editor (in read-only mode) or simply render HTML with highlights for differences. For performance, a simpler approach is to use two read-only Editor instances for side-by-side, and a single read-only Editor (with diff markup in its content) for unified view. We will provide a prop like `viewMode="split"` or `"unified"`.

**Plugins Directory:** Each plugin module (TrackChanges, Autosave, etc.) encapsulates the logic for that feature:

* **TrackChanges module:** adds the ability to record changes, mark insertions/deletions, and manage accepting/rejecting changes.
* **Autosave module:** sets up timers or listeners to save content to local storage.
* **MarkdownPlugin:** adds functions to import/export markdown, and possibly a toggle to switch the editor into a markdown source mode.
* **LineNumbers:** renders a gutter with line numbers alongside the editor content when enabled.

These modules might export an initialization function or a class. For example, `TrackChanges.init(editor: EditorInstance, options?)` could attach event handlers to Quill to intercept changes.

**Components Directory:** Contains reusable subcomponents:

* `Toolbar.tsx`: We may use Quill’s default toolbar (via theme Snow) by default, but if we need custom buttons (like Accept/Reject or a mode switcher), we might create a custom toolbar component. This component could either extend Quill’s toolbar module or replace it. Quill allows a custom toolbar container to be provided, so we could supply our own JSX toolbar if needed, populated with buttons tied to Quill commands (via the Quill API).
* `Header.tsx`: A small component to render the static header/letterhead (logo + org name) above the editor content. It will accept props for the content (HTML or React node), height, etc., and simply render at the top. The Editor component will include this if header is provided.

**Utility Modules:** These provide isolated functions:

* `diffUtils.ts`: Functions to compute differences between two contents. This likely wraps Quill’s `oldDelta.diff(newDelta)` call and maybe post-processes for block-level changes. It may also include methods to format a diff Delta for display (e.g., applying color attributes for inserts/deletions as shown in the dev example code).
* `contentUtils.ts`: Conversions between formats (e.g., Delta to HTML using Quill’s `quill.root.innerHTML` or a Delta-to-HTML library if needed, HTML to Markdown using Turndown, etc.). Also, extracting text or generating a table of contents from headings.
* `storageUtils.ts`: Functions to save and load drafts from localStorage/IndexedDB. Possibly using keys like `editor_draft_<docId>` and storing timestamp.
* `exportUtils.ts`: High-level functions that use external libs to create PDF or DOCX. For example, `exportToDocx(html: string)` that internally calls the html-to-docx library and triggers a download.

All these pieces come together in the main **`index.tsx`** (or `index.ts`) which re-exports the primary components and possibly some utility functions. It will also set up any global initialization (for example, applying a polyfill if needed, or configuring Quill global settings like registering custom blots for track changes).

The file structure is designed to separate concerns and make it easy to include or exclude features. For instance, if the MarkdownPlugin is not used, a bundler might tree-shake away `MarkdownPlugin.ts` and its heavy dependencies, keeping the core bundle small.

## **Document Initialization with Metadata**

From the moment the Editor component is used, it should accept initialization data for the document. We will design the API such that you can do something like:

```jsx
<Editor 
  documentId="DOC-1001"
  version={3}
  initialContent={initialHtmlOrDelta} 
  metadata={{ title: "My Doc", created: "2025-05-01" }}
  ...
/>
```

* **Document ID & Version:** The `documentId` (string/number) and `version` (number or string) props allow the host app to identify which document (and which version of it) is being loaded. This metadata won’t directly affect editing, but will be used for features like autosave (to key the saved draft) and diff (to label versions or fetch the correct comparison). The editor might, for example, display the doc name or version in a header bar if desired (this could be part of the UI or left to the host app to show separately).
* **Initial Content:** The `initialContent` prop can accept either a raw HTML string, a Quill Delta, or perhaps Markdown (if a format prop is provided). Internally, we will normalize this input. If it’s a Delta object, we directly load it via `quill.setContents(delta)`. If it’s HTML or plain text, the react-quill-new component can initialize with that (Quill can take HTML content if you set the container innerHTML, or use Quill’s clipboard converter). We can also accept an initial JSON delta (which could be the output of a previous save). This gives flexibility in how developers supply document data.
* **Other Metadata:** We allow a generic `metadata` prop for any other info (like author, timestamps, etc.). This might not be directly used by the editor core, but it could be useful in plugins. For example, a TrackChanges plugin might use `metadata.author` as the current user name to tag new changes.

**Loading Content:** On mount, the Editor component will instantiate Quill (via react-quill-new). We’ll ensure Quill is configured with the desired modules (e.g., history for undo, clipboard, etc., plus our custom modules for any enabled features). We then load the initial content:

* If we have a Delta form, call `editor.setContents(delta)`.
* If HTML, we might set it via the `value` prop on ReactQuill which accepts HTML by default (ReactQuill can be controlled with an HTML string or a Delta). The react-quill-new documentation shows using `value={state}` to control content. We might use an uncontrolled approach where we call a method to set it once.

After initialization, the editor should display the content with all formatting, and be ready for user interaction. Document metadata like version or date could be displayed in a non-editable area (perhaps in the header or a status bar). For example, if a letterhead header is provided, it might include the document date or version as part of that header content.

If two documents need to be loaded for diffing, we will likely not do that in a single Editor instance (since an editor holds one document content at a time). Instead, for diff mode, we use the dedicated `DiffViewer` component or a special mode of Editor:

* **Unified diff mode:** We call something like `<Editor mode="diff" original={doc1} modified={doc2} />` which internally computes the diff and displays a merged view (this could be a convenience, but implementing it might complicate the Editor component). More clearly, we’ll use a separate `DiffViewer` component as mentioned, so the developer would do `<DiffViewer original={doc1} modified={doc2} view="unified" />`.
* In both cases, we need to accept two sets of content + metadata. The DiffViewer could accept props `originalContent`, `newContent`, `originalMeta`, `newMeta` etc.

The SDK will also handle **re-initialization** if props change (for example, if the app switches to a different document in the same editor component). We will detect if `documentId` or `initialContent` prop changes, and if so, prompt to save unsaved changes of the current doc (if any), then load the new content. This ensures the Editor can be reused for multiple documents if needed without memory leaks or stale data.

## **Rich Text Editor UI & Tools**

We aim to provide a familiar rich text editing experience. Leveraging Quill means we get a lot of functionality out-of-the-box:

* Editing in a contenteditable area with support for **bold, italic, underline, strikethrough**, **headings**, **lists**, **quotes**, **code blocks**, **links**, **images**, etc. (Quill’s default formats).
* A floating or fixed **toolbar** with buttons for these formatting actions. Quill’s **Snow theme** comes with a default toolbar UI which we can use and customize. We can either configure it via a config object (to add/remove buttons) or mount our own toolbar component. Initially, it’s faster to use Quill’s built-in toolbar by specifying a toolbar config in Quill modules. For example, we can provide a configuration to include all standard tools:

  ```js
  modules: { toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], ['link', 'image'], …] }
  ```

  We will include tools necessary for typical document editing (font styles, alignment, lists, indent, etc.).
* We will ensure the editor is **responsive** and styled appropriately. Quill’s container can be given a fixed height or auto height. We may want to constrain it to simulate pages (more on that under page layout). At minimum, the UI will be scrollable for long content.

**Custom Buttons and UI:** Some of our features require additional UI elements:

* *Accept/Reject change buttons:* When track changes mode is on, we will likely add UI controls for accepting or rejecting changes. These could appear in the toolbar (e.g., two buttons with icons for accept and reject), but they should only be enabled/visible when there are pending changes or when a specific change is selected. We might also implement a context menu or popover: e.g., clicking on a highlighted change could show a small popup with accept/reject options for that change.
* *Diff mode toggle:* If we allow toggling track-changes view on/off (like “Show revisions” checkbox), or switching between unified and side-by-side view, we need a UI control for that. Possibly a toggle button or a dropdown in the toolbar (e.g., “Diff View: None/Inline/Side-by-Side”).
* *Mode switch (Markdown <-> WYSIWYG):* If the Markdown plugin allows switching the editor into a raw markdown mode, we’d need a button or tab UI to switch between the rich text view and markdown source view. This could be a simple toggle button on the toolbar (e.g., “Edit as Markdown”).
* *Line numbers ruler:* If line numbers are enabled, we have to render a gutter on the left side of the text area. This can be an absolutely positioned element with numbering that aligns with text lines. Implementation detail: one approach is to wrap the editor in a container and use CSS counters to number paragraphs (not perfect for every line, but simpler). Alternatively, we continuously compute the height of lines to place numbers – which is complex. To start, numbering by block (paragraph) might be acceptable. We can include a small vertical ruler with numbers if the feature is toggled.

We will incorporate these UI elements in the **Editor component’s JSX structure**. For example, a simplified render might look like:

```jsx
<div className="editor-container" style={...}>
  {header && <Header content={headerHtml} height={headerHeight} />}
  {showLineNumbers && <LineNumberGutter ref={...} />}
  <ReactQuill ref={quillRef} value={initialContent} modules={modulesConfig} theme="snow" />
  {trackChanges && <ChangesSidebar changes={changesList} onAccept={...} onReject={...} />} 
</div>
```

Here we see:

* A container `<div>` that might enforce margins via CSS.
* A `Header` component inserted if header is provided.
* A `LineNumberGutter` component if line numbers are on – this would be a translucent overlay or separate column that displays numbers.
* The `ReactQuill` component (from react-quill-new) for the main editor area.
* Perhaps a `ChangesSidebar` if we choose to display a list of all changes in a side panel (optional, but could be useful for track changes UX similar to Word’s list of revisions).

**Styling and Theming:** We will use Quill’s default CSS (Snow theme) for the basics. Additional CSS will be written for our custom features:

* Highlight styles for inserted/deleted text (green highlight for inserts, red strike-through for deletes, etc.).
* Styles for the header (e.g., centering the logo, padding).
* Line number gutter styles (monospaced font, right-aligned numbers).
* We’ll ensure these styles can be overridden by the host app if needed (by using well-named CSS classes or allowing custom theme injection).

**Accessibility:** We will keep an eye on accessibility – ensure toolbar buttons have aria labels, the editor is navigable via keyboard, etc. Quill is pretty good in this regard, but any custom controls we add (like accept/reject) will be given proper labels and keyboard shortcuts (if appropriate).

**Page Margins & Layout:** To simulate page margins:

* We can set the width of the editor content area to something like `pageWidth - (leftMargin + rightMargin)`. For example, if leftMargin=1in, rightMargin=1in on an A4 page (8.27in wide \~ 793px at 96dpi), content width \~ 793px - 192px = \~601px. We might not strictly enforce page width unless doing an actual page view, but we can at least add the left/right padding. The Editor container `<div>` can have `padding-left` and `padding-right` set as per the given margins (in px or convert from cm/inches to px).
* Top margin: If a header is present, the header itself will occupy some of the top space. We can also add extra padding-top to the editor content if needed to simulate a top margin above the first line of text.
* Visual page breaks: In a true “print layout” mode, one might show page breaks at certain intervals. Initially, we may not implement actual page breaking (that involves calculating how much content fits in one page height and inserting a break). That can be very complex in a browser environment and not requested explicitly. Instead, we focus on the margins and header which are simpler.

**Header/Letterhead Implementation:** If the user supplies a header HTML and dimensions:

* We will render a `Header` component above the editor. This could simply insert the given HTML string (sanitized or trusted) into a div with a set height (or auto-height if not specified). For example, a letterhead might be 100px tall and contain an `<img src="logo.png" /> <span>My Organization</span>`. We render that, and apply `pointer-events: none` or similar if we want it to be non-interactive (so the user can’t select or edit it).
* We must ensure the editor content starts below the header. This can be done by giving the header element absolute positioning and a top margin for the content, or simpler, just include it in normal flow and make the Quill editor container below it (the container itself can have margin-top equal to the header height).
* In export to PDF or DOCX, we will include this header. For PDF, libraries often allow adding a header per page – we might only add it to the first page if it’s a letterhead (common in official docs). For DOCX, html-to-docx can accept a header HTML string (as seen in its usage example). We will pass the headerHTML so that the exported Word document has the header on each page (or first page depending on library support).

**Toolbars and Custom Actions:** Quill’s default toolbar will cover basic formatting. We will extend it for our needs:

* If track changes is enabled, we add *Accept* and *Reject* buttons. Clicking these could call internal methods `acceptChange()` or `rejectChange()` (more details in the track changes section). We might disable them (greyed out) until a change is selected or focused.
* If we have a diff view toggle (for unified vs split view), that may not live in the editing toolbar since diff view is a separate mode. More likely, the host app chooses either to show the editor in normal mode or use the DiffViewer component in a separate screen for comparing versions. We’ll document how to use the DiffViewer rather than toggling within the same component (to keep things simpler).
* For Markdown mode, a toggle button like “<>” icon could switch the editor. On click, if in WYSIWYG, we retrieve content, convert to markdown text, hide the Quill editor and show a textarea or code editor with that text. A second click converts back. This is a significant interaction to implement, so it might be an advanced feature (if time permits). As an MVP, we might allow importing/exporting markdown rather than live editing in markdown.
* Custom plugins from the user: If a developer wants to add a custom button (say, a “highlight” marker), we should allow it. They could either extend the toolbar config (Quill allows adding custom buttons and handlers by providing a custom toolbar element). We can expose the Quill instance for such cases or offer an API: e.g., `editor.registerFormat('highlight', options)` and `editor.addToolbarButton(icon, handler)`. Because our SDK is meant to be extensible, we will document how to add custom formats (Quill’s Parchment system allows registering new blots for new inline styles, etc.). The SDK might provide a helper for that process.

In summary, the UI will blend Quill’s robust editing features with our additional controls for the extended functionality. By carefully designing the layout (header, margins, gutter, sidebars) and hooking into Quill’s UI mechanisms for the toolbar, we can achieve a professional editing interface without starting from scratch.

## **Diff View and Track Changes Implementation**

One of the most important features is the ability to compare documents and track changes. This breaks down into a few related capabilities:

* **Diffing two documents (versions)** to identify inserts/deletions.
* **Displaying diffs** either inline (unified) or side-by-side (split view).
* **Live tracking of changes** as the user edits (suggestion mode).
* **Metadata tagging** for changes (author, timestamp).
* **Accepting/rejecting changes** and merging them into the document.

We will harness Quill’s Delta format to achieve much of this. Quill Deltas represent content and changes in a structured way (ops of insert/retain/delete). Quill provides a `diff()` method on Deltas to compare two states of a document, yielding a Delta of the differences. For example, if `oldDelta` and `newDelta` are two versions, `oldDelta.diff(newDelta)` returns a Delta that transforms the old content into the new content. This Delta’s ops effectively tell us what was inserted or deleted. Using this is **the core of our diff engine**.

**Document Versioning Strategy:** We assume that when comparing, we have two snapshots to compare (for instance, one from the server or a previous save, and the current content). The SDK will make it easy to get those snapshots as Deltas via `editor.getContents()` at different times. For tracking changes, we might maintain an internal “baseline” Delta (e.g., the last saved state) and always diff against that to get the changes not yet saved. Alternatively, for live track changes, we intercept changes on the fly (discussed below).

For comparing arbitrary two versions (e.g., version 1 vs version 5 of a doc), the application using the SDK can fetch those versions (as content strings or Deltas) and pass them to our DiffViewer or an API method like `Editor.computeDiff(oldContent, newContent)`. We will provide such a method that returns a diff Delta or a structured diff result.

**Unified Diff (Inline Track Changes View):** This is where we show one document with markup indicating additions and deletions:

* We start with the “old” version content as base. Then we apply the diff operations to mark what changed. A proven approach (inspired by the example from the DEV article) is:

  1. Compute `diffDelta = oldDelta.diff(newDelta)`.
  2. Iterate over `diffDelta.ops` and for each op:

     * If it’s an **insert**, add an attribute to mark it as addition (e.g., an attribute `{ background: "#cce8cc", color: "#003700" }` which highlights with green background and dark green text). We might also define a custom attribute or class name like `class="inserted"` for more control (CSS can target it).
     * If it’s a **delete**, the Delta op will look like `{ delete: N }` meaning N characters were removed. To represent this visually, we *convert the delete to an insert* of those characters but with a deletion attribute. In the dev example, they did: `op.retain = op.delete; delete op.delete;` which effectively turns it into a retain of that many characters. But actually, a cleaner method is to take the text from the old content corresponding to the deleted segment and make an insert of that text with a “deletion” formatting (e.g., red strikethrough). In Quill’s Delta terms, one can’t directly insert and delete in one op, so composing a deletion Delta with the original content requires this retain trick. The net result is an output Delta that still contains the “deleted” text but marked in red and with strikethrough style.
  3. Compose the styled diff Delta with the old content Delta: `highlightedDelta = oldDelta.compose(diffDelta)`. This yields a Delta representing the old text with insertions and deletions annotated (since compose will apply the insert ops and retain-through deletions).
  4. Load `highlightedDelta` into a Quill editor (e.g., a read-only diff viewer instance). The editor will display added text in green highlight and deleted text with red strike. This is exactly how “track changes” typically appears. We can also add perhaps an underline for insertions to distinguish, or different colors per author (more on authorship below).

Using Delta.compose like this is a clever way to overlay changes on top of original content and display them together. We will implement a variant of this logic in our `diffUtils.ts`. The benefit of using Quill’s own representation is that it handles styled text segments gracefully (formatting stays with the retains/inserts properly).

We’ll define custom CSS or use inline styles for the diff attributes. Possibly:

```css
.inserted { background: #cce8cc; color: #003700; }
.deleted { background: #e8cccc; color: #700000; text-decoration: line-through; }
```

We might implement these as custom Quill formats (blots or Attributors). For example, we can create an Inline blot for “inserted” text that wraps content in `<span class="inserted">...</span>`, and similarly for “deleted”. However, using just the attributes as in the example means we don’t need custom blots – we piggyback on Quill’s ability to apply inline styles via the Delta attributes. Quill has a built-in `strike` format for strikethrough which we used above for deletion. We might combine that with a color to get the red strike. Or define a custom style attribute for background color if needed. In Quill v2, adding custom formats is straightforward via `Quill.register()` if needed.

* **Authorship & Timestamp:** We want to record who made each change and when. Quill’s Delta can carry custom attributes, but storing complex data in attributes might be heavy. Another approach is to keep a separate data structure mapping change identifiers to metadata. Here’s a plan:

  * Every insertion or deletion that is part of tracked changes gets a unique ID (could be a simple incremental ID or a UUID).
  * We add that ID as a custom data attribute on the element or in the Delta attributes (e.g., `{ changeId: "abc123" }`). We register a custom Attributor for `changeId` which outputs a `data-change-id="abc123"` on the span.
  * Separately, we maintain an array or object `changesMap` where `changesMap["abc123"] = { author: "Alice", timestamp: 1620000000, type: "insert", text: "hello" }`.
  * This way, the DOM has markers for each change and we can look up details when needed (like on hover or in a side list).
  * The current user’s name (for new changes) will be provided by the host app (perhaps via a prop like `currentUser` or from context). The timestamp we can generate at the moment of change.
  * When we do an offline diff between two versions, if we have metadata of authorship of the new version, we could assume all changes are by that author at that save time. But for multi-author changes, live tracking is needed.

  For multi-author collaboration, one might integrate with a server or CRDT, but that’s beyond scope. We focus on local track changes where one user at a time is making suggestions (or at least, changes are tracked per user session).

  In the UI, different authors could be indicated by different highlight colors or labels. For simplicity, we could give each author a distinct color (like Alice’s inserts are green, Bob’s inserts blue, etc.). The metadata can store a color or we can hash the author to a color. Alternatively, every tracked change could display the author’s name and time in a tooltip. If the user hovers the changed text, we show a small tooltip “Inserted by Alice on 2025-05-10 14:32”. We’ll implement this perhaps by listening to hover events on spans with data-change-id and showing a tooltip using the info from `changesMap`.

* **Side-by-Side Diff:** In split view, we want to show two columns: left = original document with deletions indicated, right = new document with additions indicated. This is akin to code diff tools. Implementation:

  * Compute the same diff Delta as before.
  * Derive two separate documents: one for left, one for right.

    * Left document = original content with deletions *marked* (but no inserted text that wasn’t in original).
    * Right document = new content with insertions marked (but no text that was deleted, since that text isn’t in new content).
  * We can derive these from the diff ops as well. For each op:

    * Insertions should appear on the right side. For the left side, those inserted texts weren’t in original, so in left view we might either show nothing or maybe a placeholder indicator (some diff UIs show an empty space or a marker where new text goes). It might be acceptable to just not show them on left.
    * Deletions should appear on the left side marked in red strike, and on the right side they would be absent (maybe show empty or a placeholder).
    * Unchanged text appears in both sides.

    - A simpler method:

      * Left content Delta = `oldDelta.compose(deletionHighlightDelta)` (only mark deletions),
      * Right content Delta = `newDelta.compose(additionHighlightDelta)` (only mark additions).
      * Where do we get deletionHighlightDelta? It could be derived by taking diffDelta and converting all deletes to retains with strike as done, but ignoring inserts. Similarly, additionHighlightDelta would come from diffDelta taking only inserts with highlight.
      * Actually, we can split diffDelta: one delta containing only deletion ops (converted to retains with strike), another containing only insertion ops (with highlight attr). Compose the first with old, second with new.
  * Then, initialize two side-by-side Quill components: left in read-only mode with the left Delta, right with the right Delta. We also likely want to align them by lines. True side-by-side diff would align corresponding lines (so if a paragraph was added in right, left might show a blank line or gap to keep alignment). Implementing perfect alignment is complex because once rendered, text height can vary. However, for an MVP, we might assume roughly corresponding content and not do explicit alignment beyond both scroll together.
  * **Scroll Sync:** We can implement synchronized scrolling for split view. When one side scrolls, programmatically scroll the other the same amount or to the corresponding line. This can be done by listening to the scroll event on one Quill and setting the scrollTop of the other. Quill’s editors are just divs with content, we can get references to them for syncing.

  The split view is helpful especially for large changes or restructured content, whereas unified is more compact for reviewing line edits. We give the option because requirement asks for both.

* **Live Track Changes (Suggestion Mode):** This means when the user types or deletes text, instead of applying those changes directly to the content as normal, we visually mark them as pending changes.

  * *Insertions:* If the user types new text “abc”, normally Quill will insert “abc” at that point. In suggestion mode, we want “abc” to appear with a special format (say green underline to indicate it’s new). We have two ways:

    1. After each user insertion, detect the inserted range and apply the "inserted" format to it. Quill’s `text-change` event gives us a Delta of what changed and also `source` (user or api). If `source==='user'`, we can inspect the Delta: it might contain ops like `{retain: X}, {insert: "abc"}`. We can record that and immediately format that range. For instance, use `quill.formatText(index, length, 'inserted', true)`. But we should define a custom format 'inserted'. Alternatively, set attributes in the Delta directly (Quill’s event also gives `delta` which we might manipulate, but the event is after the insertion happened).
    2. A more controlled approach is to override the Quill editor’s behavior. We can configure Quill with a custom *HTML clipboard module or keyboard handler* to intercept insertions. This is complex; easier is the reactive approach: let Quill insert normally, then style it.

    Using the event approach: On `text-change`, for each insert op in the Delta, we determine its start index and length, then call `quill.formatText(start, length, { background: "#cce8cc", color: "#003700" })` or apply a class. This will retroactively highlight it green. The user likely won’t notice any lag if done quickly. We must ensure not to override other formatting the user might be adding; fortunately, we can *add* a background without removing existing formatting (Quill will merge attributes).

    We also create a change entry in our `changesMap` for this insertion (with author, time, etc.). The inserted content text is known (it’s in the Delta op).

  * *Deletions:* If the user hits backspace or delete or cuts text, normally Quill would remove that text from the DOM. In suggestion mode, we want to **keep that text** but mark it as deleted (red strikethrough) instead of removing it entirely.

    * This is trickier because by the time the `text-change` event fires, the text is gone from the editor’s content (Quill has already applied the deletion). However, the event gives us the `oldDelta` (content before change) and the `delta` which might have a `{ delete: N }` op. We can calculate the position and length from `oldDelta` to retrieve the text that was deleted. For example, if `oldDelta` at position P for length N corresponds to "foo", and `delta` says delete N at P, we know "foo" was removed.
    * We cannot simply format text that is gone. Instead, we have to *re-insert* it with a deletion mark. Quill’s undo system does something similar (it knows what text was deleted). We can use Quill operations to bring it back:

      * Immediately after a deletion event, perform a Quill updateContents with an insert of the removed text at position P, with attributes indicating deletion (red strike). This will reinsert the text the user tried to delete, but now it appears with a strikethrough style, signaling it's “to be deleted”. The net effect to the user: they hit delete, the text visually gets a line through it rather than disappearing.
      * We have to be careful to avoid an infinite loop (since this insertion is done via API and will trigger another text-change event). We can use the `source` parameter: Quill events indicate source 'user' vs 'api'. We should make our insertion with source 'api' (Quill’s updateContents allows specifying the source argument, or if not we can detect in the event handler and ignore events that are from 'api' to prevent re-processing).
      * After reinsertion, adjust the selection if needed (the cursor might need to move to after that chunk).
    * This approach leverages Quill’s OT model: essentially we’re transforming a deletion into a formatted deletion mark. It’s complex but feasible. A simpler (but hacky) alternative is to intercept the keyboard event for delete/backspace via a Quill keyboard module and override the behavior to format instead of delete. Quill’s Keyboard module can intercept keys – we could intercept Backspace: rather than letting it delete, we manually take one character before cursor and wrap it in a deletion span. The downside is handling multi-character selections deletion. It might be easier to use the text-change event method described.
    * We’ll implement and test this thoroughly, as it’s the hardest part of live tracking.
    * Each such deletion gets an entry in `changesMap` with the text that was “deleted” and metadata.

  * *Formatting changes:* If a user just changes formatting (like toggling bold on some text), do we consider that a tracked change? Ideally, yes – e.g., “Alice changed text X from normal to bold”. However, tracking formatting changes in a user-friendly way is an advanced feature. Perhaps we treat it as: a format change can be represented as a deletion of the unformatted text and insertion of formatted text. Quill’s Delta for a pure format change uses a `retain` with attributes. We could detect that and either ignore minor formatting (not track it), or log it as a formatting change entry. At least initially, we can choose to **not track formatting-only changes** to keep things simpler, or treat them similar to insertions (the text isn’t new or removed, just attribute changed – maybe highlight it differently or not at all). This is a detail we can document as a limitation or a future enhancement.

  The output of live track changes mode is that the document content the user sees is actually full of insertion and deletion markers. We need to consider what happens when the user continues editing around these markers. Quill will treat those spans as content – e.g., typing at the edge of a deletion span might go inside it or outside depending on how we manage selection. We should test and possibly adjust behavior (maybe lock or isolate the spans so they don’t merge incorrectly).

  The **history (undo/redo)** integration is also a concern: If track changes is on, undo should undo the last edit (which might have been our two-step deletion transform). We might integrate with Quill’s History module to ensure consistency, or temporarily disable the custom behavior during undo operations.

* **Accept/Reject Changes:** Once changes are tracked (either via diff or live), the user needs control to accept or reject them:

  * We will maintain a list of changes (with their IDs and metadata). We can present this as a list in a sidebar or allow the user to step through them (e.g., “Go to next change” button).
  * **Accept Change:** If the change is an insertion, accepting it means we want to keep the text but remove its “new” marking. Implementation: simply un-format that text. For instance, if we mark inserted text with a custom attribute or class, we remove that formatting. That could be done by calling `quill.formatText(index, length, 'background', false)` (to remove highlight) and any other style flags, or remove the custom blot. Essentially, we convert that from suggested to normal text. The change entry is then resolved – we remove it from the changes list.

    * If the insertion was originally not in the document, “accept” just means do nothing (the text is already in the content, we just drop the highlight).
  * If the change is a deletion, accepting it means we do want to delete that text from the document. Implementation: simply remove the text. We know the range (it’s the length of that change’s text at some position). We can call `quill.deleteText(index, length)` or perhaps `quill.updateContents({ delete: length }, 'api')`. After deletion, that span is gone. We remove the change entry.

    * We should be careful that once we remove it, subsequent indices in changesMap might shift. But since we’re probably removing one change at a time (and maybe in order), we can update the stored indices or recompute them via Delta transform. Quill does offer `Delta.transformPosition` to adjust an index after applying an op, which could be useful if we had a lot of changes and accept one (others might move).
  * **Reject Change:** This is essentially the inverse:

    * For an insertion, reject means we *don’t want that text*. So we should delete that text from the document. We remove the inserted text entirely (like it never happened). Implementation: `quill.deleteText(index, length)` on that span. If we want to be fancy, maybe animate it or something, but straightforward removal is fine. Then remove the change entry.
    * For a deletion, reject means we want to keep the text (i.e., the deletion suggestion is thrown out). So we simply remove the strikethrough marking from that text, effectively restoring it to normal. Implementation: un-format that span (remove the 'deleted' style, possibly remove strike attribute and red color). The text remains visible as normal text. Then remove the change entry.
  * We must ensure that after each accept/reject, the document content and change list stay consistent. It might be easiest to re-diff after an accept to update the state, but that could reintroduce highlights already removed… Instead, we directly manipulate the live editor content as above and update our `changesMap` by deleting that entry. If we maintain `changesMap` and maybe each change also knows its current index in the text, we need to update indices of remaining changes if content length changed. This can be handled by applying a Delta representing the accept action to an index transformation on all later changes (Quill’s `Delta.transformPosition` can help).
  * We will provide convenience methods: e.g., `editor.acceptChange(changeId)` and `editor.rejectChange(changeId)` for programmatic control (and we’ll use these internally when the user clicks buttons). Also perhaps `acceptAll()` / `rejectAll()` to handle everything (which might just iterate or reset to final text).

  The UI for accept/reject can be integrated in a few ways:

  * Inline: e.g., clicking on a highlighted insertion could automatically accept it (maybe not good, better to have explicit buttons).
  * In toolbar: user selects a portion of text that is a change and clicks Accept to accept that specific change.
  * In a side panel: list all changes with \[Accept]/\[Reject] next to each.
  * We might implement the simplest: if selection (or cursor) is inside a changed text span, enable the Accept/Reject buttons to apply to that change. Or add small floating buttons next to the span in the margin (like Word does with comments changes).

  We will likely iterate on the UI based on usability, but functionally the above describes how we apply acceptance or rejection.

**Using Delta for Internal Change Representation:** Throughout these operations, using the Delta format ensures consistency. Quill’s `Delta.diff()` gives us initial differences, and `Delta.compose()` helps apply changes for visualization. Quill’s APIs like `getContents`, `insertText`, `deleteText`, `formatText` will be our primary tools to manipulate content. We should lean on these to maintain editor state, rather than directly fiddling with DOM.

**Alternatives considered:** We considered using external diff algorithms (like jsdiff) which could operate on text strings. Those can give character-level diffs and are great for plain text. However, integrating that with rich text (with bold/italic, etc.) is harder – you’d have to diff the underlying text and then map back to formatted spans. Quill’s Delta diff works at the *document model* level, meaning it understands positions in rich text. It’s thus more aligned with what we need and preserves format in unchanged parts. The plan is to use Delta diff for computing differences within paragraphs (inline changes). For detecting block-level changes (like whole paragraphs moved or added), a simple approach is to treat newlines as delimiters and possibly do a two-phase diff: first diff by lines (paragraphs) to see added/removed blocks, then diff within changed blocks for fine detail. Libraries like jsdiff have a mode for diffing by lines which could complement Delta for block moves. We can incorporate that if needed: e.g., if a large block of text was inserted, Delta diff will mark it as one big insertion, which is fine. If a block was moved, Delta might consider it a deletion in one place and insertion in another, which is also fine for our track-changes purpose (it will show as removed from old position and added in new). So even block-level changes can be represented by highlights of entire paragraphs inserted or deleted. We’ll ensure our UI styles handle multi-line inserts/deletions clearly (maybe by also marking the block with a border or something to indicate a whole paragraph change, but at least color suffices).

**Performance Considerations for Diff:** Computing Delta diffs is fast for reasonably sized documents (Quill’s diff uses a diff-match-patch under the hood optimized for speed). For very large documents (many thousands of words), diffing on each keystroke would be too slow – but we don’t do that. Live tracking intercepts small changes incrementally. For comparing two versions, it’s typically on-demand (user opens a revision compare view), so a short delay is acceptable. We will still test performance on large texts and optimize (maybe by diffing in chunks or in a web worker if needed, though likely not needed initially).

In summary, our diff and track changes system uses **Quill’s Delta ops to identify changes** and **visual annotations to display them**. We maintain metadata for changes so that each change can be attributed and individually controlled. This approach is similar to how version control or Google Docs suggestions work (in fact, Quill’s Delta was designed to be expressive for such use cases). By using `Delta.diff()` for state comparisons, we ensure we’re following best practices for Quill-based editors. The DEV Community demonstration confirmed the viability of coloring inserted text green and deleted text red with strikethrough using Delta ops – we will implement that logic within our SDK.

Finally, we’ll expose an API for diffing that developers can use directly if needed. For example, a static method `Editor.calculateDiff(contentA, contentB)` could return a JSON structure of differences (perhaps a list of changes with positions and types). Under the hood it will use the same Delta.diff. This might help if someone wants to integrate the diff data elsewhere (not just display in the provided UI).

## **Local Change Tracking and Autosave**

To enhance user experience, the SDK will include **live change tracking** (as described above) *and* an **autosave** mechanism to prevent data loss. The idea is that as a user edits, their changes are recorded not only in memory but periodically persisted to local storage. This covers scenarios like accidental refresh or closing the tab – the content can be recovered.

**Autosave Implementation:**

* We will add an `autosave` option (default off or on, depending on preference). If enabled, the editor will automatically save the current content at a specified interval or event.
* A straightforward strategy is to listen for Quill’s `text-change` events (which occur on every user edit). We can throttle or debounce the save action to avoid writing too often. For example, after any change, wait 5 seconds of inactivity then save, or save at most once per 30 seconds during continuous typing. The interval could be configurable.
* Saving involves taking the editor content (likely as Delta or HTML) and writing it to localStorage or IndexedDB. We’ll use a key that includes the document ID (so multiple docs don’t clash). For instance: key `"docDraft:<documentId>"` mapping to the content. We might store the Delta (as a JSON string) because it’s compact and can be reloaded precisely. Or store HTML if easier – but HTML might be larger and could include tracked changes markup. Delta is a cleaner representation (and small). We also might want to store the list of tracked changes separately, but those could be reconstructed via diff with the baseline if needed. A simpler approach: just store the full current content state.
* We also store a timestamp of last save. Possibly as part of the same object or another key `"docDraftMeta:<id>"`.
* On editor initialization, we check localStorage for `docDraft:<id>`. If present, and if the timestamp is newer than the last known saved version (we might need the app to provide last server-saved timestamp via metadata), we have a possible unsaved draft. We can then do one of:

  * Automatically load the draft (assuming it’s user’s latest content).
  * Or prompt the user: “Unsaved changes were found for this document. Do you want to restore them?” This could be a callback to the host app or a built-in confirm.
* This ensures that a user who navigated away or lost connection can resume without losing more than a few seconds of work.

Using localStorage is convenient but has size limits (\~5MB per domain). If documents can be larger, IndexedDB would be safer. We might initially implement with localStorage for simplicity, and document that it’s meant for drafts, not long-term storage. If needed, we can switch to IndexedDB via localForage, which handles binary and larger payloads (or offer a config to choose storage backend).

We should also consider clearing the draft once it’s no longer needed:

* After successfully saving to the server (if the app does so), the app could instruct the SDK to clear the draft via an API call (`editor.clearDraft()` or we automatically clear when `version` prop increases, implying a new official save).
* We might keep a few old drafts (in case user wants to undo beyond what the editor’s undo provides), but that complicates things. Probably not needed; we rely on the app’s version history or track changes for that.

**Change Tracking vs Autosave:** They complement each other. Track changes marks what is different from the baseline version. Autosave ensures those differences aren’t lost on crash. We will integrate them such that autosave saves the full content including any change marks. Alternatively, we might want to save the *clean version plus changes separately* (especially if the user hasn’t accepted changes yet). However, given that track changes markup is part of the content state (Delta includes those spans with attributes), saving that state exactly will allow restoration including the pending changes. That might be desirable (the user comes back and still sees their suggestions marked). If the app rather would merge them on reload, that could also be an option but probably not by default.

**Emphasizing Importance:** Autosave is a known best practice for in-browser editors: *“When you work in the browser, you must auto-save your work if it is more than a few minutes worth of work.”*. We take that advice seriously. By default we might enable autosave with a sensible interval (like 30 seconds) and make it unobtrusive (no freezing; use non-blocking storage calls if possible).

If using localStorage, writing a large document could momentarily block the main thread (because localStorage is synchronous). For better performance, IndexedDB (asynchronous) would be ideal. We might implement using IndexedDB for saving the Delta JSON. The complexity is not too high with modern APIs or localForage.

**Integration with Undo/Redo:** Quill has a History module that captures operations for undo/redo. We will not override that. However, track changes introduces a scenario: if a user “undo” an action that was a tracked insertion or deletion, we need to undo the associated highlight/mark as well. If we implemented track changes via normal Quill ops, undo should naturally revert them (since we inserted the strikethrough text via an operation which would be undoable). We should test and ensure that works seamlessly. The autosave does not directly affect undo except that after a reload, Quill’s internal undo stack is cleared (which is fine).

**Collaboration / Multiple Tabs:** While not explicitly asked, one must ensure that if the same document is open in two tabs, autosave in one doesn’t overwrite the other unexpectedly. We could incorporate a simple mechanism like saving a session ID with the draft, and if another session’s edits are present, handle accordingly. But likely out of scope; assume single user editing at a time.

## **Page Layout: Margins and Header**

To simulate a document page, we allow **configurable margins** and a **header/letterhead section**:

* **Margins:** The Editor component will accept props like `marginLeft`, `marginRight`, `marginTop` (and possibly `marginBottom` if needed for completeness). These could be given in CSS units (e.g., `"1in"` or `"50px"`). We will apply these margins by setting appropriate padding on the editor container or adjusting width:

  * For left/right, easiest is to give the editor’s content container a left and right padding. This creates visible whitespace on either side. If we want a visible page outline, we could give the container a white background and a subtle border while the surrounding area is grey – that’s cosmetic but gives a “page” feel.
  * Top margin can be achieved via padding-top on the content area (or simply by pushing down content below the header).
  * Bottom margin is only relevant if we simulate pages; otherwise, the bottom margin in a web context is just some extra space at bottom which might not be needed.

  If in the future we wanted page breaks, bottom margin plus page height calculation would come into play, but initially not required.

* **Header/Letterhead:** The SDK provides a prop (say `headerContent` and related `headerHeight` etc.) to include a non-editable header area. This is useful for letterheads or templates. Implementation details:

  * In the Editor render, if `headerContent` is provided, we include the `Header` component. This component simply takes the HTML string (or React element) and renders it inside a container `<div class="editor-header">`. We apply a fixed height (if given). If height is not given, we determine it either by the content height or default to something. A fixed height is simpler for layout calculations.
  * We ensure the main editor content starts below this header. If the header is in normal flow above the editor div, it will naturally push content down. If we absolutely position it, we then add margin-top to content. It’s easier to just keep it in flow with a fixed height (maybe with overflow hidden if needed).
  * We mark the header as read-only. We can do this by not including it in the Quill editable area. Alternatively, one could integrate the header into the Quill editor but set it as a read-only blot. That’s overkill – we can keep it separate from the editing area.
  * The header can contain an image (logo) and text. We’ll likely allow styling via provided HTML. The user (developer using our SDK) can style it via that HTML or we provide a couple of simple style options (like alignment, maybe through CSS or additional props).

  **Example:**

  ```jsx
  <Editor 
    header={<div><img src="logo.png" style="height:50px"/><h2>Org Name</h2></div>}
    headerHeight={60}
    marginLeft="1in" marginRight="1in" marginTop="1in"
    ...
  />
  ```

  This would render a 60px tall area with the logo and Org Name at top, then 1 inch of space before text on top (so effectively the logo might be within that top margin if we combine them, or we count header as part of top margin). We need to clarify: If marginTop is provided along with a header, probably the header sits in the marginTop area. Another interpretation is header effectively replaces some top margin. We should define it: likely, the header occupies the top margin, so perhaps we say “top margin includes header height if header exists”. Simpler: if header given, marginTop could be ignored or only apply after header. Probably better to treat header as separate and still give marginTop padding above first text below header if needed (like space between header and content).

  * The header will be included in exports:

    * For PDF, we might overlay it on each page (but that requires more advanced pagination logic). Initially, we may just include it at the top of the content as a static element (which will appear at top of first page).
    * For DOCX, as noted, html-to-docx supports a separate headerHTML string which will become the Word document header (on every page or first page depending on library). We can feed `headerContent` to that.
    * We will document that repeating header on each page in PDF may not happen unless the user prints the page with a manual header setting. But at least it will show on page 1.
  * We will ensure that the header content is not editable and not selectable (maybe add `user-select: none` CSS if needed, though it might be fine if they can select it, just not change).

* **Visual Indicator of Margins:** We might add subtle guide lines to show where the margins are (like vertical lines or shading beyond margin). This is low priority cosmetic. Possibly we can add a CSS dashed line at the margin boundary for reference (similar to Word’s text boundaries if enabled). If easy, we do it; if not, skip.

* **Multi-page Layout (future):** We acknowledge that to fully simulate pages (with repeated header on each), one would need to implement pagination (splitting content into multiple `div` pages). This is quite complex in a contenteditable (you’d need to detect page overflow, manually move content to next page container, etc.). We will **not attempt true pagination** in this initial implementation. Instead, we provide the margins and header primarily for print/export formatting and visual consistency. The content will scroll continuously as a long page in the editor. When exporting to PDF or DOCX, those margins will translate to actual page margins in the output (we can configure that: e.g., html-to-docx allows specifying page size and margins in the `documentOptions`, which we will set based on the given margins, and for PDF, we can perhaps configure jsPDF page margins).

  By focusing on these aspects, we satisfy the requirement of letting the user configure margins and a header for their document template, which is often needed for official documents or letterheads.

## **Selection-Based Custom Actions**

The editor will allow custom actions on selected content, exemplified by “Accept” or “Reject” changes for tracked edits. We have covered accept/reject extensively in the track changes section, so here we’ll summarize and generalize how selection-based actions can be implemented:

* **Detecting Selection and Context:** Quill’s `selection-change` event informs us when the user selects a range of text. We can use this to determine if the selection intersects a tracked change. For instance, if the user clicks on a green highlighted insert, the selection-change event will fire with a range inside that insert span. We can examine the formatting at that index (Quill API `getFormat(index)` returns the attributes at a position). If we find an attribute like `inserted: true` or a `changeId`, we know the selection is within a change. We can then, for example, highlight the corresponding change entry in a sidebar or enable the accept/reject buttons.

* **Accept/Reject Buttons:** We will add these either to the toolbar or as inline UI. In the toolbar scenario, these buttons, when clicked, will call something like `editor.acceptSelectedChange()` or `editor.rejectSelectedChange()`. That method will figure out which change the current selection pertains to. If we stored change IDs as mentioned, we can find the change span by looking at the formats in the selection. Alternatively, we can store positions, but since content shifts, the ID method is more robust.

  We will likely go with the approach of tagging spans with changeId and storing metadata separately. Then:

  ```js
  acceptSelectedChange() {
    const range = quillRef.getSelection();
    if (!range) return;
    const [blot, offset] = quillRef.getLeaf(range.index); 
    // or use getFormat as mentioned:
    const formats = quillRef.getFormat(range);
    if (formats.changeId) {
       acceptChange(formats.changeId);
    }
  }
  ```

  This way, it doesn’t matter if the whole change is selected or just cursor inside it.

* **Custom Actions API:** Beyond accept/reject, maybe a developer wants to add their own action, e.g., a “Comment” button that opens a comment on selected text. We can support that via the plugin system:

  * Provide a method `editor.getSelectedText()` and `editor.getSelectionRange()` for developers to use (Quill already has getText(range) which we can expose).
  * Allow them to add toolbar buttons through config. Possibly, we provide a prop like:

    ```jsx
    <Editor 
      customActions={[
         { label: "Comment", icon: CommentIcon, onClick: (editor) => { 
              const text = editor.getSelectedText(); openCommentModal(text);
           }
         }
      ]} 
    />
    ```

    Our Editor would merge this into the toolbar.
  * If more advanced integration needed (like a context menu on selection), that might be custom-coded by the developer using our API. We ensure they can get the needed info and manipulate the document (via methods like editor.insertText, etc.).

* **Programmatic Highlight & Patching:** The requirement mentions programmatic highlight and patching capabilities. This could mean:

  * **Highlighting programmatically:** e.g., the host app finds a certain word or range and wants to highlight it (maybe search results or custom marking). We can expose a method `editor.highlightRange(index, length, cssClass)` which wraps that range in a span with the given class or format. This is similar to how we handle track changes highlights, but as a general utility for any purpose.
  * **Patching content:** perhaps applying a diff or change programmatically. For example, “patching” might refer to applying an update to the content at a specific range (like replacing a phrase with another). We will support that by simply offering Quill’s editing operations as methods: `editor.replaceText(index, length, newText)` which under the hood does a delete + insert. Or even `editor.applyDelta(delta)` if an outside diff is provided. Quill’s API `updateContents(delta)` can apply a Delta to the current content; we can wrap that.

  Accept/reject is essentially a specific patch operation (either remove formatting or remove text), so it fits in here.

* **Testing Accept/Reject Flow:** We will test scenarios to ensure that after accepting or rejecting, the editor content is correct and no ghost formatting remains. Also that the undo history for accept/reject might be separate actions but that’s acceptable (the user might undo an accept which would re-mark the change – we could allow that, but it might be complicated; perhaps once accepted, to reintroduce a change, they'd have to re-edit manually).

## **Optional Features via Plugins**

Beyond the core editing and track changes, our SDK offers optional enhancements. Each of these will be designed as a plugin that can be activated through props or configuration, keeping them out of the way (and out of the bundle) when not needed.

### Line Numbers Gutter

For certain use cases (reviewing legal documents, or in code editor mode), showing line numbers is useful. Implementing line numbers in a WYSIWYG text editor is non-trivial because the concept of a "line" depends on layout (wrapping, etc.). We have a simplified plan:

* We can define a “line” as a block element in Quill’s document model. Quill treats each paragraph or list item as a block (BlockBlot). We could number those. For example, every `<p>` or `<h1>` is a new number. This would not number wrapped lines separately, but at least number each paragraph. This might suffice for certain references (like saying “see paragraph 5” rather than actual line 5).
* Alternatively, we attempt to number physical lines: we could use CSS `white-space: pre-wrap` and a monospace font to ensure consistent line breaks, but that’s not suitable for a general rich text doc.
* Given this is optional, we might implement the simpler “block number” approach first. This could be done by CSS counter:

  ```css
  .ql-editor p::before {
    counter-increment: line;
    content: counter(line);
    display: inline-block;
    width: 3em;
    margin-right: 0.5em;
    color: #aaa;
  }
  ```

  This would put numbers before paragraphs. However, this pseudo-element would be inside the editor content, which might interfere with editing (the user might see it as part of text?). Actually, if positioned absolutely or with `user-select: none`, it might be okay. But pure CSS might not perfectly align for multi-line paragraphs.
* Another way: create a separate div on the left that overlays the editor. As the editor content scrolls, update the numbers in the gutter. This is how CodeMirror/Monaco do it (but they have a fixed line height assumption).
* We can leverage Quill’s API to get the list of lines (Quill has `getLines()` which returns an array of Blot or segments for each block). We can do `editor.getLines()` and then for each, render a number in the gutter. We can update this on content change or scroll.
* Simpler: using the CSS approach as a quick solution. We just have to ensure it’s styled not to disrupt editing. Possibly making it position absolute to the left and the editor text indent that much.
* Since this is an edge feature, we can document that it numbers paragraphs, not physical lines. If true per-line numbering is needed, we might consider switching to a code-editor approach or pre-formatting text.
* We will hide line numbers in print/PDF output unless explicitly wanted (line numbers usually for onscreen reference).
* The activation: a prop `showLineNumbers={true}` triggers injecting the necessary CSS or rendering the gutter component.

### Table of Contents / Index from Headings

Generating an index of headings can be done as a one-off function or a live component. Possibly:

* Provide a method `editor.generateTOC()` that scans the content for heading formats. Quill Deltas include a `header` attribute for lines that are headers (with value 1, 2, etc. for <h1>, <h2>). We can do:

  ```js
  const lines = quill.getLines();
  const toc = [];
  lines.forEach(line => {
    const format = quill.getFormat(line); 
    if (format.header) {
       toc.push({ level: format.header, text: line.innerText, index: quill.getIndex(line) });
    }
  });
  ```

  This gives us an array of {level, text, index}. We can then either return that or render a component.
* We could offer a React component `<DocumentOutline />` that takes the editor instance (or content) and displays a nested list of headings. If integrated, it might subscribe to changes to update live.
* The actual text of headings we might get by stripping any inline formatting from the line. Quill’s `getText(start, length)` can give plain text of a segment.
* If the document is large, scanning every time could be heavy, but we can optimize by re-scanning only on structure changes or on demand (like when user opens an outline panel).
* For simplicity, we might not automatically update it in real-time, but rather generate on request (e.g., clicking “generate index”).
* If we want to allow inserting a static TOC inside the document for printing, we could provide an `insertTOC()` method: it would compute the toc, then insert a list at the current cursor position with that content and appropriate links or page numbers. However, page numbers require knowing page breaks which we don’t have in dynamic mode. Possibly not implement page numbers. Maybe just a list of headings (with indents for levels) as plain text.
* Initially, focusing on an *outline view* externally might be more realistic. This satisfies the feature of having an index from headings.

### Markdown Support Plugin

There are a couple of aspects to Markdown support:

1. **Importing Markdown** – taking a .md content and showing it in the editor as formatted text.
2. **Exporting to Markdown** – extracting Markdown text from the formatted content.
3. **Markdown Editing Mode** – letting the user toggle to a markdown editor.

We will implement 1 and 2 for sure, and consider 3 as a possible extension if time permits:

* **Import:** If `initialContentFormat="markdown"` or a method `editor.setMarkdown(markdownText)` is used, we will:

  * Use a library like *marked* (which is a markdown-to-HTML parser) to convert the markdown text to HTML. Or *remark* for more control. Marked is straightforward: `const html = marked(mdText)`.
  * Then insert that HTML into the editor. Quill can insert arbitrary HTML via its clipboard converter: `quill.clipboard.dangerouslyPasteHTML(html)`. This will turn it into Quill’s internal Delta format, applying corresponding formatting (for headings, bold, etc.). This is a quick way to get Markdown content in with proper rich text formatting.
  * Alternatively, we could parse markdown to an AST and map to Delta manually, but using the HTML as intermediary is fine, as long as we trust the HTML (the markdown is from user or file, but presumably safe).
  * We may need to handle markdown specific elements like code fences (Quill has a code-block format, which might suffice, or we define a custom if needed for certain things).
  * After this, the user can edit in WYSIWYG normally. If they have the plugin active, maybe certain behaviors can emulate markdown (like typing `**bold**` auto-turns bold). That would require intercepting input patterns – possibly a future enhancement (some editors do “Markdown shortcuts”).
* **Export:** If the user wants the content back as Markdown (for saving .md file or versioning in text):

  * We can get the HTML from Quill (`quill.root.innerHTML` or using a dedicated exporter to ensure proper HTML).
  * Then use a library like *Turndown* which converts HTML to Markdown. Turndown can be configured to handle headings, lists, etc., producing a markdown string.
  * Provide an API `editor.getContent('markdown')` that returns this string.
  * The challenge is if track changes are on and content has <ins>/<del> or spans with classes, the HTML would include those. We likely should strip or ignore those when exporting to markdown (unless we want to preserve the change markers in MD, which is probably not needed). So perhaps when exporting, if there are unaccepted changes, we either decide to export the *final* version (as if all accepted) or just export the raw HTML including the tags which might not translate well to MD. Probably best to either require changes be resolved or export with them as plain text with maybe ~~strikethrough~~ markdown for deletions and some **highlight** for additions (though markdown doesn’t have a direct highlight, could use ++ insertion++ syntax used by some extended MD). That might be an edge case; we can note it as a limitation or future feature.
* **Markdown Editing Mode:** This is more complex but adds value:

  * We would provide a toggle that replaces the rich text editor with a text area (or a code editor component) showing the markdown source. The user can then edit the raw MD and toggle back to WYSIWYG.
  * To implement: We maintain two sources of truth – either the Delta and the markdown text. Ideally, we generate markdown from Delta for the initial switch. Then as the user edits markdown, we keep that text, and on toggling back, we parse it to Delta again. There might be changes lost if some formatting isn’t representable in MD (like if there were images or advanced styling).
  * It might be fine for simpler documents.
  * Using a dedicated editor like **CodeMirror** or **Monaco** for markdown could provide syntax highlighting. But that adds a heavy dependency. Instead, maybe a plain `<textarea>` or a simple code mirror (which we could lazy-load if enabled).
  * Given the time, we might mark the markdown source mode as a future enhancement. The MVP can provide import/export of markdown which covers interoperability without an interactive editing mode.

Activating the Markdown plugin could be via a prop `enableMarkdown={true}` which then allows using certain methods (like import/export) or shows a toggle UI if we implement it. Or via the `plugins` array: e.g., `<Editor plugins={[MarkdownPlugin]}>` where MarkdownPlugin when initialized could insert a “Markdown mode” toggle button and override certain behavior.

### Other Potential Plugins (just briefly):

* **Spellcheck/Grammar check:** Not explicitly asked, but a common feature. Browsers have spellcheck in contenteditables by default (and Quill doesn’t disable it as far as I know). So basic red underlines will appear by browser. We could integrate with an API for suggestions, but out-of-scope.
* **Collaboration (CRDT) plugin:** Also not asked, but if we were to expand, using something like Yjs or ShareDB could make it collaborative. However, track changes in a live collaborative environment is quite complex (deciding how to attribute changes in real-time). So not in this plan.
* **AI integration plugin:** Possibly a future idea (like grammar suggestions or content generation), not in current scope.
* **Code editor mode:** The user’s uploaded plan mentioned multi-modal (code, terminal). Not directly in the question, but if we wanted, we could integrate something like Monaco or highlight.js for code blocks. This would be an advanced plugin where a particular region of the document becomes a code editor. But likely beyond initial scope.

In all cases, the **single-package** approach holds: even if we add plugins, they live in the one package namespace. They might be imported or activated dynamically, but we are not publishing them separately.

## **State Management & API Design**

To ensure clarity for developers using our SDK, we will design a clean API with both React component props and imperative methods. Here’s what using the SDK might look like for a developer:

**Basic Usage Example:**

```jsx
import { Editor, DiffViewer } from 'my-wysiwyg-sdk';

function MyDocumentEditor() {
  const editorRef = useRef();

  const handleSave = () => {
    const content = editorRef.current.getContent('delta');  // get Quill Delta
    saveContentToServer(content);
  };

  return (
    <Editor 
      ref={editorRef}
      documentId="123" version={1}
      initialContent="<p>Hello <b>world</b></p>"
      metadata={{ title: "Example Doc", created: Date.now() }}
      trackChanges={true}
      autosave={true}
      header={<HeaderComponent/>}
      marginLeft="1in" marginRight="1in" marginTop="1in"
      showLineNumbers={false}
      enableMarkdown={false}
      onChange={(contentHtml) => console.log("Content changed")}
      onSave={(content) => console.log("Autosaved draft", content)}
    />
  );
}
```

In this snippet:

* We pass `trackChanges={true}` to enable live track-changes mode.
* `autosave={true}` to turn on the autosave with default interval.
* We provided a custom header component (could also be an HTML string).
* Margins set to 1 inch each side.
* We turned off line numbers and markdown features for now.
* `onChange`: a callback that could be invoked on every substantial content change (perhaps debounced, not on every keystroke to avoid flooding; we can fire it on focus lost or explicitly when asked).
* `onSave`: callback when an autosave happens (giving the saved content, maybe as Delta or HTML).
* The ref usage: We expose imperative methods through `editorRef.current`. E.g. `getContent(format)`, `acceptAllChanges()`, etc.

**Key Methods to Implement:** (accessible via ref or maybe via props function)

* `getContent(format?: string)` – returns the content in the requested format. If no format, default could be HTML or Delta. Supported formats: `"delta"`, `"html"`, `"text"`, `"markdown"`. This uses our utils to convert if needed. (We will likely implement `'delta'` and `'html'` easily via Quill, `'text'` via Quill’s getText, and `'markdown'` via plugin if enabled.)
* `setContent(content, format)` – to programmatically replace the content (maybe not always needed, but could be useful to load a new doc or reset). We have to be careful if track changes is on – setting new content might mean clearing changes or diffing with old? For now, setContent can just load new content as if new document (clearing any tracked changes state).
* `getMetadata()` – returns the documentId, version, and any other metadata we stored (could be trivial as we already have those in props/state).
* `focus()` – focus the editor (just calls Quill focus).
* `formatText(range, formats)` – a general method to apply formatting; not usually needed externally because user uses toolbar, but nice for developers to mark text (like highlight search results).
* **Track changes specific:**

  * `getChanges()` – returns an array of change objects (each with id, type, text, author, timestamp, etc. and maybe current index in doc). This can be used by host if they want to display changes differently.
  * `acceptChange(id)` / `rejectChange(id)` – as discussed.
  * `acceptAllChanges()` / `rejectAllChanges()` – convenience to iterate all (could simply call the above for each tracked change).
  * Possibly `toggleTrackChanges(enable)` – but since we have prop trackChanges, maybe use that. If a dev wants to turn it on/off dynamically, they can call a method or set state to re-render Editor with trackChanges off (in which case we might finalize all current changes, or just stop tracking new ones).
* **Diff / Versions:**

  * `showDiff(originalContent, newContent, viewMode)` – maybe transform the current Editor into a diff view. But we separated DiffViewer component, so usage is rather to render `<DiffViewer>` with those props. We can still provide `DiffViewer` in our exports.
  * If using DiffViewer via code: e.g.

    ```jsx
    <DiffViewer original={oldText} modified={newText} view="split" />
    ```

    The DiffViewer internally will use diffUtils to compute diff and then render two editors or one editor accordingly. We can allow passing perhaps Delta or HTML. The DiffViewer might accept either raw content or a Delta (we can detect type).
* **Markdown:**

  * `importMarkdown(mdString)` – sets the editor content to the parsed markdown (internally calls setContent with HTML from md).
  * `exportMarkdown()` – returns current content as MD (calls getContent('markdown')).
  * If a mode toggle was implemented: `toggleMarkdownMode()` which switches between WYSIWYG and markdown text.
* **Other:**

  * `insertImage(url or file)` – maybe we provide helper to insert an image (Quill can insert images if you supply base64 or URL, but one might need upload handling. Possibly out-of-scope except via Quill’s default image uploader which just opens a prompt for URL).
  * `destroy()` – ensure to properly unmount the Quill instance if needed (though if inside React, this happens on component unmount).

We will also consider **exposing the underlying Quill instance** in case developers want to do something advanced that we didn’t wrap. ReactQuill usually provides a way via the ref: e.g., `editorRef.current.getEditor()` returns the Quill instance. We can do the same (or just include needed Quill methods in our own API). For transparency, likely we allow `editorRef.current.quill` to access Quill, or a method `getEditor()`.

**State management internal:** We touched on it but to reiterate:

* The Editor component will use `useState` or `useReducer` for things like the list of changes (if trackChanges on), the current content (if we want to also hold it in React state for controlled mode), etc.
* For autosave timing, we may use `useEffect` to set up an interval or subscribe to text-change events and handle them.
* For plugin management, when the component mounts, based on props we initialize the plugins. Some plugins might have their own internal state (e.g., trackChanges might manage the changes list and need to force re-render of changes sidebar). We can leverage React context to provide, say, a ChangesContext to a ChangesSidebar component.
* However, an alternative is to not use context at all but have Editor render those subcomponents and pass needed data as props. E.g., `<ChangesSidebar changes={changes} onAccept={acceptChange} />`. That might be simpler.

**High-level Data Flow:**

* The Quill editor is the single source of truth for the document content displayed.
* We maintain additional data structures for meta-features (like `changesMap` for track changes).
* On each user action, Quill updates its content and emits events. Our handlers capture those events to update our structures (e.g., add a new change entry, or trigger autosave, etc.).
* We then possibly cause re-renders of certain subcomponents (e.g., an updated changes list).
* But we do *not* re-render the main Editor on every keystroke, because the Quill DOM is separate. We only re-render React when needed (like toggling a mode, or updating the header, etc.). ReactQuill usually keeps the Quill instance outside React’s diff, which is good for performance. We’ll do similarly.

**Versioning and Releases:** For the SDK package itself, we will follow **Semantic Versioning** (SemVer) for publishing (e.g., start at v1.0.0 for initial stable release, and increment MAJOR for breaking changes, MINOR for new features, PATCH for fixes). Adhering to SemVer and having clear deprecation policies will build trust with developers. We will document the API thoroughly to reduce breaking changes. Also consider using a change log.

## **Export Capabilities (PDF, DOCX, etc.)**

We want to allow exporting the document in common formats for external sharing or printing:

* **PDF Export:** Likely provide a method `exportPDF(options)` that the developer can call (maybe behind a button in their UI). Implementation:

  * Use jsPDF or a combination of html2canvas + jsPDF. One straightforward way: use `html2canvas` to capture the editor DOM as an image and then jsPDF to put that image in a PDF. But that yields a flat image PDF (not selectable text).
  * Better: use jsPDF’s text functions or PDFMake which can create text objects. But converting arbitrary styled HTML to PDF programmatically is complex (especially with images, lists etc.).
  * There are libraries like **pdfmake** which accept a JSON doc definition or **Puppeteer** (server-side).
  * On client side, another approach: open a print dialog (window\.print) and let user save as PDF (this preserves text and images). We could style a print CSS for the editor content to format it nicely for PDF output (with margins and maybe repeated header using CSS `@page` if browsers support).
  * Perhaps the simplest cross-browser solution: instruct users to use print to PDF via the browser. We can add a small utility: `window.print()` triggers print dialog. We ensure our editor print stylesheet is good (hide buttons, maybe apply margins as per settings using `@page margin`).
  * We will include instructions or an optional function that opens the print dialog, which effectively covers PDF export on all modern browsers (since they let you save as PDF).
  * If a true programmatic PDF is needed (say to upload PDF file to server), we might use jsPDF. But note that jsPDF doesn’t easily handle multi-page flow with content and CSS. It might require splitting content by pages and adding manually.
  * Given time, we may initially rely on print-to-PDF as the recommended approach (with maybe a small integration: a print icon that calls `window.print()`).
  * We will at least document how to do it, and possibly integrate a basic usage of html2pdf (which wraps html2canvas + jsPDF).

* **DOCX Export:** We intend to use the *html-to-docx* library. Implementation:

  * Provide `exportDocx()` method. When called, it will gather the current content HTML and the header HTML (if any), then use the library’s function (which returns a blob or arrayBuffer of the docx file).
  * For example, html-to-docx usage:

    ```js
    import HTMLtoDOCX from 'html-to-docx';
    const htmlString = `<html><head></head><body>${editorHtml}</body></html>`;
    const fileBuffer = await HTMLtoDOCX(htmlString, headerHtmlString, options);
    // then trigger a download:
    saveAs(new Blob([fileBuffer]), "document.docx");
    ```

    We’ll need to bring in a blob-saving utility or use the browser’s download attribute.
  * We can optionally allow some `documentOptions` (like page size) but likely just default to A4 or letter based on margin settings.
  * This library might not work directly in browser (its README said “doesn’t work with browser directly, but tested with React”, possibly it needs some polyfill for Node libs). If it’s problematic, an alternative is **html-docx-js** (older but might be simpler).
  * Regardless, we’ll test it out and ensure it produces a viable Word file. This allows users to take their content into MS Word or Google Docs for further editing.

* **Markdown Export/Import:** Already covered above – essentially the “plugin” that also serves as an export format. We have `getContent('markdown')` using Turndown to generate MD, and ability to load MD content via a function or initial prop.

* **HTML Export:** Because Quill content is in HTML (the `.ql-editor` innerHTML), providing HTML is trivial. We will give `getContent('html')` which returns the HTML string of the editor content (possibly wrapped in some container or not). If the editor content includes track change markup (spans, classes), the HTML will include those. If the user wants a clean final HTML with changes accepted, they should either accept changes first or we provide a parameter to get HTML with all suggestions accepted (we could simulate accept-all in a clone of the Delta then output HTML). Might not do initially.

* **Plain Text Export:** Quill provides `getText()` to get plain text. We’ll expose that as `getContent('text')`.

All export functions will be optional for the user to call. We might also add UI buttons if needed, but likely not by default (except maybe a print button if requested). It’s better to let the host app decide when to offer export (some might have a “Export…” menu or something outside the editor).

We must ensure to **cite any library** usage clearly in docs (for license compliance), but programmatically it’s fine.

## **Performance and Maintainability Considerations**

Throughout development, we will keep performance in mind:

* Using Quill v2 already gives us a good baseline (it has *“improved rendering speed for large content”* and other optimizations). We will test the editor with large documents (several hundred pages equivalent) to see how it holds up. If needed, we might recommend using the diff and track changes features on moderately sized documents, as extremely large docs with thousands of changes could be slow. In future, strategies like virtualization (rendering only visible portion) could be explored, but Quill doesn’t natively support that out-of-the-box – as noted, implementing true virtualization is complex and would be a future iteration if required.

* Our additional logic (for diff highlighting, etc.) mainly runs on user actions or on diff view activation – not continuously – so it should not degrade typing performance. We will ensure heavy computations (like full diff of the whole doc) are not done on every keystroke (only on demand or with debounce).

* We will also avoid memory leaks: each Editor instance on unmount should `.off()` any Quill event handlers we attached and `.destroy()` the Quill editor. The react-quill-new likely handles basic cleanup, but our plugins might attach global listeners (like on window for keydown etc.) – we must clean those up in useEffect return handlers.

* **Bundle size:** We choose libraries carefully. Quill v2 compressed is around 50 KB (plus some for its theme CSS). Our code will add to that. We include possibly html-to-docx (\~**130KB**), which is a bit heavy – but if we only import it when needed (dynamic import in exportDocx), then it won’t bloat initial bundle. Similarly, Turndown ( \~20KB) and marked (\~30KB) are not too bad. We’ll ensure these are optional.

* Using tree-shaking and conditional imports will keep initial load small. E.g.,

  ```js
  async function exportDocx() {
    const HTMLtoDOCX = await import('html-to-docx');
    // then use it...
  }
  ```

  This way, unless exportDocx is called, the lib isn’t loaded. Webpack or others will separate it.

* The build process will produce an **ESM bundle** (for modern usage) and possibly a UMD build for legacy/script tag inclusion. We’ll mark heavy dependencies as external in UMD if not needed (like if someone just includes our script in a page that already has React and Quill).

* **Testing:** We plan comprehensive testing, especially for track changes logic (applying sequences of changes, ensuring accept/reject yields correct results). Also test the diff output correctness. Integration tests to simulate user typing with track changes on etc. This ensures reliability.

* **Documentation & Sample Code:** We will provide clear docs with code examples (somewhat like parts of this plan). The maintainability of the project will also be aided by following a clean code structure, comments, and using TypeScript to make the code self-documenting.

**Publishing Strategy:**

* We’ll use a toolchain (maybe **Rollup** with plugins or **tsup** which is a TS bundler) to produce the final library files. We’ll ensure source maps are included for debugging.
* The package.json will specify appropriate fields: `"main"` for CJS bundle, `"module"` for ESM, `"types"` for .d.ts entry.
* We will add **peerDependencies** for `react` and `react-dom` (since the host app should provide those). Quill can be a normal dependency bundled inside (so user doesn’t have to separately include Quill).
* Versioning as mentioned with SemVer. The initial release 1.0.0 will undergo thorough testing.
* We will also include license info for our package and acknowledge any third-party code we used (ensuring none of them have incompatible licenses).
* Possibly set up CI for automated testing and publishing on Git tags, to streamline releasing updates.

Finally, we ensure the design remains **maintainable** by modularizing functionality. For example, if Quill releases v3 or if we want to swap out the core engine in future, having our features in distinct modules will isolate the impact. We also learn from CKEditor5’s architecture (highly modular with plugins) – we emulate that in a simpler form for our needs.

## **Conclusion and Example Use Cases**

By following this plan, we will create a robust WYSIWYG editor SDK that developers can drop into their React applications to handle rich text documents with advanced features like track changes and diff viewing. The approach leverages Quill.js’s proven editing capabilities and extends it to meet our requirements, which is far more efficient than writing an editor from scratch. The output will be a **single NPM package** that is feature-packed yet lightweight due to its modular architecture and modern build optimizations.

Here are a few **code snippet examples** demonstrating usage and extensibility:

* **Initializing the Editor with all features on:**

  ```jsx
  <Editor
    documentId="DOC-42" version={7}
    initialContent="<h1>Project Plan</h1><p>Initial draft content...</p>"
    trackChanges={true}
    autosave={true}
    header={<div class='letterhead'><img src='logo.png'/> ACME Corp</div>}
    marginLeft="50px" marginRight="50px" marginTop="80px"
    showLineNumbers={true}
    enableMarkdown={true}
    onSave={(delta) => console.log("Draft saved, ops:", delta.ops)}
  />
  ```

  *This sets up an editor for document 42 version 7, with track changes and autosave enabled, a custom header (with a logo and company name), 50px side margins, 80px top margin, showing line numbers, and markdown support (the user could import/export MD). The onSave logs draft Delta to console.*

* **Diffing two versions side-by-side:**

  ```jsx
  const v1 = getDocumentVersion(1);  // retrieve version 1 content (HTML or Delta)
  const v2 = getDocumentVersion(2);  // retrieve version 2 content
  <DiffViewer originalContent={v1} newContent={v2} view="split" />
  ```

  *This will render a split view diff of version 1 vs version 2, with insertions highlighted in the right panel and deletions in the left panel. If `view="unified"`, it would instead show a single combined view.*

* **Accepting a change programmatically:**

  ```js
  // Suppose we have a change ID we want to accept:
  editorRef.current.acceptChange("change-17");
  // Or accept all:
  editorRef.current.acceptAllChanges();
  ```

  *This could be triggered by a custom UI outside the editor. Internally it will apply the change to content.*

* **Export to Markdown and PDF:**

  ```js
  const mdText = editorRef.current.getContent('markdown');
  downloadAsFile(mdText, "document.md");  // a helper to trigger download
  // For PDF using print:
  editorRef.current.print();  // We provide a print method to open print dialog
  ```

  *The above gets markdown text and triggers a download (assuming we implement or instruct using a blob URL download). For PDF, calling print() would call window\.print() behind the scenes after maybe adjusting layout for print.*

* **Custom plugin usage:**
  Imagine a plugin that adds a "Highlight Yellow" button to highlight text background:

  ```jsx
  import { definePlugin } from 'my-wysiwyg-sdk';
  const highlightPlugin = definePlugin((editor) => {
    // Register a new format with Quill (yellow background)
    editor.registerFormat('highlightYellow', { 
      style: { backgroundColor: 'yellow' } 
    });
    // Add a toolbar button for it
    editor.addToolbarButton({
      icon: '🖍️', // some icon or text
      tooltip: 'Highlight Yellow',
      handler: () => {
        const range = editor.getSelection();
        if (range && range.length > 0) {
          editor.formatText(range.index, range.length, 'highlightYellow', true);
        }
      }
    });
  });

  <Editor plugins={[highlightPlugin]} />
  ```

  *This pseudo-code demonstrates our envisioned plugin API: The plugin function gets an `editor` instance with methods to register formats and add toolbar buttons. It defines a custom inline format (yellow background) and a button that applies it to selected text.*

The above demonstrates that our SDK is not only feature-rich out-of-the-box but also **extensible for custom needs**. We prioritized architectural clarity, using known design patterns (modular plugins, state separation, Delta-based diffing) and ensuring high performance by utilizing Quill’s efficient document model and only activating heavy features on demand. By following this plan, we will deliver a maintainable and powerful editor SDK that meets the specified requirements and can grow with future needs.

**Sources:**

1. Quill’s Delta format enables sophisticated document versioning and diffing in the browser.
2. Quill v2 (used via react-quill-new) offers improved performance for large content and a modular architecture ideal for extensibility.
3. Quill was designed with a small core and pluggable modules, aligning with our plugin-based approach.
4. Quill’s Delta.diff method computes a Delta of changes between two documents, providing an idiomatic way to track differences.
5. Libraries like *jsdiff* and Google’s *diff-match-patch* are alternative diff engines for text comparisons, but Quill’s built-in diff is preferred for rich text.
6. Example diff implementation: computing `diff = oldDelta.diff(newDelta)`, marking inserts with green highlight and deletions with red strikethrough, then composing with original to display changes.
7. Autosave is critical for in-browser editing – unsaved work should be periodically saved (e.g., to localStorage) to prevent loss.
8. *html-to-docx* library can be used to convert the editor’s HTML content into a Word DOCX file for export.
9. Adopting semantic versioning and clear upgrade policies is vital for SDK maintainability and developer trust.
