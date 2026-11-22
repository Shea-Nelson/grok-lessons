/* The hub is driven by lessons.json (newest-first, or sorted by date).
   The markup in index.html is a no-JS fallback of the same list. */
const dataUrl = new URL("lessons.json", import.meta.url);

function byDateDesc(a, b) {
  return String(b.date).localeCompare(String(a.date));
}

function hrefFor(lesson) {
  return `${lesson.slug || lesson.date}/`;
}

function paintLatest(host, lesson) {
  const a = document.createElement("a");
  a.className = "link-card latest";
  a.href = hrefFor(lesson);
  const small = document.createElement("small");
  small.textContent = lesson.dateLong || lesson.dateLabel || lesson.date;
  const strong = document.createElement("strong");
  strong.textContent = lesson.title;
  a.append(small, strong);
  if (lesson.summary) {
    const span = document.createElement("span");
    span.textContent = lesson.summary;
    a.append(span);
  }
  host.replaceChildren(a);
}

function paintArchive(list, lessons) {
  list.replaceChildren();
  for (const lesson of lessons) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = hrefFor(lesson);
    const time = document.createElement("time");
    time.dateTime = lesson.date;
    time.textContent = lesson.dateLabel || lesson.date;
    a.append(time, document.createTextNode(" — " + lesson.title));
    li.append(a);
    if (lesson.fullText === false) {
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = "Title only — full text was not kept";
      li.append(" ", meta);
    }
    list.append(li);
  }
}

async function load() {
  const res = await fetch(dataUrl.href);
  if (!res.ok) throw new Error("lessons");
  const data = await res.json();
  const lessons = [...(data.lessons || [])].sort(byDateDesc);
  if (!lessons.length) return;
  const latestHost = document.querySelector("#latest-lesson");
  const archive = document.querySelector("#lesson-archive");
  const note = document.querySelector("#archive-note");
  if (latestHost) paintLatest(latestHost, lessons[0]);
  if (archive) paintArchive(archive, lessons);
  if (note) {
    const stubs = lessons.filter((l) => l.fullText === false);
    if (!stubs.length) note.remove();
  }
}

load().catch(() => {
  /* Keep the static fallback already in the page. */
});
