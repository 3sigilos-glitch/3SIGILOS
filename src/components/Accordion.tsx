import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";

interface Props {
  title: string;
  meta?: string;
  accent?: string;
  children: React.ReactNode;
}

export function Accordion({ title, meta, accent, children }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const reduced = useReducedMotion();

  return (
    <div
      className={"accordion" + (open ? " open" : "")}
      style={accent ? ({ "--suit": accent } as React.CSSProperties) : undefined}
    >
      <button
        type="button"
        className="accordion-head"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="accordion-title">{title}</span>
        {meta && <span className="accordion-meta">{meta}</span>}
        <ChevronDown size={18} className="accordion-chevron" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={id}
            className="accordion-body"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <div className="accordion-inner">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
