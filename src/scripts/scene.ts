// The timetable itself does not depend on WebGL. Load the larger scene code
// only when the screen and motion preference can use it.
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrow = window.matchMedia("(max-width: 760px)");

if (reduced.matches || narrow.matches) {
  document.documentElement.classList.add("no-webgl");
} else {
  import("./scene3d").catch(() => {
    document.documentElement.classList.add("no-webgl");
  });
}
