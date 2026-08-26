/**
 * Onboarding copy, in one place, because it is the part most likely to drift
 * out of the product's voice.
 *
 * Two rules it has to keep, both from the build spec's copy rules:
 *   - the system speaks as the product, never as an assistant. No "I'll".
 *   - actions keep their name through the flow, so a line about a button uses
 *     the words on that button.
 */

export const COACH_MARKS = {
  tripMode: "trip_mode",
  notHere: "not_here",
  swipe: "swipe",
  lockedItem: "locked_item",
  dismissSuggestion: "dismiss_suggestion",
  tripComplete: "trip_complete",
} as const;

export type CoachMarkId = (typeof COACH_MARKS)[keyof typeof COACH_MARKS];

export const COACH_MARK_COPY: Record<
  CoachMarkId,
  { line: string; dismiss: string }
> = {
  [COACH_MARKS.tripMode]: {
    line: "One item at a time, in aisle order. In the trolley moves you on.",
    dismiss: "Right",
  },
  [COACH_MARKS.notHere]: {
    line: "Can't find it? Tap Not here for something close.",
    dismiss: "Got it",
  },
  // A shortcut, so it is offered after the buttons have been used once, not
  // before. The buttons keep their names here because they keep them on screen.
  [COACH_MARKS.swipe]: {
    line: "Quicker with a thumb: swipe right for In the trolley, left for Not here.",
    dismiss: "Right",
  },
  [COACH_MARKS.lockedItem]: {
    line: "This one's locked, so no alternatives. Skip it and let her know.",
    dismiss: "Fine",
  },
  [COACH_MARKS.dismissSuggestion]: {
    line: "Noted. Three of those and it stops being offered.",
    dismiss: "Right",
  },
  [COACH_MARKS.tripComplete]: {
    line: "That trip is now history. Next Saturday's list will be a bit better for it.",
    dismiss: "Got it",
  },
};

export const FIRST_RUN_CARD = {
  title: "How Sweep works",
  standfirst: "Three parts, one trip. You'll only see this once.",
  stages: [
    {
      number: "01",
      title: "The list fills itself",
      line: "Suggestions come from what you've bought before, and each one tells you why.",
    },
    {
      number: "02",
      title: "In the shop, it changes",
      line: "One item at a time, in aisle order. Works with no signal.",
    },
    {
      number: "03",
      title: 'If it’s not there, tap "Not here"',
      line: "You'll get alternatives, unless you've locked the item. Then it stays locked.",
    },
  ],
  action: "Got it",
} as const;
