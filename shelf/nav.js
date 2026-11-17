/* Wires the color-scheme control. The header itself is in each page so it
   paints with the HTML and still works if this script does not run. */
const THEME_KEY = "shelf-theme";
const THEME_COLOR = { light: "#f4efe6", dark: "#161310" };

function schemeMeta() {
  return document.querySelector('meta[name="color-scheme"]');
}

function systemDark() {
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

function renderedDark() {
  const content = schemeMeta()?.content;
  if (content === "dark") return true;
  if (content === "light") return false;
  return systemDark();
}

function syncThemeColor(content) {
  const tags = [...document.querySelectorAll('meta[name="theme-color"]')];
  if (content === "light" || content === "dark") {
    tags.forEach((el, i) => {
      if (i === 0) {
        el.content = THEME_COLOR[content];
        el.removeAttribute("media");
      } else {
        el.setAttribute("media", "not all");
      }
    });
    return;
  }
  if (tags[0]) {
    tags[0].content = THEME_COLOR.light;
    tags[0].setAttribute("media", "(prefers-color-scheme: light)");
  }
  if (tags[1]) {
    tags[1].content = THEME_COLOR.dark;
    tags[1].setAttribute("media", "(prefers-color-scheme: dark)");
  }
}

function applyTheme(next) {
  const content = next === "light" || next === "dark" ? next : "light dark";
  const meta = schemeMeta();
  if (meta) meta.content = content;
  try {
    if (next === "light" || next === "dark") localStorage.setItem(THEME_KEY, next);
    else localStorage.removeItem(THEME_KEY);
  } catch (e) {}
  syncThemeColor(content);
  const btn = document.querySelector(".theme-btn");
  if (!btn) return;
  btn.setAttribute("aria-pressed", renderedDark() ? "true" : "false");
}

function storedTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark") return t;
  } catch (e) {}
  return "";
}

const themeBtn = document.querySelector(".theme-btn");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const target = renderedDark() ? "light" : "dark";
    const system = systemDark() ? "dark" : "light";
    applyTheme(target === system ? "" : target);
  });
}
applyTheme(storedTheme());

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (schemeMeta()?.content === "light dark") applyTheme("");
});

window.addEventListener("storage", (e) => {
  if (e.key !== THEME_KEY) return;
  applyTheme(e.newValue === "light" || e.newValue === "dark" ? e.newValue : "");
});
