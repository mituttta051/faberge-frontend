import { Fragment } from "react";

/**
 * Лёгкий рендер markdown — только **bold** и переводы строк.
 * Достаточно для ответов LLM в нашем чате. Без зависимостей.
 */
export function Markdown({ children }: { children: string }) {
  const lines = children.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {renderInline(line)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="font-medium">
          {bold[1]}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
