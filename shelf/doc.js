/* Renders a canvas-style document tree: { t, p, c }. */

export function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else el.setAttribute(k, String(v));
    }
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function newTab(href, ...kids) {
  const a = h("a", { href, target: "_blank", rel: "noopener noreferrer" }, ...kids);
  a.append(h("span", { class: "sr" }, " (opens in a new tab)"));
  return a;
}

function fillCell(td, cell, label) {
  td.dataset.label = label;
  if (cell && typeof cell === "object") {
    const tone = cell.tone ? "tone tone-" + cell.tone : "tone";
    td.append(h("span", { class: tone }, cell.text ?? ""));
    return;
  }
  const s = cell == null ? "" : String(cell);
  if (/^https?:\/\//.test(s)) {
    td.append(newTab(s, s));
    return;
  }
  td.textContent = s;
}

let tableSeq = 0;

function renderTable(node, heading) {
  const cols = node.p.columns || [];
  const capId = "table-caption-" + (++tableSeq);
  const table = h("table", { class: "data" });
  table.append(h("caption", { id: capId, class: "sr" }, heading || "Table"));
  const thead = h("thead");
  const hr = h("tr");
  cols.forEach((c) => hr.append(h("th", { scope: "col" }, c)));
  thead.append(hr);
  const tb = h("tbody");
  (node.p.rows || []).forEach((row) => {
    const tr = h("tr");
    row.forEach((cell, i) => {
      const td = h("td");
      fillCell(td, cell, cols[i] || "");
      tr.append(td);
    });
    tb.append(tr);
  });
  table.append(thead, tb);
  return h("div", {
    class: "table-wrap",
    tabindex: "0",
    role: "region",
    "aria-labelledby": capId,
  }, table);
}

function renderMonth(node) {
  const ym = node.p.month;
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const byDay = new Map();
  (node.p.events || []).forEach((ev) => {
    const d = Number(String(ev.date).slice(8, 10));
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(ev.title);
  });
  const grid = h("div", { class: "cal", role: "grid", "aria-label": MONTHS[m - 1] + " " + y });
  DOW.forEach((d) => grid.append(h("span", { class: "dow" }, d)));
  for (let i = 0; i < first.getDay(); i++) grid.append(h("span", { "aria-hidden": "true" }));
  for (let d = 1; d <= days; d++) {
    const titles = byDay.get(d) || [];
    const cell = h("div", {
      class: "day" + (titles.length ? " has" : ""),
      role: "gridcell",
      "aria-label": MONTHS[m - 1] + " " + d + (titles.length ? ", " + titles.join(", ") : ""),
    }, h("strong", null, String(d)));
    titles.forEach((t) => cell.append(h("em", null, t)));
    grid.append(cell);
  }
  return h("div", { class: "month" }, h("h3", null, MONTHS[m - 1] + " " + y), grid);
}

let stepSeq = 0;

function render(node, level, heading) {
  if (node == null || node === false) return document.createTextNode("");
  if (typeof node === "string" || typeof node === "number") return document.createTextNode(String(node));
  const t = node.t;
  const p = node.p || {};
  const kids = () => (node.c || []).map((c) => render(c, level, heading));
  if (t === "frag") return h("div", null, ...kids());
  if (t === "Text") return h("p", { class: "prose" }, ...(node.c || []).map((c) => render(c, level, heading)));
  if (t === "Section") {
    const tag = level > 2 ? "h3" : "h2";
    const id = slug(p.heading || "section");
    const next = p.heading || heading || "";
    return h("section", { class: "block", id }, h(tag, null, p.heading || ""), ...(node.c || []).map((c) => render(c, level + 1, next)));
  }
  if (t === "Callout") {
    return h("aside", { class: "callout" + (p.tone === "warning" ? " warning" : "") },
      p.lead ? h("span", { class: "leadline" }, p.lead) : "",
      ...(node.c || []).map((c) => typeof c === "string" ? h("p", { class: "prose" }, c) : render(c, level, heading)));
  }
  if (t === "Quote") {
    return h("blockquote", { class: "quote" }, ...(node.c || []).map((c) => render(c, level, heading)), p.cite ? h("cite", null, p.cite) : "");
  }
  if (t === "Steps") {
    const ol = h("ol", { class: "steps", role: "list" });
    (p.steps || []).forEach((s, i) => {
      const li = h("li");
      const body = h("div", null, h("strong", null, s.title || ""), s.detail ? h("p", { class: "prose" }, s.detail) : "");
      const inputId = "done-step-" + (++stepSeq);
      const label = h("label", { class: "check noprint", for: inputId });
      const input = h("input", { type: "checkbox", id: inputId, "data-step": String(i) });
      label.append(input, document.createTextNode(" Done on this device"));
      body.append(label);
      li.append(body);
      ol.append(li);
    });
    return ol;
  }
  if (t === "Rows") {
    const box = h("div", { class: "stack" });
    (p.rows || []).forEach((r) => {
      const card = h("article", { class: "rowcard" });
      if (r.lead) card.append(h("div", { class: "lead" }, r.lead));
      if (r.title) card.append(h("strong", null, r.title));
      if (r.detail) card.append(h("p", { class: "prose" }, r.detail));
      if (r.meta) card.append(h("div", { class: "note" }, r.meta));
      if (r.status && r.status.label) {
        card.append(h("span", { class: "tone tone-" + (r.status.tone || "neutral") }, r.status.label));
      }
      box.append(card);
    });
    return box;
  }
  if (t === "Table") return renderTable(node, heading);
  if (t === "LinkCards") {
    const grid = h("div", { class: "link-grid" });
    (p.links || []).forEach((link) => {
      const a = newTab(link.href,
        h("strong", null, link.title || link.href),
        h("small", null, [link.site, link.date].filter(Boolean).join(" · ")));
      a.className = "link-card";
      grid.append(a);
    });
    return grid;
  }
  if (t === "BulletList") {
    const ul = h("ul", { class: "bullets" });
    (p.items || []).forEach((item) => {
      const li = h("li");
      const s = String(item);
      const m = s.match(/^(.*?)(https?:\/\/\S+)$/);
      if (m) {
        li.append(m[1], newTab(m[2], m[2]));
      } else li.textContent = s;
      ul.append(li);
    });
    return ul;
  }
  if (t === "Properties") {
    const dl = h("dl", { class: "props" });
    (p.items || []).forEach((item) => {
      dl.append(h("div", null, h("dt", null, item.label || ""), h("dd", null, item.value || "")));
    });
    return dl;
  }
  if (t === "TableOfContents") {
    const nav = h("nav", { class: "toc noprint", "aria-label": "On this page" });
    (p.items || []).forEach((item) => {
      nav.append(h("a", { class: "chip", href: "#" + slug(item.label) }, item.label));
    });
    return nav;
  }
  if (t === "Segmented") {
    const group = h("div", { class: "seg noprint", role: "group", "aria-label": "Filter" });
    (p.options || []).forEach((opt) => {
      const b = h("button", { type: "button", class: "chip", "data-value": opt }, opt);
      if (opt === p.value) b.setAttribute("aria-pressed", "true");
      else b.setAttribute("aria-pressed", "false");
      group.append(b);
    });
    return group;
  }
  if (t === "Grid") {
    return h("div", { class: "grid-block", "data-cols": String(p.columns || 1) }, ...(node.c || []).map((c) => render(c, level, heading)));
  }
  if (t === "MonthView") return renderMonth(node);
  const box = h("div");
  (node.c || []).forEach((c) => box.append(render(c, level, heading)));
  return box;
}

export function renderPage(node, mount) {
  mount.replaceChildren();
  const p = node.p || {};
  const hero = h("header", { class: "hero-block wrap" },
    h("h1", { id: "content", tabindex: "-1" }, p.title || ""),
    p.summary ? h("p", { class: "lede" }, p.summary) : "");
  const body = h("div", { class: "doc wrap" });
  (node.c || []).forEach((c) => body.append(render(c, 2, "")));
  mount.append(hero, body);
  if (p.sources && p.sources.length) {
    const list = h("ul", { class: "bullets" });
    p.sources.forEach((src) => list.append(h("li", null, newTab(src, src))));
    body.append(h("section", { class: "sources block" }, h("h2", null, "Sources"), list));
  }
}
