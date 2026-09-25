/** Появление блоков [data-reveal] при прокрутке: класс is-visible, стили в globals.css. */
export function initReveal(): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  return () => io.disconnect();
}
