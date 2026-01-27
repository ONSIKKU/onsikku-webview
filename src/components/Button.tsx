import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-onsikku-dark-orange text-white hover:opacity-90"
      : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
