import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1 mb-3">
      <span className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput(props: InputProps) {
  return (
    <input
      {...props}
      className={`w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 ${props.className ?? ""}`}
    />
  );
}
