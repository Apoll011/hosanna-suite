// SPDX-License-Identifier: AGPL-3.0-only
import { ContactForm } from "@/components/hosanna/ContactForm";
import { Footer, Nav } from "@/components/hosanna/HosannaLanding";
import WebGLCanvas from "@/components/ui/WebGLCanvas";

export function Component() {
  return (
    <>
      <WebGLCanvas showTextLayer={false} />
      <div className="min-h-screen bg-transparent font-sans text-white antialiased selection:bg-cyan-400/20 relative z-10">
        <Nav />
        <main>
          <ContactForm />
        </main>
        <Footer />
      </div>
    </>
  );
}
