# Jewelry Orders & Customer Tracking — Demo and Project Story

An Arabic, right-to-left web application for managing jewelry repair, engraving, renewal, and catalog orders, with a separate customer-facing order-tracking experience.

This folder contains an independent portfolio demo adapted from an application developed for a real jewelry business. Business identities, original photographs, customer records, production addresses, and credentials are excluded. All supplied records and illustrations are synthetic.

The story below documents the original project's development. It distinguishes implemented code, historically verified behavior, inactive integrations, and the features simulated in this browser-only edition.

## Run the demo

On Windows, double-click `start-demo.cmd`, or run:

```sh
python serve.py
```

Open http://127.0.0.1:8877/ and keep the local server running. Python is needed for this preview server; the application itself is static HTML, CSS, and JavaScript. Any static HTTP server can serve the folder instead.

No build step, login, backend account, cloud SDK, or database service is required. Use HTTP rather than opening individual files through `file://`, and keep the same host and port across pages.

## Explore the application

1. Read the Arabic/English introduction and enter the demo.
2. Create a repair, engraving, renewal, or catalog order using fictional customer information.
3. Inspect the order from the staff dashboard, edit pieces, change its status, and record collection.
4. Open the customer-tracking link on the home page or the link on an order card.
5. Keep management and customer tracking open in separate tabs of the same browser. Changes to status and collection appear in the customer view.
6. Explore customer and catalog management, local price fields, and simulated print/message previews.
7. Use **Reset demo** to restore the sample records.

In the original customer journey, a message is intended to provide a tracking link and verification information. The customer then views their order's progress. This demo opens a fictional order directly, without verification or sending any message.

Changes are stored in the current browser profile and origin. A link alone does not transfer a locally created order to another device. Different browsers have independent records.

## The business problem

A jewelry order involves more than a customer name and a single status. Staff need to record the work requested, identify the pieces and their photos, update progress, agree on a price, and distinguish finished work from items that have actually been collected.

Customers need a smaller, clearer view: which order is theirs, what pieces it contains, and whether it is still being processed, ready for collection, or already collected. Giving customers the internal dashboard would expose unnecessary information and controls.

The project therefore developed two experiences around the same underlying order: an internal management application and a restricted customer-facing tracking page.

## Project origin and my role

This project began as an adaptation of an earlier jewelry-management application, rather than a new implementation of every component. The starting point already included customer records, multi-piece orders, catalog ordering, images, collection tracking, and administrative views.

A separate backend was established by copying the required structure without the earlier business's records. The new application then diverged to match a different workflow: renewal orders replaced watch repairs, priorities were removed, order numbering was redesigned, pricing was implemented, and customer tracking and SMS infrastructure were added.

I developed and adapted the application independently with assistance from AI tools. The work included interpreting business requirements, evolving the data model and interface, diagnosing integration failures, and checking changes against existing workflows. This account does not claim that every line was written without assistance or attach unsupported figures to business outcomes.

## Original application capabilities and status

| Area | Documented implementation |
| --- | --- |
| Order management | Repair, engraving, renewal, and catalog workflows with multiple pieces or catalog line items. |
| Customers | Reusable records, search, editing, and order-aware deletion controls. |
| Photos | Piece-specific images and galleries, with compatibility for older records. |
| Catalog | Categories, model management, and multi-model cart orders. |
| Staff dashboard | Card and monitoring-table views, search, details, editing, status changes, and collection. |
| Order identifiers | Database-generated daily sequence combined with the selected order date. |
| Pricing | Optional order-level price, editable by staff; an unset price is different from zero. |
| Customer tracking | Phone-and-code verification followed by a restricted order view and progress timeline. |
| Customer SMS | Templates and sending infrastructure built; the latest reviewed notes say sending was deliberately switched off. |
| Staff reminders | Adapted to daily, non-priority reminders; the project-specific notes describe deployment as dormant. |
| Printing | Inherited queue and local-agent design; physical setup for this business is not confirmed complete by the reviewed notes. |
| Market prices | The inherited external price integration was intentionally removed. |

These statuses come from saved development records and targeted source review. They are not a fresh inspection of the live deployment.

## Architecture

The frontend is built with **HTML, CSS, and vanilla JavaScript**, without a framework or build pipeline. A shared stylesheet defines the staff application's theme. Components handle dates and piece editing while page-specific code manages individual workflows.

The original backend uses **Supabase/PostgreSQL**, authentication, storage, access policies, and server-side functions. The customer page uses a narrow verification operation instead of direct access to staff tables.

```text
Staff application -> Authentication and access policies -> Orders and related records
                                                        -> Image storage

Customer tracking page -> Verification operation -> Customer-safe order response

SMS eligibility scan -> Atomic claim -> Message provider -> Delivery-status check

Main source tree -> Explicit deployment file lists -> Staff and customer deployments
```

Separate staff and customer deployments limit which files are served to each audience. This is a packaging boundary, not a replacement for backend access control; both experiences still depend on correctly scoped data access.

The portfolio demo brings the two interfaces together for exploration, replacing backend operations with browser-local data.

## Data-model decisions

- **One central order record** holds the order type, status, selected creation date, identifier, and optional price.
- **Piece records** support repair, engraving, and renewal work without separate tables for every variation.
- **Piece-linked photos** prevent ambiguity when an order contains several items.
- **Catalog line items** hold selected models, quantities, and snapshots of their details.
- **Collection records** represent actual handover independently of completion.
- **Snapshot fields** preserve selected customer and model information as it was when the order was recorded.
- **Customer tracking codes** are separate from readable order numbers; a predictable identifier is not used as the verification secret.
- **Messaging templates** are editable data, while message-attempt state is stored alongside the order according to the chosen scope.

The renewal workflow deliberately asks only for images, weight, purity, and notes per piece. Missing repair-description or engraving-text fields are intentional, not unfinished validation.

## Documented development stages

| Period | Development work | Reason |
| --- | --- | --- |
| Earlier foundation | Customer and order management, catalog carts, multi-piece photos, collection, and administrative views. | Reuse established workflows from the predecessor application. |
| August 23–26, 2026 | Separate project and backend structure, authentication setup, deployment preparation, and removal of the inherited market-data integration. | Isolate the new business and remove unnecessary dependencies. |
| August 26, 2026 | Shared cream/ivory theme with separate decorative and text colors. | Retain the visual character while making a light interface readable. |
| August 27, 2026 | Renewal orders, removal of priorities, daily order numbering, and catalog setup. | Adapt the application to the business's actual processes. |
| August 29, 2026 | Customer verification and tracking, plus order-level pricing. | Give customers a limited progress view and staff a usable price field. |
| August 30, 2026 | Editable SMS templates and controlled sending infrastructure; separate staff/customer deployment packaging. | Prepare customer communications and restrict public deployment contents. |
| Portfolio preparation | Generic branding, synthetic records, local storage, and direct demo tracking links. | Demonstrate the workflow without connecting to business services. |

These dates describe recorded changes, not a complete work log or a claim that every associated service went live on that date.

## Engineering challenges and solutions

### 1. Reusing an application without sharing another business's data

Copying a frontend is not sufficient isolation: it may still contain backend references, authentication assumptions, integration settings, and documentation describing the earlier system.

The new project used a separate backend structure without importing the earlier customer and order records. Frontend configuration and authentication were adapted separately. Integrations such as reminders and printing required their own setup rather than becoming operational merely because their code existed.

The development notes themselves contained inherited history. Newer project-specific changes take precedence in this account; features removed from this application are not presented as current capabilities.

### 2. Replacing watch repairs with renewal orders

The requirement was a genuine workflow change, not just a renamed button. Renewal pieces needed photos, weight, purity, and notes, without watch terminology, watch-type selection, problem descriptions, or engraving text.

The existing piece model already supported this shape, so no duplicate piece table was introduced. The accepted order types were updated, unused watch-specific components were removed, and the creation and editing templates were adapted consistently.

The notes record automated checks covering multiple renewal pieces and photos, administrative editing, and regression checks for repair and engraving fields. Database insert shapes were also checked inside a rolled-back transaction.

### 3. Removing priorities across the whole system

Priorities were intentionally removed from forms, badges, filters, table columns, data writes, and database structures. Removing only the controls would have left hidden assumptions in the reminder system.

The reminder design was simplified to daily categories for open work and completed-but-uncollected orders. Related function signatures and schedule structures were updated as well. Frontend writes were changed before dropping fields they previously referenced, avoiding requests that named a removed column.

The project-specific record describes the reminder delivery stack as dormant. This change therefore should not be described as evidence of active push delivery. Verification for this particular change was limited to static checks and syntax checks at the user's request.

### 4. Readable order numbers introduced a concurrency problem

The new identifier combines the selected order date with a daily sequence. Generating it in JavaScript with a count-plus-one approach would allow simultaneous devices to select the same next number.

Generation was moved into a database insert trigger backed by an atomic counter update. The frontend no longer supplies the number, so the rule is enforced regardless of which form creates the order.

The date is interpreted in the application's business timezone. Numbering occurs on insertion only: later editing of the displayed creation date does not change an identifier that may already be printed on a label. Deletions can leave gaps; the sequence is an identifier source, not a count of surviving orders.

The full number appears where identification matters, such as details and labels; compact displays use a shorter form. Older identifiers retain a compatible display path.

### 5. Pricing needed to distinguish “unknown” from “free”

An earlier monitoring-table renderer already anticipated a price field, but a visible column was not an implemented pricing system.

This project added an optional decimal price directly to the order. `NULL` means not priced yet; zero is a distinct value. Database checks reject negative values, and decimal storage avoids using binary floating point as the persisted money representation.

Both creation flows and the administrative price editor use the field. Clearing it returns the order to an unpriced state. The customer verification response intentionally excludes price; adding it to that experience would be a separate product decision.

### 6. Catalog categories existed but were not being read

The catalog had a category field, while its pages were still deriving categories from image paths. Preferring the field alone would not have worked because one explicit data-selection list did not include it.

The category field was added to the selected columns, both catalog pages were updated to prefer known stored categories, and path parsing remained as a legacy fallback. Imported catalog records were derived from stored objects to keep database references aligned with uploaded files.

The lesson is that adding a model property does not help a view unless that property is actually loaded. Original catalog images and import directories are not part of this demo.

### 7. A light theme required more than swapping backgrounds

Decorative gold that worked against a dark background did not provide enough contrast as text on ivory. The theme was split into a metallic palette for shapes and a darker ink palette for text and icon strokes.

Shared variables in `theme.css` allowed existing page variables to become aliases rather than requiring a full component rewrite. Conversion had to be property-aware: the same color literal can mean text, a border, a translucent overlay, or a background.

Modal panels, sticky headers, photo captions, gradient titles, and muted text required individual attention. The notes describe screenshot checks and an automated contrast audit, while also noting limitations around gradient sampling. That is evidence for the checked states, not a blanket accessibility certification.

### 8. A customer page needed a restricted data boundary

The customer should see one verified order, not browse staff tables. The original design uses phone-and-code verification followed by a deliberately limited response containing customer-facing order details.

The tracking code is independent of the order number and is not put into the original tracking URL. Phone normalization accommodates common formatting variations and invisible direction markers introduced by right-to-left input.

Incorrect phone and code combinations return the same failure shape. Rate limiting restricts repeated attempts. Direct anonymous table privileges were reduced, providing another layer alongside row-level access policies.

The documented checks exercised valid and invalid verification, lockout behavior, and rejection of direct table access. These are historical results; this documentation does not disclose actual phone numbers, tracking codes, account details, or live endpoints.

### 9. Verification failed on the successful path

Two implementation mismatches surfaced while building tracking. An extension function needed explicit schema qualification under a restricted execution search path. Another query used a legacy image-column name instead of the current catalog-line-item field.

The first prevented the database change from applying correctly. The second appeared only when a valid verification request reached the affected query.

Both were corrected against the actual schema. The lesson is to test the successful authorized path as well as failed verification; a secure-looking error path can conceal a broken success path.

### 10. The staff service worker interfered with public tracking

The staff application had a service-worker fallback that could return its login page. Applying that behavior to customer tracking would produce the wrong experience.

The customer page was kept outside the staff bootstrap, and the worker explicitly bypassed the tracking route. It uses a small, self-contained interface: verification, then a three-stage timeline and the order's pieces, models, and photos.

The customer layout also used readable text colors rather than reusing pale decorative colors for typography. A vector-based mark was extracted for the original design when a supplied raster asset had an unsuitable baked-in background. No business mark is included in the demo.

### 11. SMS templates needed to change without redeployment

Templates for order creation, readiness, and collection were stored as database rows. Message rendering substitutes order data, so wording can be updated without editing and redeploying the sending function.

The implementation includes rendered-message previews and length accounting. Costs depend on the final substituted text, not only the raw template; emoji and longer customer/order values can change the measured length.

Provider-specific billing details are not treated as permanent facts in this README. They should be rechecked before operating or changing the integration.

### 12. Concurrent senders could create duplicate charges

The provider integration did not offer the idempotency mechanism needed by the selected send operation. The application therefore claims an eligible message through an atomic database update before contacting the provider. Only a worker that wins the claim proceeds.

This reduces duplicate attempts caused by overlapping workers. It should not be described as a universal exactly-once delivery guarantee: ambiguous network outcomes and external delivery still require careful handling and reconciliation.

The integration also distinguishes provider acceptance from delivery. A status check is needed to establish the eventual delivery outcome.

### 13. A retry implementation accidentally erased its own limit

An early failure path removed the stored claim, which also removed the attempt count. A permanently failing message could therefore remain eligible indefinitely.

The fix retained failure state and the attempt counter, and applied a bounded retry rule to both selection and claiming. The notes record checks that attempts stop at the configured limit.

This illustrates why error-state persistence is part of correctness, especially when retrying an action can incur a charge.

### 14. Turning messaging on could send old notifications

Enabling sending after a development pause could otherwise treat historical orders as newly eligible and send late creation messages in bulk.

The activation path therefore combines enabling, a new start boundary, and scheduling. A corresponding pause path stops operation. This makes activation a controlled transition rather than a bare boolean switch.

The latest reviewed project notes explicitly leave customer SMS switched off pending template review and a controlled test. This README does not imply those later activation steps occurred.

### 15. Removing market data without breaking application setup

The external market-price source was no longer wanted, but its shared script also registered the PWA and handled top-of-screen spacing. Deleting the entire file would have broken unrelated behavior.

Only the provider calls, refresh scheduling, and old cached price data were removed from the original application. The display remained an empty placeholder, and the unrelated initialization was preserved.

The isolated demo goes further: it has no live market service and does not register the original service worker.

### 16. Separate customer and staff deployment contents

The original project adopted separate customer and staff deployments. A source-to-staff synchronization script copies an explicit file list and checks it against forbidden categories, preventing internal documentation, migrations, or configuration from entering that deployment through a broad directory copy.

A default-deny packaging approach restricts the customer deployment to its intended surface. Routing also required a correction when clean-URL behavior did not resolve the expected customer entry paths; redirects were used in the recorded fix.

This repository history explains why the staff folder used to prepare the demo is a generated deployment target, while the development source contains a wider set of features and documentation. No production deployment is changed by this README update.

## Inherited engineering lessons

The project also carries forward solutions from its predecessor. They are part of the foundation, not separate achievements newly implemented in this adaptation:

- **Legacy compatibility:** current piece and catalog-line renderers retain fallbacks for older detail records.
- **Safer deletion:** customers with uncollected orders are protected, and related records are handled in dependency order.
- **Safe event data:** handlers pass record identifiers instead of embedding customer names into executable strings.
- **Localization:** explicit Gregorian formatting avoids relying on device calendar defaults.
- **Touch-device behavior:** lighter decorative animation and safe-area handling address performance and screen overlap.
- **Printing architecture:** a queue, local Node.js service, and Windows rendering path address hardware-specific label printing and Arabic text encoding.
- **Audit and recovery:** database-level change records and deleted-row snapshots support administrative recovery on covered tables.

The existence of inherited printing or recovery code does not prove that every corresponding service was configured or tested for the new business. Database snapshots also are not a complete backup of uploaded files.

## Testing evidence and its limits

Saved notes describe automated browser checks with substitute backend/storage operations for renewal orders and UI behavior, targeted database checks using rolled-back transactions, and contrast checks across selected page states.

Other changes received narrower verification. Priority removal was checked statically at the user's request. The customer verification work records backend round trips and syntax checks, with browser testing left to the user in that session. SMS notes describe retry and eligibility checks, not completed operational rollout.

During preparation of this demo, separate local browser checks exercised order creation, photos, editing, catalog ordering, customer management, status changes, collection, and tracking. Tracking checks covered cross-tab updates, newly created renewal orders, missing links, and deleted orders. Desktop and mobile views were inspected, and no external requests were recorded during the tested workflows.

These results are scoped to the versions and paths tested. They do not establish exhaustive coverage or verify the current live backend, provider account, printer, or devices.

## Original system versus this demo

| Concern | Original project | This portfolio edition |
| --- | --- | --- |
| Data | Remote records shared across authorized devices. | Synthetic records in browser-local storage. |
| Staff access | Authentication and backend policies. | No login. |
| Customer access | Phone/code verification and a restricted response. | Direct local order link; no security boundary. |
| Order numbering | Database-enforced sequence generation. | Local demo identifiers; no database trigger or concurrency guarantee. |
| Price | Decimal database value and staff editing. | Local UI interaction; no database precision/constraint enforcement. |
| SMS | Sending infrastructure built but left inactive in the reviewed notes. | No provider calls or message delivery. |
| Staff reminders | Simplified design, deployment described as dormant. | Local display only; no scheduled push delivery. |
| Printing | Inherited queue/agent design with setup requiring verification. | Preview only. |
| Images | Business images in remote storage. | Synthetic illustrations and locally re-encoded uploads. |
| Deployment | Separate staff and customer surfaces. | Both available together for exploration. |
| Audit and recovery | Original database mechanisms. | Not included. |

The demo's direct tracking link is a navigation aid, not an access-control design suitable for private customer data. All local demo records are inspectable.

## Demo implementation and files

| File | Purpose |
| --- | --- |
| `index.html`, `home.html` | Main navigation and explanation of the customer-tracking journey. |
| `create_order.html` | Repair, engraving, and renewal creation. |
| `catalog-order.html`, `catalog-admin.html` | Catalog browsing, cart orders, and model management. |
| `admin-orders.html`, `admin-orders.js` | Staff order-management interface and behavior. |
| `customers.html` | Customer records and deletion controls. |
| `track.html` | Customer timeline, pieces, models, and photo presentation. |
| `demo-tracking.js` | Maps local orders and collection records into the customer view. |
| `demo-data.js` | Local records, persistence, and reset. |
| `demo-ui.js`, `demo-ui.css` | Introduction, navigation, reset, and simulated outputs. |
| `theme.css` | Shared staff-interface theme. |
| `order-date-field.js`, `order-piece-form.js` | Shared date and piece-editing components. |
| `assets/` | Synthetic catalog illustrations. |
| `serve.py`, `start-demo.cmd`, `START_HERE.txt` | Local preview and startup instructions. |

Storage uses an independent `tracking_demo_` namespace. Reset affects this demo's records, not the neighboring portfolio demo. Uploaded raster images are resized and re-encoded locally; browser quotas apply. If storage is unavailable, changes remain only on the current page.

## Remaining work and honest limitations

- Confirm the operational status of integrations before claiming that they are live; the latest reviewed notes leave SMS inactive and staff push reminders dormant.
- Complete any intended messaging rollout with template review, rendered-length checks, a controlled recipient test, and explicit activation.
- Verify physical printing configuration for this business instead of assuming the predecessor's working setup transfers automatically.
- Review failure recovery for uploads and multi-step saves, including cleanup of unreferenced files.
- Preserve the distinction between unpriced and zero-priced orders and between provider acceptance and confirmed delivery.
- Keep the generated staff deployment synchronized with the development source when making future production changes.
- Treat local demo behavior as a workflow demonstration, not proof of production authorization, transactional correctness, or multi-device synchronization.

## What this project demonstrates

This project demonstrates adapting an existing application to a different business without duplicating its data, removing features consistently across layers, designing concurrency-safe identifiers, and separating staff operations from customer-facing information.

It also demonstrates practical integration concerns: preserving retry state, controlling activation to avoid unintended historical messages, checking actual data fields on success paths, and packaging deployments through explicit file lists.

The strongest part of the story is the connection between small requirements and their wider consequences: a readable order number introduces concurrency concerns; a lighter theme introduces contrast problems; a public tracking page requires a narrower data boundary; and automated messaging requires cost-aware failure handling.

## Privacy and source scope

Prepared on **September 28, 2026**, using saved project documentation, project-specific development-memory notes, inherited-history notes where relevant, and targeted source checks. Newer project-specific decisions take precedence over copied or superseded descriptions. The live database and operational services were not accessed to prepare this document.

This is a rewritten case study, not a copy of internal memory. Business and personal names, real contacts, tracking codes, sender/account details, production addresses and identifiers, device paths, credentials, original images, and operational record counts are omitted.

Only selected interface code was adapted for the demo. Original Git history, private configuration, migration scripts, internal documents, database records, backend functions, and the print service were not copied into this folder. Remote SDKs, fonts, original authentication, service-worker registration, and live messaging/printing connections were removed. A Content Security Policy blocks remote connections and external resources.

Use fictional information when exploring. This repository publishes an independent portfolio demo; it does not modify the original application.
