"use client";

import { useI18n } from "@/lib/ui/i18n";
import type { SuiteCatalogApp } from "@hosanna/ui";
import { useMemo, type ReactNode } from "react";
import { WidgetPreviewContext, type AppItem, type WidgetPreviewData } from "./shared";

function addDaysYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoDaysOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const FALLBACK_APPS: AppItem[] = [
  {
    id: "auth",
    name: "Account",
    shortName: "Account",
    description: "Profile, organization, billing",
    homeUrl: "/account",
    status: "available",
    accessible: true,
    accent: "#0F766E",
  },
  {
    id: "music",
    name: "Music",
    shortName: "Music",
    description: "Songs, collections, services",
    homeUrl: "#",
    status: "available",
    accessible: true,
    accent: "#0284c7",
  },
  {
    id: "planning",
    name: "Planning",
    shortName: "Planning",
    description: "Services, events, teams",
    homeUrl: null,
    status: "coming_soon",
    accessible: false,
    accent: "#d97706",
  },
];

export function WidgetPreviewProvider({
  apps,
  children,
}: {
  apps?: readonly SuiteCatalogApp[];
  children: ReactNode;
}) {
  const { locale } = useI18n();
  const isPt = locale.startsWith("pt");
  const isEs = locale.startsWith("es");

  const value = useMemo<WidgetPreviewData>(() => {
    const song1Content =
      "{title: Amazing Grace}\n{key: G}\n{tempo: 72}\n{youtube: https://youtu.be/demo}\n{soc}\n[G]Amazing [G7]grace how [C]sweet the [G]sound\n{eoc}";
    const song2Content =
      "{title: 10,000 Reasons}\n{key: G}\n{tempo: 73}\n{sov}\n[C]Bless the [G]Lord O my [D]soul [Em]\n{eov}";
    const song3Content =
      "{title: Great Are You Lord}\n{key: A}\n{tempo: 68}\n{sov}\n[A]You give [E]life, You are [F#m]love\n{eov}";
    const song4Content =
      "{title: Build My Life}\n{key: D}\n{tempo: 70}\n{sov}\n[D]Worthy of [G]every song we could ever sing\n{eov}";
    const song5Content = "{title: Holy Forever}\n{key: Db}\n[Db]A thousand generations";

    const mockSongs = [
      {
        id: "s1",
        title: "Amazing Grace",
        artist: "John Newton",
        tags: [isPt ? "Hino" : isEs ? "Himno" : "Hymn", isPt ? "Adoração" : "Worship"],
        content: song1Content,
        song_number: 12,
        updatedAt: isoDaysOffset(-2),
      },
      {
        id: "s2",
        title: "10,000 Reasons",
        artist: "Matt Redman",
        tags: [isPt ? "Adoração" : isEs ? "Adoración" : "Worship"],
        content: song2Content,
        song_number: 45,
        updatedAt: isoDaysOffset(-5),
      },
      {
        id: "s3",
        title: "Great Are You Lord",
        artist: "All Sons & Daughters",
        tags: [isPt ? "Adoração" : isEs ? "Adoración" : "Worship", "Acoustic"],
        content: song3Content,
        song_number: 78,
        updatedAt: isoDaysOffset(-9),
      },
      {
        id: "s4",
        title: "Build My Life",
        artist: "Pat Barrett",
        tags: [isPt ? "Congregacional" : "Congregational"],
        content: song4Content,
        song_number: 103,
        updatedAt: isoDaysOffset(-14),
      },
      {
        id: "s5",
        title: "Holy Forever",
        artist: "Chris Tomlin",
        tags: [],
        content: song5Content,
        song_number: null,
        updatedAt: isoDaysOffset(-20),
      },
    ];

    const mockServices = [
      {
        id: "svc-1",
        name: isPt ? "Culto de Domingo" : isEs ? "Culto Dominical" : "Sunday Morning",
        date: addDaysYmd(3),
        notes: isPt ? "Ensaio às 09:00" : isEs ? "Ensayo a las 09:00" : "Rehearsal at 09:00",
        elementCount: 6,
        hasSongs: true,
      },
      {
        id: "svc-2",
        name: isPt ? "Noite de Oração" : isEs ? "Noche de Oración" : "Midweek Prayer",
        date: addDaysYmd(6),
        elementCount: 4,
        hasSongs: true,
      },
      {
        id: "svc-3",
        name: isPt ? "Encontro de Jovens" : isEs ? "Reunión de Jóvenes" : "Youth Night",
        date: addDaysYmd(10),
        elementCount: 5,
        hasSongs: true,
      },
    ];

    const mappedApps: AppItem[] =
      apps && apps.length > 0
        ? apps.map((app) => ({
            id: app.id,
            name: app.name,
            shortName: app.shortName,
            description: app.description,
            homeUrl: app.homeUrl,
            status: app.status,
            accessible: app.accessible,
            logoUrl: app.logoUrl,
            accent: app.accent,
          }))
        : FALLBACK_APPS;

    const members = [
      {
        id: "m1",
        userId: "u1",
        role: "owner",
        user: { name: "Alex Rivera", email: "alex@grace.org", image: null },
      },
      {
        id: "m2",
        userId: "u2",
        role: "teamLeader",
        user: { name: "Sarah Chen", email: "sarah@grace.org", image: null },
      },
      {
        id: "m3",
        userId: "u3",
        role: "musician",
        user: { name: "Lucas Silva", email: "lucas@grace.org", image: null },
      },
      {
        id: "m4",
        userId: "u4",
        role: "musician",
        user: { name: "Hannah Brooks", email: "hannah@grace.org", image: null },
      },
      {
        id: "m5",
        userId: "u5",
        role: "admin",
        user: { name: "Daniel Park", email: "daniel@grace.org", image: null },
      },
    ];

    return {
      orgData: {
        services: mockServices,
        "service-detail": {
          id: "svc-1",
          elements: [
            { id: "e1", type: "song", song: { id: "s1", title: "Amazing Grace" } },
            { id: "e2", type: "song", song: { id: "s2", title: "10,000 Reasons" } },
            { id: "e3", type: "song", song: { id: "s3", title: "Great Are You Lord" } },
            { id: "e4", type: "song", song: { id: "s4", title: "Build My Life" } },
          ],
        },
        "songs-summary": {
          total: 124,
          songs: mockSongs,
        },
        "folders-summary": [
          {
            id: "f1",
            name: isPt ? "Domingos" : isEs ? "Domingos" : "Sunday Morning",
            songCount: 42,
            folderCount: 2,
          },
          {
            id: "f2",
            name: isPt ? "Hinos" : isEs ? "Himnos" : "Hymns",
            songCount: 31,
            folderCount: 0,
          },
          {
            id: "f3",
            name: isPt ? "Jovens" : isEs ? "Jóvenes" : "Youth",
            songCount: 24,
            folderCount: 1,
          },
        ],
        "trash-summary": {
          songs: [{ id: "t1" }, { id: "t2" }],
          folders: [{ id: "tf1" }],
          services: [],
        },
        "services-full": [
          {
            id: "past-1",
            date: addDaysYmd(-7),
            elements: [
              { type: "song", songId: "s1" },
              { type: "song", songId: "s2" },
              { type: "song", songId: "s3" },
            ],
          },
          {
            id: "past-2",
            date: addDaysYmd(-14),
            elements: [
              { type: "song", songId: "s1" },
              { type: "song", songId: "s2" },
            ],
          },
          {
            id: "past-3",
            date: addDaysYmd(-70),
            elements: [{ type: "song", songId: "s4" }],
          },
        ],
        collections: [
          {
            id: "c1",
            name: isPt ? "Ceia" : isEs ? "Santa Cena" : "Communion",
            songCount: 3,
          },
          {
            id: "c2",
            name: isPt ? "Acústico" : isEs ? "Acústico" : "Acoustic Set",
            songCount: 2,
          },
          {
            id: "c3",
            name: isPt ? "Favoritas" : isEs ? "Favoritas" : "All-Time Favorites",
            songCount: 5,
          },
        ],
        "agenda-events": [
          {
            id: "ag1",
            title: isPt ? "Ensaio Geral" : isEs ? "Ensayo General" : "Full Band Rehearsal",
            date: addDaysYmd(0),
            time: "19:30",
            type: isPt ? "Ensaio" : isEs ? "Ensayo" : "Rehearsal",
            color: "blue",
            location: isPt ? "Auditório" : isEs ? "Auditorio" : "Main Hall",
            responsibilities: [{ assignees: [{ id: "u1" }, { id: "u2" }, { id: "u3" }] }],
          },
          {
            id: "ag2",
            title: isPt ? "Culto de Domingo" : isEs ? "Culto Dominical" : "Sunday Worship",
            date: addDaysYmd(3),
            time: "10:00",
            type: isPt ? "Culto" : isEs ? "Culto" : "Service",
            color: "green",
            linkedServiceId: "svc-1",
            responsibilities: [
              { assignees: [{ id: "u1" }, { id: "u2" }, { id: "u3" }, { id: "u4" }] },
            ],
          },
          {
            id: "ag3",
            title: isPt ? "Reunião de Equipa" : isEs ? "Reunión de Equipo" : "Team Huddle",
            date: addDaysYmd(5),
            time: "18:30",
            type: isPt ? "Reunião" : isEs ? "Reunión" : "Meeting",
            color: "purple",
            responsibilities: [{ assignees: [{ id: "u1" }, { id: "u5" }] }],
          },
        ],
      },
      apps: mappedApps,
      favorites: ["auth", "music"],
      user: {
        id: "u1",
        name: "Alex Rivera",
        email: "alex@gracechurch.org",
        image: null,
        emailVerified: true,
        twoFactorEnabled: true,
      },
      sessionCount: 2,
      organization: {
        id: "org-preview",
        name: isPt ? "Igreja da Graça" : isEs ? "Iglesia de la Gracia" : "Grace Community Church",
        slug: "grace-church",
        logo: null,
        members,
      },
      activeRole: "owner",
      subscription: {
        entitled: true,
        subscription: {
          id: "sub-preview",
          plan: "hosanna-cloud",
          status: "active",
          periodEnd: isoDaysOffset(294),
          cancelAtPeriodEnd: false,
          trialEnd: null,
          billingInterval: "year",
        },
      },
      teams: [
        {
          id: "t1",
          name: isPt ? "Banda de Louvor" : isEs ? "Banda de Alabanza" : "Worship Band",
          memberCount: 6,
          members: [
            { id: "tm1", userId: "u1", name: "Alex Rivera", email: null, image: null },
            { id: "tm2", userId: "u2", name: "Sarah Chen", email: null, image: null },
            { id: "tm3", userId: "u3", name: "Lucas Silva", email: null, image: null },
          ],
        },
        {
          id: "t2",
          name: isPt ? "Som e Projeção" : isEs ? "Audio y Medios" : "Audio & Media",
          memberCount: 4,
          members: [
            { id: "tm4", userId: "u4", name: "Hannah Brooks", email: null, image: null },
            { id: "tm5", userId: "u5", name: "Daniel Park", email: null, image: null },
          ],
        },
      ],
      invitations: [
        { id: "inv1", email: "maria@gracechurch.org", role: "musician", status: "pending" },
        { id: "inv2", email: "david@gracechurch.org", role: "teamLeader", status: "pending" },
      ],
      inbox: {
        unreadCount: 2,
        items: [
          {
            id: "n1",
            title: isPt
              ? "Plano do culto atualizado"
              : isEs
                ? "Plan del culto actualizado"
                : "Service plan updated",
            body: isPt ? "Culto de Domingo · 4 músicas" : "Sunday Morning · 4 songs",
            href: null,
            readAt: null,
            createdAt: isoDaysOffset(0),
          },
          {
            id: "n2",
            title: isPt
              ? "Novo membro na equipa"
              : isEs
                ? "Nuevo miembro en el equipo"
                : "New member joined team",
            body: "Sarah Chen",
            href: null,
            readAt: null,
            createdAt: isoDaysOffset(-1),
          },
          {
            id: "n3",
            title: isPt
              ? "Fatura renovada"
              : isEs
                ? "Suscripción renovada"
                : "Subscription renewed",
            body: "Hosanna Cloud",
            href: null,
            readAt: isoDaysOffset(-3),
            createdAt: isoDaysOffset(-3),
          },
        ],
      },
    };
  }, [apps, isEs, isPt]);

  return <WidgetPreviewContext.Provider value={value}>{children}</WidgetPreviewContext.Provider>;
}
