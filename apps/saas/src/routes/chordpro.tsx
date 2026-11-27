// SPDX-License-Identifier: AGPL-3.0-only
import { ChordProGuide } from "@/components/hosanna/ChordProGuide";
import { Nav } from "@/components/hosanna/HosannaLanding";
import { CurtainLayout } from "@/components/ui/CurtainLayout";

export function Component() {
  return (
    <CurtainLayout className="text-white selection:bg-cyan-400/20">
      <Nav />
      <ChordProGuide />
    </CurtainLayout>
  );
}
