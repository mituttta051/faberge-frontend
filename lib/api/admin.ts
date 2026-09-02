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
  hall_number?: number | null;
  name?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  is_temporary?: boolean | null;
  is_service?: boolean | null;
  sort_order?: number | null;
  showcase_count?: number | null;
  exhibit_count?: number | null;
}

interface WireShowcase {
  id: number;
  hall_id: number;
  showcase_number?: number | null;
  name?: string | null;
  exhibit_count?: number | null;
}

interface WireAdminExhibit {
  id: number;
  // Списки (/exhibits) отдают плоские showcase_id/hall_id, детальная карточка
  // (/admin/exhibits/{id}) — вложенные объекты. Поддерживаем оба варианта.
  showcase_id?: number | null;
  hall_id?: number | null;
  hall?: { id: number } | null;
  showcase?: { id: number } | null;
  label_slug?: string | null;
  exhibit_number?: string | null;
  name: string;
  year_created?: string | null;
  master_name?: string | null;
  material?: string | null;
  techniques?: string | null;
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
    hallNumber: h.hall_number ?? undefined,
    name: h.name ?? undefined,
    description: h.description ?? undefined,
    coverImageUrl: h.cover_image_url ?? undefined,
    isTemporary: h.is_temporary ?? undefined,
    isService: h.is_service ?? undefined,
    sortOrder: h.sort_order ?? undefined,
    showcaseCount: h.showcase_count ?? undefined,
    exhibitCount: h.exhibit_count ?? undefined,
  };
}

function mapShowcase(s: WireShowcase): Showcase {
  return {
    id: s.id,
    hallId: s.hall_id,
    showcaseNumber: s.showcase_number ?? undefined,
    name: s.name ?? undefined,
    exhibitCount: s.exhibit_count ?? undefined,
  };
}

function mapAdminExhibit(e: WireAdminExhibit): AdminExhibit {
  return {
    id: e.id,
    showcaseId: e.showcase_id ?? e.showcase?.id ?? undefined,
    hallId: e.hall_id ?? e.hall?.id ?? undefined,
    labelSlug: e.label_slug ?? undefined,
    exhibitNumber: e.exhibit_number ?? undefined,
    name: e.name,
    yearCreated: e.year_created ?? undefined,
    masterName: e.master_name ?? undefined,
    material: e.material ?? undefined,
    techniques: e.techniques ?? undefined,
    shortDescription: e.short_description ?? undefined,
    photoUrl: e.image_url ?? undefined,
    rawHistory: e.raw_history ?? undefined,
  };
}

// domain → wire (для записи)
function hallToWire(input: HallInput) {
  return {
    hall_number: input.hallNumber ?? null,
    name: input.name ?? null,
    description: input.description ?? null,
    cover_image_url: input.coverImageUrl ?? null,
    // Форма всегда присылает актуальное состояние переключателей, поэтому шлём
    // булево, а не пропускаем поле: иначе снять отметку «служебный» или
    // «временная выставка» было бы нечем — PATCH меняет только переданные поля.
    is_service: input.isService ?? false,
    is_temporary: input.isTemporary ?? false,
  };
}

function showcaseToWire(input: ShowcaseInput) {
  return {
    hall_id: input.hallId,
    showcase_number: input.showcaseNumber ?? null,
    name: input.name ?? null,
  };
}

/** Поля формы экспоната → ключи wire-контракта. Порядок задаёт порядок в теле запроса. */
const EXHIBIT_WIRE_KEYS = {
  showcaseId: "showcase_id",
  hallId: "hall_id",
  labelSlug: "label_slug",
  exhibitNumber: "exhibit_number",
  name: "name",
  yearCreated: "year_created",
  masterName: "master_name",
  material: "material",
  techniques: "techniques",
  shortDescription: "short_description",
  photoUrl: "image_url",
  rawHistory: "raw_history",
} as const satisfies Record<keyof ExhibitInput, string>;

/** Полное тело — для POST: у нового экспоната сравнивать не с чем. */
function exhibitToWire(input: ExhibitInput): Record<string, unknown> {
  const wire: Record<string, unknown> = {};
  for (const [field, key] of Object.entries(EXHIBIT_WIRE_KEYS)) {
    wire[key] = input[field as keyof ExhibitInput] ?? null;
  }
  return wire;
}

/**
 * Тело PATCH — только те поля, которые администратор действительно изменил.
 *
 * Раньше сохранение отправляло весь набор полей с `null` вместо пустых, то есть
 * PATCH работал как полная перезапись: всё, чего не было в состоянии формы,
 * обнулялось на сервере. Так у экспоната пропадали фото, материалы и описание
 * (фидбэк заказчика 31.08.2026, раздел «Административная панель»). Классический
 * случай — главное фото: им владеет галерея ниже формы, поле «URL фото» о
 * загрузке не знало и возвращало поверх неё старое (пустое) значение.
 *
 * Диффом снимается вся ветка целиком: нетронутое поле в запрос не попадает и
 * затереться не может. Осознанная очистка при этом работает — очищенное поле
 * отличается от прежнего значения и уезжает явным `null`.
 */
function exhibitPatchToWire(
  input: ExhibitInput,
  previous: Partial<ExhibitInput>,
): Record<string, unknown> {
  const wire: Record<string, unknown> = {};
  for (const [field, key] of Object.entries(EXHIBIT_WIRE_KEYS)) {
    const next = input[field as keyof ExhibitInput] ?? null;
    const prev = previous[field as keyof ExhibitInput] ?? null;
    if (next !== prev) wire[key] = next;
  }
  return wire;
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

/**
 * Полная карточка для формы редактирования. Список выше — публичный summary
 * без material/short_description/raw_history: если инициализировать форму
 * строкой списка, сохранение затрёт эти поля null'ами.
 */
export async function getAdminExhibit(id: number): Promise<AdminExhibit> {
  return mapAdminExhibit(await request<WireAdminExhibit>(`/admin/exhibits/${id}`));
}

// ============================
// CRUD: залы
// ============================

export async function createHall(input: HallInput): Promise<Hall> {
  return mapHall(
    await request<WireHall>("/admin/halls", { method: "POST", json: hallToWire(input) }),
  );
}

export async function updateHall(id: number, input: HallInput): Promise<Hall> {
  return mapHall(
    await request<WireHall>(`/admin/halls/${id}`, { method: "PATCH", json: hallToWire(input) }),
  );
}

/**
 * Удаляет зал. Непустой зал бэкенд удалять отказывается: если в нём есть
 * витрины — 409 с текстом «Зал не пуст». Каскад включается `?force=true`,
 * который мы намеренно не шлём, — см. диалог подтверждения в админке.
 */
export async function deleteHall(id: number): Promise<void> {
  await request<void>(`/admin/halls/${id}`, { method: "DELETE" });
}

/**
 * Новый порядок залов (drag-n-drop, C11).
 *
 * Бэк переставляет залы «по слотам»: берёт их текущие sort_order, сортирует и
 * раздаёт в присланном порядке. Поэтому допустимо слать подсписок — например,
 * только основную экспозицию, — залы вне запроса не сдвинутся.
 * Возвращает залы уже в новом порядке.
 */
export async function reorderHalls(hallIds: number[]): Promise<Hall[]> {
  const res = await request<{ items: WireHall[] }>("/admin/halls/reorder", {
    method: "PUT",
    json: { hall_ids: hallIds },
  });
  return res.items.map(mapHall);
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
    await request<WireShowcase>("/admin/showcases", {
      method: "POST",
      json: showcaseToWire(input),
    }),
  );
}

/**
 * Частичное обновление витрины. Перенос в другой зал и смена номера учитывают
 * уникальность пары (зал, номер) — при конфликте бэкенд отвечает 409.
 */
export async function updateShowcase(id: number, input: ShowcaseInput): Promise<Showcase> {
  return mapShowcase(
    await request<WireShowcase>(`/admin/showcases/${id}`, {
      method: "PATCH",
      json: showcaseToWire(input),
    }),
  );
}

/** Удаляет витрину. Непустую — только с `?force=true`, иначе 409. */
export async function deleteShowcase(id: number): Promise<void> {
  await request<void>(`/admin/showcases/${id}`, { method: "DELETE" });
}

// ============================
// CRUD: экспонаты
// ============================

export async function createExhibit(input: ExhibitInput): Promise<AdminExhibit> {
  return mapAdminExhibit(
    await request<WireAdminExhibit>("/admin/exhibits", {
      method: "POST",
      json: exhibitToWire(input),
    }),
  );
}

/**
 * `previous` — карточка, на которой открывали форму. Без неё отправляется весь
 * набор полей, и любое поле, которого нет в форме, обнулится: вызывать так
 * можно, только когда форма заведомо держит экспонат целиком.
 */
export async function updateExhibit(
  id: number,
  input: ExhibitInput,
  previous?: Partial<ExhibitInput>,
): Promise<AdminExhibit> {
  const json = previous ? exhibitPatchToWire(input, previous) : exhibitToWire(input);
  // Ничего не изменилось (например, закрыли форму после загрузки фото) — пустой
  // PATCH дёргать незачем, отдаём актуальную карточку с сервера.
  if (Object.keys(json).length === 0) return getAdminExhibit(id);
  return mapAdminExhibit(
    await request<WireAdminExhibit>(`/admin/exhibits/${id}`, { method: "PATCH", json }),
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
