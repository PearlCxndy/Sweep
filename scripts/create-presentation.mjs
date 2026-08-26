import pptxgen from "pptxgenjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Sweep";
pptx.subject = "Algo1 technical product case study";
pptx.title = "Sweep — Algo1 Case Study";
pptx.company = "Sweep";
pptx.lang = "en-GB";
pptx.theme = {
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  lang: "en-GB",
};

const C = {
  ink: "14161A",
  paper: "FBFAF4",
  muted: "697078",
  ripe: "D8F05A",
  wash: "E9ECE5",
  blue: "80C7E8",
  coral: "F49D83",
  line: "D9DDD5",
};

function base(slide, { dark = false, number } = {}) {
  slide.background = { color: dark ? C.ink : C.paper };
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55, y: 7.08, w: 12.22, h: 0,
    line: { color: dark ? "364047" : C.line, width: 0.8 },
  });
  slide.addText("SWEEP  /  ALGO1 CASE STUDY", {
    x: 0.6, y: 7.18, w: 4.2, h: 0.18,
    fontFace: "Arial", fontSize: 6.5, charSpacing: 1.6,
    color: dark ? "A5ADB1" : C.muted, margin: 0,
  });
  if (number) slide.addText(String(number).padStart(2, "0"), {
    x: 12.15, y: 7.15, w: 0.55, h: 0.2, align: "right",
    fontSize: 7, charSpacing: 1.3, color: dark ? "A5ADB1" : C.muted, margin: 0,
  });
}

function title(slide, kicker, heading, sub, { dark = false } = {}) {
  const fg = dark ? C.paper : C.ink;
  slide.addText(kicker.toUpperCase(), {
    x: 0.62, y: 0.52, w: 6.4, h: 0.22,
    fontSize: 8, bold: true, charSpacing: 1.5, color: dark ? C.ripe : C.muted, margin: 0,
  });
  slide.addText(heading, {
    x: 0.6, y: 0.91, w: 11.8, h: 0.78,
    fontSize: 27, bold: true, breakLine: false, color: fg, margin: 0,
    fit: "shrink",
  });
  if (sub) slide.addText(sub, {
    x: 0.62, y: 1.78, w: 10.9, h: 0.44,
    fontSize: 12, color: dark ? "CDD2D0" : C.muted, margin: 0,
    breakLine: false, fit: "shrink",
  });
}

function card(slide, x, y, w, h, heading, text, accent = C.wash, dark = false) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: dark ? "20262B" : accent },
    line: { color: dark ? "20262B" : accent },
  });
  slide.addText(heading, {
    x: x + 0.23, y: y + 0.2, w: w - 0.46, h: 0.3,
    fontSize: 11, bold: true, color: dark ? C.paper : C.ink, margin: 0,
  });
  slide.addText(text, {
    x: x + 0.23, y: y + 0.62, w: w - 0.46, h: h - 0.78,
    fontSize: 9.5, color: dark ? "C9CFCC" : "3C4346", margin: 0,
    breakLine: false, fit: "shrink", valign: "top",
  });
}

function quote(slide, text, x, y, w, { dark = false } = {}) {
  slide.addText("“", { x, y: y - 0.25, w: 0.35, h: 0.45, fontSize: 32, color: C.ripe, margin: 0 });
  slide.addText(text, {
    x: x + 0.4, y, w: w - 0.4, h: 0.85, fontSize: 19, bold: true,
    color: dark ? C.paper : C.ink, margin: 0, fit: "shrink",
  });
}

// 01 — title
{
  const s = pptx.addSlide(); base(s, { dark: true, number: 1 });
  s.addShape(pptx.ShapeType.arc, { x: 8.8, y: 0.6, w: 3.4, h: 3.4, adjustPoint: 0.2, line: { color: C.ripe, width: 18 }, adjustPoint2: 0.76 });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.2, y: 4.18, w: 2.65, h: 1.1, rectRadius: 0.2, fill: { color: C.ripe }, line: { color: C.ripe } });
  s.addText("SWEEP", { x: 0.6, y: 0.68, w: 2.4, h: 0.35, fontSize: 12, bold: true, charSpacing: 4, color: C.ripe, margin: 0 });
  s.addText("The shopping list\nthat helps in the shop.", { x: 0.6, y: 1.45, w: 7.8, h: 1.65, fontSize: 36, bold: true, breakLine: false, color: C.paper, margin: 0, fit: "shrink" });
  s.addText("Algo1 Technical Product Case Study  ·  Product walkthrough + code review", { x: 0.63, y: 3.46, w: 6.8, h: 0.3, fontSize: 11, color: "C9CFCC", margin: 0 });
  s.addText("A prototype for the 40 minutes inside the supermarket.", { x: 0.63, y: 5.86, w: 6.4, h: 0.3, fontSize: 12, color: C.ripe, margin: 0 });
}

// 02 — problem
{
  const s = pptx.addSlide(); base(s, { number: 2 }); title(s, "The opportunity", "Lists remember items. They do not help shoppers decide.", "I focused the product on the moment a normal list becomes least useful: inside the store.");
  card(s, 0.62, 2.55, 3.85, 2.58, "Remember", "Did I forget milk, bin bags, or a staple I normally buy?", C.wash);
  card(s, 4.72, 2.55, 3.85, 2.58, "Navigate", "Where is the next item in this particular store—and am I walking backwards?", "E8F4FA");
  card(s, 8.82, 2.55, 3.85, 2.58, "Resolve", "What is a safe replacement when the shelf is empty?", "FCE9E3");
  quote(s, "The opportunity is not a smarter checklist; it is fewer decisions during the trip.", 0.65, 5.65, 10.8);
}

// 03 — shopper
{
  const s = pptx.addSlide(); base(s, { number: 3 }); title(s, "Target shopper", "Sarah: a repeat shopper with a regular branch.", "A concrete persona makes the product’s useful signal—and its limits—clear.");
  s.addShape(pptx.ShapeType.ellipse, { x: 0.75, y: 2.6, w: 2.2, h: 2.2, fill: { color: C.ripe }, line: { color: C.ripe } });
  s.addText("SARAH", { x: 1.03, y: 3.44, w: 1.65, h: 0.25, fontSize: 13, bold: true, align: "center", margin: 0 });
  card(s, 3.45, 2.48, 2.75, 2.75, "Behaviour", "• Big shop every two weeks\n• Small top-up midweek\n• Usually shops at one branch", C.wash);
  card(s, 6.48, 2.48, 2.75, 2.75, "Need", "• A familiar, quick route\n• Reminders with reasons\n• Low-effort recovery when stock is missing", "E8F4FA");
  card(s, 9.5, 2.48, 2.75, 2.75, "Constraint", "• Some items cannot be casually substituted\n• Connectivity may be weak in-store", "FCE9E3");
  s.addText("Research note", { x: 0.7, y: 5.72, w: 1.2, h: 0.2, fontSize: 8, bold: true, charSpacing: 1.4, color: C.muted, margin: 0 });
  s.addText("This case-study prototype uses a reasoned persona and seeded history. It does not claim the demo data is real user research; validating the assumptions with repeat shoppers is the next step.", { x: 0.7, y: 6.02, w: 11.45, h: 0.46, fontSize: 10.5, color: C.muted, margin: 0, fit: "shrink" });
}

// 04 — inspiration
{
  const s = pptx.addSlide(); base(s, { dark: true, number: 4 }); title(s, "Product inspiration", "A shopping list should change mode when the shopper enters the store.", "Planning is a list-management task. Shopping is a navigation and decision-support task.", { dark: true });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.72, y: 2.7, w: 5.45, h: 2.65, rectRadius: 0.18, fill: { color: "20262B" }, line: { color: "20262B" } });
  s.addText("BEFORE THE SHOP", { x: 1.02, y: 3.04, w: 3.6, h: 0.22, fontSize: 8, bold: true, charSpacing: 1.5, color: C.ripe, margin: 0 });
  s.addText("A calm list\nwith suggestions", { x: 1.02, y: 3.48, w: 3.5, h: 0.7, fontSize: 23, bold: true, color: C.paper, margin: 0 });
  s.addText("Add, remove, review, and prepare.", { x: 1.02, y: 4.58, w: 3.4, h: 0.25, fontSize: 10, color: "C9CFCC", margin: 0 });
  s.addShape(pptx.ShapeType.chevron, { x: 6.42, y: 3.6, w: 0.48, h: 0.7, fill: { color: C.ripe }, line: { color: C.ripe } });
  s.addShape(pptx.ShapeType.roundRect, { x: 7.18, y: 2.7, w: 5.45, h: 2.65, rectRadius: 0.18, fill: { color: C.ripe }, line: { color: C.ripe } });
  s.addText("INSIDE THE SHOP", { x: 7.48, y: 3.04, w: 3.6, h: 0.22, fontSize: 8, bold: true, charSpacing: 1.5, color: C.ink, margin: 0 });
  s.addText("One next item\nat a time", { x: 7.48, y: 3.48, w: 3.5, h: 0.7, fontSize: 23, bold: true, color: C.ink, margin: 0 });
  s.addText("Move forward, resolve gaps, finish cleanly.", { x: 7.48, y: 4.58, w: 3.9, h: 0.25, fontSize: 10, color: "334047", margin: 0 });
  quote(s, "This mode change is Sweep’s main product decision.", 0.75, 5.88, 9.5, { dark: true });
}

// 05 — walkthrough
{
  const s = pptx.addSlide(); base(s, { number: 5 }); title(s, "Live walkthrough", "A four-minute story, from preparation to recovery.", "Use these steps during the product demo rather than trying to show every screen.");
  const steps = [
    ["01", "Your list", "Suggestions have reasons; items are grouped by the store route."],
    ["02", "Start shopping", "The interface becomes focused trip mode: one item, one next action."],
    ["03", "Not here", "Milk shows transparent, ranked alternatives."],
    ["04", "Protected loaf", "A gluten-free item has no substitute because safety is a hard stop."],
    ["05", "Finish", "Skipped items roll to the next list; one swap question captures useful feedback."],
  ];
  steps.forEach(([n, h, t], i) => {
    const x = 0.62 + i * 2.48;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 2.72, w: 2.18, h: 2.7, rectRadius: 0.16, fill: { color: i === 1 ? C.ink : C.wash }, line: { color: i === 1 ? C.ink : C.wash } });
    s.addText(n, { x: x + 0.2, y: 2.98, w: 0.4, h: 0.2, fontSize: 8, bold: true, charSpacing: 1.2, color: i === 1 ? C.ripe : C.muted, margin: 0 });
    s.addText(h, { x: x + 0.2, y: 3.43, w: 1.77, h: 0.36, fontSize: 14, bold: true, color: i === 1 ? C.paper : C.ink, margin: 0, fit: "shrink" });
    s.addText(t, { x: x + 0.2, y: 4.06, w: 1.77, h: 0.84, fontSize: 8.7, color: i === 1 ? "CDD2D0" : "3C4346", margin: 0, fit: "shrink" });
  });
  s.addText("Demo setup: the stock events are intentionally seeded so the two decision moments always appear. They are not presented as live store stock.", { x: 0.65, y: 6.08, w: 11.2, h: 0.35, fontSize: 10, color: C.muted, margin: 0, fit: "shrink" });
}

// 06 — decisions
{
  const s = pptx.addSlide(); base(s, { number: 6 }); title(s, "Key product decisions", "Trust comes from knowing when not to guess.", "Each interaction has a deliberately limited promise.");
  card(s, 0.62, 2.6, 3.85, 2.66, "Transparent suggestions", "Median purchase intervals + confidence labels. A weak pattern is stated as unclear, rather than overclaimed.", C.wash);
  card(s, 4.72, 2.6, 3.85, 2.66, "Safety before ranking", "A never-substitute preference returns no alternatives. Dietary safety is a gate, not a lower score.", "FCE9E3");
  card(s, 8.82, 2.6, 3.85, 2.66, "Control over learning", "Deleting an inference removes its underlying products from future suggestions; three dismissals retire an item.", "E8F4FA");
  s.addText("Principle: explain the input, preserve the shopper’s choice, and degrade honestly when data is missing.", { x: 0.68, y: 5.95, w: 11.0, h: 0.28, fontSize: 13, bold: true, color: C.ink, margin: 0 });
}

// 07 — architecture
{
  const s = pptx.addSlide(); base(s, { dark: true, number: 7 }); title(s, "Architecture", "The product rules are separate from the interface and data source.", "This makes the important decisions testable today and replaceable tomorrow.", { dark: true });
  const nodes = [
    ["UI", "Next.js / React\nScreens + components", 0.75, C.ripe, C.ink],
    ["STATE", "Zustand\nPersisted trip state", 3.42, "30393D", C.paper],
    ["DOMAIN", "Pure functions\nSuggestions · safety · route", 6.09, "30393D", C.paper],
    ["DATA", "Repository boundary\nSeed JSON now · API later", 8.76, "30393D", C.paper],
  ];
  nodes.forEach(([h, t, x, fill, textColor]) => {
    s.addShape(pptx.ShapeType.roundRect, { x, y: 3.0, w: 2.25, h: 1.5, rectRadius: 0.16, fill: { color: fill }, line: { color: fill } });
    s.addText(h, { x: x + 0.2, y: 3.26, w: 1.8, h: 0.2, fontSize: 8, bold: true, charSpacing: 1.2, color: textColor, margin: 0 });
    s.addText(t, { x: x + 0.2, y: 3.65, w: 1.8, h: 0.45, fontSize: 10, bold: true, color: textColor, margin: 0, fit: "shrink" });
  });
  [3.05, 5.72, 8.39].forEach((x) => s.addShape(pptx.ShapeType.chevron, { x, y: 3.52, w: 0.32, h: 0.42, fill: { color: "596469" }, line: { color: "596469" } }));
  s.addText("Offline behaviour", { x: 0.76, y: 5.32, w: 1.9, h: 0.22, fontSize: 8, bold: true, charSpacing: 1.3, color: C.ripe, margin: 0 });
  s.addText("Trip actions apply immediately, persist locally, and queue with the time they happened. Poor signal should not interrupt a shop.", { x: 0.76, y: 5.67, w: 10.8, h: 0.35, fontSize: 14, color: C.paper, margin: 0, fit: "shrink" });
}

// 08 — code review
{
  const s = pptx.addSlide(); base(s, { number: 8 }); title(s, "Code review talking points", "Four files explain the core of the product.", "Start from decisions and behaviour; then show how the code enforces them.");
  const rows = [
    ["domain/suggestions.ts", "Median intervals, confidence, exclusions, dismissal retirement."],
    ["domain/substitutions.ts", "Protected item gate, dietary filter, explainable ranking."],
    ["domain/storeOrder.ts", "Branch placement order with category fallback if a layout is unknown."],
    ["lib/store.ts", "Persisted list/trip state, optimistic updates, offline queueing."],
  ];
  rows.forEach(([file, desc], i) => {
    const y = 2.55 + i * 0.8;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.65, y, w: 11.8, h: 0.57, rectRadius: 0.08, fill: { color: i % 2 ? C.paper : C.wash }, line: { color: i % 2 ? C.line : C.wash } });
    s.addText(file, { x: 0.9, y: y + 0.17, w: 3.0, h: 0.2, fontFace: "Courier New", fontSize: 10, bold: true, color: C.ink, margin: 0 });
    s.addText(desc, { x: 4.05, y: y + 0.17, w: 7.8, h: 0.2, fontSize: 10, color: C.muted, margin: 0, fit: "shrink" });
  });
  s.addText("Quality check: 56 domain tests cover suggestion timing, confidence, safety gates, ranking, and route fallbacks. Lint passes.", { x: 0.72, y: 6.05, w: 11.1, h: 0.3, fontSize: 11, color: C.ink, bold: true, margin: 0 });
}

// 09 — AI
{
  const s = pptx.addSlide(); base(s, { number: 9 }); title(s, "How I used AI", "AI accelerated exploration; it did not make the product decisions for me.", "I used it as a collaborator for alternatives, explanation, and implementation support—then checked the result against the brief and code.");
  card(s, 0.65, 2.55, 3.75, 2.8, "1. Frame a question", "Example working prompt:\n\n“How should a shopping app behave when a product is unavailable but dietary safety matters?”", C.wash);
  card(s, 4.65, 2.55, 3.75, 2.8, "2. Evaluate, don’t copy", "I compared suggestions with the product principle: safety is a hard constraint; explanations must be visible; no unsupported stock claims.", "E8F4FA");
  card(s, 8.65, 2.55, 3.75, 2.8, "3. Verify in code", "The final rules are deterministic, tested, and reviewable. AI output was adapted—not treated as a source of truth.", "FCE9E3");
  s.addText("Important: these are examples of the collaboration process, not evidence of user research. The product claims are supported by explicit rules and clearly-labelled demo data.", { x: 0.72, y: 6.08, w: 11.25, h: 0.38, fontSize: 10, color: C.muted, margin: 0, fit: "shrink" });
}

// 10 — limitations / future
{
  const s = pptx.addSlide(); base(s, { number: 10 }); title(s, "What is real, what is next", "The prototype is honest about its evidence boundary.", "The aim was to validate the interaction model before assuming access to retailer systems.");
  card(s, 0.65, 2.62, 5.65, 2.7, "Prototype today", "• Working shopping flow and offline persistence\n• Deterministic, tested suggestion / substitution rules\n• Seeded Tesco Express product, stock, route, and purchase data\n• Historic public product dataset explored for catalogue enrichment", C.wash);
  card(s, 6.62, 2.62, 5.65, 2.7, "Production next", "• Interviews and usability tests with repeat shoppers\n• Retailer product + price integration\n• Verified branch-level layout source\n• Account-based sync and shared household lists", "E8F4FA");
  quote(s, "Without verified store data, Sweep falls back to category order instead of pretending it knows an aisle.", 0.68, 5.92, 11.0);
}

// 11 — close
{
  const s = pptx.addSlide(); base(s, { dark: true, number: 11 });
  s.addText("SWEEP", { x: 0.65, y: 0.76, w: 2.4, h: 0.3, fontSize: 12, bold: true, charSpacing: 4, color: C.ripe, margin: 0 });
  s.addText("A better list\nfor the part that matters.", { x: 0.65, y: 1.55, w: 8.1, h: 1.4, fontSize: 36, bold: true, color: C.paper, margin: 0, fit: "shrink" });
  s.addText("The question I would validate next: does guided trip mode materially reduce time, backtracking, and uncertainty for repeat shoppers?", { x: 0.68, y: 3.5, w: 8.8, h: 0.44, fontSize: 14, color: "CDD2D0", margin: 0, fit: "shrink" });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.55, y: 4.68, w: 2.55, h: 1.05, rectRadius: 0.18, fill: { color: C.ripe }, line: { color: C.ripe } });
  s.addText("Thank you", { x: 9.55, y: 5.04, w: 2.55, h: 0.3, fontSize: 18, bold: true, align: "center", color: C.ink, margin: 0 });
}

await pptx.writeFile({ fileName: "presentation/Sweep_Algo1_Case_Study.pptx" });
