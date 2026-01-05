import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "default"
  | "secondary"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-sm border text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2 text-sm",
  xl: "px-4 py-3 text-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700",
  secondary: "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
  primary: "bg-blue-600 border-blue-500 text-white hover:bg-blue-700",
  success: "bg-green-600 border-green-500 text-white hover:bg-green-700",
  warning: "bg-yellow-600 border-yellow-500 text-gray-900 hover:bg-yellow-700",
  danger: "bg-red-600 border-red-500 text-white hover:bg-red-700",
  info: "bg-blue-600 border-blue-500 text-white hover:bg-blue-700",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "sm",
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
});

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
