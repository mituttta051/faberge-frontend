import { cn } from "@/lib/utils";

interface SafeAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  top?: boolean;
  bottom?: boolean;
  x?: boolean;
}

/**
 * Утилитная обёртка под safe-area-inset для iOS (вырез, нижняя полоска, ландшафт).
 * Включай нужные стороны через пропы. По умолчанию ничего не добавляет.
 */
export function SafeArea({ top, bottom, x, className, children, ...props }: SafeAreaProps) {
  return (
    <div
      className={cn(
        top && "pt-[env(safe-area-inset-top)]",
        bottom && "pb-[env(safe-area-inset-bottom)]",
        x && "pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
