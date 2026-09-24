"use client";

import { useState } from "react";
import s from "./Cases.module.css";

/** Слайдер «до/после»: перетаскивание ползунка или стрелки на клавиатуре (range-input). */
export function BeforeAfter({ before, after, title }: { before: string; after: string; title: string }) {
  const [split, setSplit] = useState(50);

  return (
    <div className={s.compare} style={{ "--split": `${split}%` } as React.CSSProperties}>
      <Shot src={after} label="После" className={s.after} />
      <Shot src={before} label="До" className={s.before} />
      <div className={s.handle} aria-hidden="true" />
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className={s.range}
        aria-label={`Сравнение до и после: ${title}`}
      />
    </div>
  );
}

function Shot({ src, label, className }: { src: string; label: string; className: string }) {
  const isImage = /^(\/|https?:)/.test(src);
  return (
    <div className={`${s.shot} ${className}`}>
      {isImage ? (
        <img src={src} alt={label} loading="lazy" decoding="async" />
      ) : (
        <span className={s.placeholder}>{src}</span>
      )}
      <span className={s.shotLabel}>{label}</span>
    </div>
  );
}
