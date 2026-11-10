# @hosanna/logos-ai

Logos — modular chat UI, streaming, proposals, and the interactive mascot.

## Layout

```
src/
  host/        # LogosHost + LogosSongAdapter (no hooks on the host)
  types/       # API, chat, mood, message helpers
  core/        # id, stream, threads, bridge, tools
  chat/        # provider, hooks, dock/panel UI
  proposals/   # store, parse, diff, proposal UI
  mascot/      # LogosMascot + styles.css
```

## Install

```bash
pnpm add @hosanna/logos-ai
```

Peer deps: `react`, `react-dom`, `react-router-dom`, `lucide-react`.

## Host + song adapter

`LogosHost` is plain data/API (no React hooks). Song load/save lives on a separate `LogosSongAdapter` so proposal UI does not put hooks on the host object.

```tsx
import {
  AiChatDock,
  AiChatProvider,
  LogosHostProvider,
  LogosSongAdapterProvider,
  type LogosHost,
  type LogosSongAdapter,
} from "@hosanna/logos-ai";

function AppLogos({
  host,
  songs,
  children,
}: {
  host: LogosHost;
  songs: LogosSongAdapter;
  children: React.ReactNode;
}) {
  return (
    <LogosHostProvider value={host}>
      <LogosSongAdapterProvider value={songs}>
        <AiChatProvider>
          {children}
          <AiChatDock />
        </AiChatProvider>
      </LogosSongAdapterProvider>
    </LogosHostProvider>
  );
}
```

In Hosanna Studio see `apps/studio/src/logos/StudioLogosProvider.tsx`.

## Subpath imports

```ts
import { LogosHostProvider } from "@hosanna/logos-ai/host";
import { AiChatProvider, useAiChat } from "@hosanna/logos-ai/chat";
import { aiProposals } from "@hosanna/logos-ai/proposals";
import { LogosMascot } from "@hosanna/logos-ai/mascot";
import "@hosanna/logos-ai/styles.css";
```

Root `@hosanna/logos-ai` still re-exports the public API (`AiChatDock`, `useAiChat`, `LogosMascot`, `aiContextBridge`, `aiProposals`, `dispatch*`, …).

## Exports

- **UI**: `AiChatDock`, `AiChatToggle`, `AiChatProvider`, `LogosMascot`, proposal tray/banner/card/review
- **State**: `aiContextBridge`, `aiProposals`, thread helpers
- **Host**: `LogosHostProvider`, `LogosSongAdapterProvider`, `useLogosHost`, `useLogosI18n`, `useHostSong`, `useHostUpdateSong`
- **Events**: `dispatchAiNavigate`, `dispatchAiPrint`, `dispatchLibraryChanged`, `dispatchAiSettingsChanged`

Host apps own translations (`ai.chat.*` keys), the HTTP client, and song load/save hooks.
