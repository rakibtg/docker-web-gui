import { memo } from "react";

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper = memo<PageWrapperProps>(function PageWrapper({
  children,
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  );
});
