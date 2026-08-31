import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  meta?: string;
  title: string;
  tightHead?: boolean;
}

export function Panel({ children, className, meta, tightHead, title }: PanelProps) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      <div className={tightHead ? "panel__head panel__head--tight" : "panel__head"}>
        <h2 className="label">{title}</h2>
        {meta !== undefined && <span className="meta">{meta}</span>}
      </div>
      {children}
    </section>
  );
}
