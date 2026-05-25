import { cn } from "@/lib/utils";

interface ScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Screen({ className, children, ...props }: ScreenProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-full w-full max-w-md flex-1 flex-col",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
