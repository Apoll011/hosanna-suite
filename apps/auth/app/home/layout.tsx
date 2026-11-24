// SPDX-License-Identifier: AGPL-3.0-only
import { HomeProviders } from "@/components/home/HomeProviders";
import type { ReactNode } from "react";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <HomeProviders>{children}</HomeProviders>;
}
