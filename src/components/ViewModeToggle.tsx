"use client";

import { setViewMode, useViewMode } from "@/lib/viewMode";

/**
 * Плавающая кнопка над Telegram: включает и выключает 3D-прогулку.
 * В обычном режиме зазывает нажать: к ней подлетает курсор и «кликает», от кнопки расходится волна.
 */
export function ViewModeToggle() {
  const is3d = useViewMode() === "3d";
  return (
    <button
      type="button"
      className="fab fab--mode"
      aria-pressed={is3d}
      aria-label="3D-прогулка"
      title={is3d ? "Выключить 3D-прогулку" : "Включить 3D-прогулку"}
      onClick={() => setViewMode(is3d ? "flat" : "3d")}
    >
      3D
      {!is3d && (
        <span className="fab__cursor" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M4 2v17l4.5-4.2 2.9 6.6 2.6-1.1-2.8-6.5H17z" fill="#fff" stroke="#06070c" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
