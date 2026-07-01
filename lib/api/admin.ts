import type {
  AdminExhibit,
  AdminSession,
  ExhibitImage,
  ExhibitInput,
  Hall,
  HallInput,
  Showcase,
  ShowcaseInput,
} from "@/lib/types";
import { fetchAllPaged, request, setAdminToken } from "./client";

// ============================
// Wire-типы (snake_case) + мапперы. Те же соглашения, что и в endpoints.ts;
// дублируем локально, чтобы админ-слой был самодостаточным.
// ============================

interface WireHall {
  id: number;
  hall_number: number;
  name?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  showcase_count?: number | null;
  exhibit_count?: number | null;
}

interface WireShowcase {
  id: number;
  hall_id: number;
  showcase_number: number;
  name?: string | null;
  exhibit_count?: number | null;
}

interface WireAdminExhibit {
  id: number;
  showcase_id?: number | null;
  hall_id?: number | null;
  label_slug?: string | null;
  name: string;
  year_created?: number | null;
  master_name?: string | null;
  material?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  raw_history?: string | null;
}

interface WireImage {
  id: number;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  is_primary: boolean;
}

interface WireMediaUploadResponse {
  image_id: number;
  image_url: string;
  thumbnail_url?: string | null;
  object_key: string;
}

function mapImage(i: WireImage): ExhibitImage {
  return {
    id: i.id,
    url: i.url,
    alt: i.alt ?? undefined,
    width: i.width ?? undefined,
    height: i.height ?? undefined,
    isPrimary: i.is_primary,
  };
}

function mapHall(h: WireHall): Hall {
  return {
    id: h.id,
    hallNumber: h.hall_number,
    name: h.name ?? undefined,
    description: h.description ?? undefined,
    coverImageUrl: h.cover_image_url ?? undefined,
    showcaseCount: h.showcase_count ?? undefined,
    exhibitCount: h.exhibit_count ?? undefined,
  };
}

function mapShowcase(s: WireShowcase): Showcase {
  return {
    id: s.id,
    hallId: s.hall_id,
    showcaseNumber: s.showcase_number,
    name: s.name ?? undefined,
    exhibitCount: s.exhibit_count ?? undefined,
  };
}

function mapAdminExhibit(e: WireAdminExhibit): AdminExhibit {
  return {
    id: e.id,
    showcaseId: e.showcase_id ?? undefined,
    hallId: e.hall_id ?? undefined,
    labelSlug: e.label_slug ?? undefined,
    name: e.name,
    yearCreated: e.year_created ?? undefined,
    masterName: e.master_name ?? undefined,
    material: e.material ?? undefined,
    shortDescription: e.short_description ?? undefined,
    photoUrl: e.image_url ?? undefined,
    rawHistory: e.raw_history ?? undefined,
  };
}

// domain → wire (для записи)
function hallToWire(input: HallInput) {
  return {
    hall_number: input.hallNumber,
    name: input.name ?? null,
    description: input.description ?? null,
    cover_image_url: input.coverImageUrl ?? null,
  };
}

function showcaseToWire(input: ShowcaseInput) {
  return {
    hall_id: input.hallId,
    showcase_number: input.showcaseNumber,
    name: input.name ?? null,
  };
}

function exhibitToWire(input: ExhibitInput) {
  return {
    showcase_id: input.showcaseId ?? null,
    hall_id: input.hallId ?? null,
    label_slug: input.labelSlug ?? null,
    name: input.name,
    year_created: input.yearCreated ?? null,
    master_name: input.masterName ?? null,
    material: input.material ?? null,
    short_description: input.shortDescription ?? null,
    image_url: input.photoUrl ?? null,
    raw_history: input.rawHistory ?? null,
  };
}

// ============================
// Чтение для админ-таблиц
// ============================

export async function getAllShowcases(): Promise<Showcase[]> {
  return (await fetchAllPaged<WireShowcase>("/showcases")).map(mapShowcase);
}

export async function getAllExhibits(): Promise<AdminExhibit[]> {
  return (await fetchAllPaged<WireAdminExhibit>("/exhibits")).map(mapAdminExhibit);
}

// ============================
// CRUD: залы
// ============================

export async function createHall(input: HallInput): Promise<Hall> {
  return mapHall(await request<WireHall>("/admin/halls", { method: "POST", json: hallToWire(input) }));
}

export async function updateHall(id: number, input: HallInput): Promise<Hall> {
  return mapHall(
    await request<WireHall>(`/admin/halls/${id}`, { method: "PATCH", json: hallToWire(input) }),
  );
}

// NB: на бэке DELETE /admin/halls/{id} пока нет — вернётся 404/405 (см. контракт).
export async function deleteHall(id: number): Promise<void> {
  await request<void>(`/admin/halls/${id}`, { method: "DELETE" });
}

/** Загрузка обложки зала (multipart). Бэк пишет URL в cover_image_url. */
export async function uploadHallCover(hallId: number, file: File): Promise<Hall> {
  const fd = new FormData();
  fd.append("file", file);
  return mapHall(
    await request<WireHall>(`/admin/halls/${hallId}/cover`, {
      method: "POST",
      body: fd,
      timeoutMs: 30_000,
    }),
  );
}

// ============================
// CRUD: витрины
// ============================

export async function createShowcase(input: ShowcaseInput): Promise<Showcase> {
  return mapShowcase(
    await request<WireShowcase>("/admin/showcases", { method: "POST", json: showcaseToWire(input) }),
  );
}

// NB: на бэке PATCH /admin/showcases/{id} пока нет — вернётся 404/405 (см. контракт).
export async function updateShowcase(id: number, input: ShowcaseInput): Promise<Showcase> {
  return mapShowcase(
    await request<WireShowcase>(`/admin/showcases/${id}`, {
      method: "PATCH",
      json: showcaseToWire(input),
    }),
  );
}

// NB: на бэке DELETE /admin/showcases/{id} пока нет — вернётся 404/405 (см. контракт).
export async function deleteShowcase(id: number): Promise<void> {
  await request<void>(`/admin/showcases/${id}`, { method: "DELETE" });
}

// ============================
// CRUD: экспонаты
// ============================

export async function createExhibit(input: ExhibitInput): Promise<AdminExhibit> {
  return mapAdminExhibit(
    await request<WireAdminExhibit>("/admin/exhibits", { method: "POST", json: exhibitToWire(input) }),
  );
}

export async function updateExhibit(id: number, input: ExhibitInput): Promise<AdminExhibit> {
  return mapAdminExhibit(
    await request<WireAdminExhibit>(`/admin/exhibits/${id}`, {
      method: "PATCH",
      json: exhibitToWire(input),
    }),
  );
}

export async function deleteExhibit(id: number): Promise<void> {
  await request<void>(`/admin/exhibits/${id}`, { method: "DELETE" });
}

// ============================
// Медиа экспоната (галерея)
// ============================

export async function listExhibitMedia(exhibitId: number): Promise<ExhibitImage[]> {
  const res = await request<WireImage[]>(`/admin/exhibits/${exhibitId}/media`);
  return res.map(mapImage);
}

/** Загрузка фото (multipart). is_primary=true делает фото главным (exhibits.image_url). */
export async function uploadExhibitMedia(
  exhibitId: number,
  file: File,
  isPrimary = false,
): Promise<ExhibitImage> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("is_primary", String(isPrimary));
  const res = await request<WireMediaUploadResponse>(`/admin/exhibits/${exhibitId}/media`, {
    method: "POST",
    body: fd,
    timeoutMs: 30_000,
  });
  return { id: res.image_id, url: res.image_url, isPrimary };
}

export async function deleteExhibitMedia(exhibitId: number, imageId: number): Promise<void> {
  await request<void>(`/admin/exhibits/${exhibitId}/media/${imageId}`, { method: "DELETE" });
}

// ============================
// Аутентификация
//
// POST /admin/login (логин/пароль → статический Bearer-токен). Токен кладём в
// localStorage и в client.setAdminToken — он уходит в заголовке ко всем /admin/**.
// ============================

const SESSION_KEY = "museum_admin_session";

interface WireLoginResponse {
  access_token: string;
  token_type: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export async function loginAdmin({ username, password }: LoginInput): Promise<AdminSession> {
  const res = await request<WireLoginResponse>("/admin/login", {
    method: "POST",
    json: { username, password },
  });
  return { token: res.access_token, username: username || "admin" };
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as AdminSession) : null;
    // Восстанавливаем токен в client при перезагрузке страницы.
    if (session) setAdminToken(session.token);
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  setAdminToken(session.token);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  setAdminToken(null);
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
