import { Check } from "lucide-react";
export type CheckboxListItem = { id: string; label: string; checked?: boolean };
export function CheckboxList({
  title,
  items,
  className = "",
}: {
  title: string;
  items: readonly CheckboxListItem[];
  className?: string;
}) {
  const checkedCount = items.filter((item) => item.checked).length;
  return (
    <section className={`hosanna-checklist ${className}`} aria-label={title}>
      <header>
        <h3>{title}</h3>
        <span>
          <strong>{checkedCount}</strong> of {items.length} done
        </span>
      </header>
      <ul>
        {items.map((item) => {
          const complete = item.checked === true;
          return (
            <li key={item.id} data-checked={complete || undefined}>
              <span className="hosanna-checklist-box" aria-hidden="true">
                {complete ? <Check size={15} /> : null}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
