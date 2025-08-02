import React from "react";

interface CardActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function CardActionButton({
  children,
  ...rest
}: CardActionButtonProps) {
  return (
    <button
      className={`cursor-pointer w-18 p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col items-center
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:dark:hover:text-gray-400
      `}
      {...rest}
    >
      {children}
    </button>
  );
}