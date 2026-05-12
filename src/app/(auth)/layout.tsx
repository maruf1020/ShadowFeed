import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="shadow-feed-shell min-h-screen">{children}</div>;
}
