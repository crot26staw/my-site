/** Ключ выбора режима в localStorage. Отдельный файл без React — его импортирует серверный layout. */
export const VIEW_MODE_KEY = "view-mode";

/** До первой отрисовки включает 3D, если пользователь выбрал его раньше (см. src/lib/viewMode.ts). */
export const VIEW_MODE_SCRIPT = `try{if(localStorage.getItem("${VIEW_MODE_KEY}")==="3d")document.documentElement.dataset.mode="3d"}catch(e){}`;
