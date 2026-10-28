# Component specs — OHM Next

Primitives use design tokens only. Icon set: Lucide (MIT). No original logos or assets.

## Button
  variants  primary, secondary, ghost, danger
  sizes     sm 32px, md 40px, lg 48px
  states    default, hover, active, focus-visible (2px ring accent), disabled, loading
  tokens    primary: bg accent, text on-accent, radius md, font sm/600
  a11y      real `<button>`, visible focus, loading keeps label via aria-busy
  used on   all screens

## TextField / Select / Textarea
  variants  default
  sizes     md (40px control height)
  states    default, hover, focus (border accent), error, disabled
  tokens    bg surface, border border-input, text text, radius md, font sm
  a11y      label associated with control; error linked via aria-describedby
  used on   S01–S13 modals and auth

## Modal
  variants  form dialog
  sizes     max 500px
  states    closed, open (backdrop), focus trapped
  tokens    surface, shadow pop, radius lg
  a11y      role=dialog, aria-modal, Escape closes, return focus to trigger
  used on   S06–S13

## DataTable
  variants  desktop
  states    empty, loading skeleton, filled, long content wrap
  tokens    surface, border, text sm
  a11y      column headers as `<th scope="col">`
  used on   S06–S13 (≥768px)

## MobileCardList
  variants  list of records
  states    empty, filled, with actions
  tokens    surface, shadow card, radius lg
  a11y      actions as buttons with clear names
  used on   S06–S13 (&lt;768px)

## SidebarNav
  variants  leaf link, submenu (Πωλήσεις)
  states    default, active (accent-muted), open submenu
  tokens    sidebar 280px, surface, border
  a11y      nav landmark, aria-current=page, aria-expanded on toggles
  used on   S03

## MobileNavbar
  variants  top bar + burger
  states    drawer closed / open
  tokens    header 56px, accent burger
  a11y      button aria-expanded, Escape closes
  used on   S03 (&lt;768px)

## StatCard
  variants  default, highlight (accent border)
  states    filled only (parent handles empty season)
  tokens    surface, radius lg, shadow card
  a11y      heading + value text, not colour-only meaning
  used on   S04, S11

## ChartPanel
  variants  bar, doughnut
  states    empty, loading, filled
  tokens    surface, radius lg
  a11y      title in text; canvas aria-hidden with summary nearby
  used on   S04, S05

## Autocomplete
  variants  customer search
  states    idle, open list, selected, no results
  tokens    surface, border, shadow pop
  a11y      combobox pattern, aria-activedescendant, Escape
  used on   S09, S10

## StatusSwitch
  variants  delivered, paid
  states    on, off, disabled
  tokens    success when on, border when off
  a11y      role=switch, aria-checked
  used on   S09, S10

## Toast
  variants  success, danger, warning, info
  states    visible → auto-dismiss 3s
  tokens    shadow toast, on-accent / solid bg
  a11y      role=status aria-live=polite
  used on   shell + auth

## SeasonSelect
  variants  compact dropdown
  states    empty (no seasons), filled
  tokens    form control tokens
  a11y      labelled select
  used on   S04, field detail

## UserFooter
  variants  avatar initial + name + logout
  states    default
  tokens    border-top, text sm
  a11y      logout button labelled
  used on   S03

## EmptyState
  variants  page / table
  states    message + optional CTA
  tokens    text-muted, padding space-6
  used on   all list screens

## PageHeader
  variants  title + description + actions
  tokens    display/xl title (Fraunces), muted description
  used on   S04–S13

## Badge
  variants  active, inactive, success, danger
  tokens    accent-muted / success / danger tints
  used on   S13 seasons
