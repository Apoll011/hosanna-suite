import { HomeProviders } from "@/components/home/HomeProviders";
import type { ReactNode } from "react";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <HomeProviders>{children}</HomeProviders>;
}
