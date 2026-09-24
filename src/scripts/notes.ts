type Note = { id: number; body: string };
type NoteResult = { ok: true; action: "created" | "updated"; message: Note } | { ok: true; action: "deleted"; id: number } | { ok: false; reason: string };

const section = document.querySelector<HTMLElement>("#notes");
const list = section?.querySelector<HTMLUListElement>("#messages");
const template = section?.querySelector<HTMLTemplateElement>("#note-template");
const status = section?.querySelector<HTMLElement>("#notes-status");
const empty = section?.querySelector<HTMLElement>("#notes-empty");

function refreshEmpty() {
  if (empty && list) empty.hidden = list.children.length > 0;
}

function findNote(id: number): HTMLLIElement | undefined {
  return Array.from(list?.children ?? []).find((item) => item.getAttribute("data-note-id") === String(id)) as HTMLLIElement | undefined;
}

function showStatus(message: string, error = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", error);
}

function upsertNote(note: Note) {
  if (!list || !template || !Number.isSafeInteger(note.id)) return;
  let item = findNote(note.id);
  if (!item) {
    item = template.content.firstElementChild?.cloneNode(true) as HTMLLIElement | undefined;
    if (!item) return;
    item.dataset.noteId = String(note.id);
    item.querySelectorAll<HTMLInputElement>('input[name="id"]').forEach((input) => { input.value = String(note.id); });
    list.prepend(item);
  }
  const text = item.querySelector<HTMLElement>(".note-text");
  const editor = item.querySelector<HTMLTextAreaElement>('textarea[name="body"]');
  if (text) text.textContent = note.body;
  // A live update should not erase someone else's unfinished edit in this tab.
  if (editor && !item.querySelector("details")?.open) editor.value = note.body;
  refreshEmpty();
}

function removeNote(id: number) {
  findNote(id)?.remove();
  refreshEmpty();
}

if (section && list) {
  section.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('form[action="/api/messages"]')) return;
    event.preventDefault();
    const intent = String(new FormData(form).get("intent") ?? "create");
    if (intent === "delete" && !window.confirm("Delete this note?")) return;

    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const result = await response.json() as NoteResult;
      if (!response.ok || !result.ok) throw new Error("The note could not be saved. Please try again.");
      if (result.action === "deleted") {
        removeNote(result.id);
        showStatus("Note deleted.");
      } else {
        upsertNote(result.message);
        if (result.action === "created") {
          form.reset();
          showStatus("Note added.");
        } else {
          const item = findNote(result.message.id);
          const editor = item?.querySelector<HTMLTextAreaElement>('textarea[name="body"]');
          if (editor) editor.value = result.message.body;
          const details = item?.querySelector("details");
          if (details) details.open = false;
          showStatus("Note saved.");
        }
      }
    } catch {
      showStatus("The note could not be saved. Please try again.", true);
    } finally {
      if (button) button.disabled = false;
    }
  });

  if ("EventSource" in window) {
    const source = new EventSource("/api/events");
    source.addEventListener("message", (event) => upsertNote(JSON.parse((event as MessageEvent).data) as Note));
    source.addEventListener("note-updated", (event) => upsertNote(JSON.parse((event as MessageEvent).data) as Note));
    source.addEventListener("note-deleted", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { id: number };
      removeNote(payload.id);
    });
  }
}

export {};
