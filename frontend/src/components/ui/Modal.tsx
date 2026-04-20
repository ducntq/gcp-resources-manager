import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export function Modal({ open, title, onClose, children, footer, wide }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className={`bg-panel border border-border rounded-lg shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>
        <div className="p-4 overflow-y-auto text-sm">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 px-4 py-3 border-t border-border">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
