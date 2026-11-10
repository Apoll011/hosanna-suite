# @hosanna/logos-ai

Logos — chat UI, streaming logic, proposals, and the interactive mascot.

## Install

```bash
pnpm add @hosanna/logos-ai
```

Peer deps: `react`, `react-dom`, `react-router-dom`, `lucide-react`.

## Usage

Wire a host (API, i18n, permissions, songs), then mount the chat:

```tsx
import {
  AiChatDock,
  AiChatProvider,
  LogosHostProvider,
  type LogosHost,
} from "@hosanna/logos-ai";
// Styles (mascot + chat motion) load via AiChatProvider; or import "@hosanna/logos-ai/styles.css"

function AppLogos({ host, children }: { host: LogosHost; children: React.ReactNode }) {
  return (
    <LogosHostProvider value={host}>
      <AiChatProvider>
        {children}
        <AiChatDock />
      </AiChatProvider>
    </LogosHostProvider>
  );
}
```

In Hosanna Studio the host is `apps/studio/src/logos/StudioLogosProvider.tsx`.

## Exports

- **UI**: `AiChatDock`, `AiChatToggle`, `AiChatProvider`, `LogosMascot`, proposal tray/banner/card/review
- **State**: `aiContextBridge`, `aiProposals`, thread helpers
- **Host**: `LogosHostProvider`, `useLogosHost`, `useLogosI18n`
- **Events**: `dispatchAiNavigate`, `dispatchAiPrint`, `dispatchLibraryChanged`, `dispatchAiSettingsChanged`

Host apps own translations (`ai.chat.*` keys), the HTTP client, and song load/save hooks.
