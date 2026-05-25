import type { Hall } from "@/lib/types";

/**
 * 11 залов Музея Фаберже (2 этаж).
 * Источник: https://fabergemuseum.ru/posetitelyam/plan-ekspozitsii
 */
export const halls = [
  {
    id: 1,
    hallNumber: 1,
    name: "Парадная лестница",
    shortDescription: "Архитектурный элемент с галереей скульптуры.",
    description:
      "Парадная лестница Шуваловского дворца — образец русского классицизма. Здесь расположена галерея скульптуры XIX века.",
    coverImageUrl: "https://placehold.co/800x500/e5e2dc/0a0a0a?text=Parade+Staircase",
  },
  {
    id: 2,
    hallNumber: 2,
    name: "Рыцарский зал",
    shortDescription: "Военная тематика в искусстве.",
    description:
      "Зал посвящён военным сюжетам в русском декоративно-прикладном искусстве: оружие, доспехи, миниатюра.",
    coverImageUrl: "https://placehold.co/800x500/e5e2dc/0a0a0a?text=Knight+Hall",
  },
  {
    id: 3,
    hallNumber: 3,
    name: "Красная гостиная",
    shortDescription: "Русское художественное серебро XVIII — начала XX вв.",
    description:
      "Коллекция русского серебра: посуда, предметы культа и интерьерные вещи работы лучших мастеров империи.",
    coverImageUrl: "https://placehold.co/800x500/8b3a2f/ffffff?text=Red+Drawing+Room",
  },
  {
    id: 4,
    hallNumber: 4,
    name: "Синяя гостиная",
    shortDescription: "Императорские пасхальные яйца Фаберже.",
    description:
      "Самый знаменитый зал — здесь хранится крупнейшая в мире коллекция императорских пасхальных яиц фирмы Фаберже.",
    coverImageUrl: "https://placehold.co/800x500/2c4a7c/ffffff?text=Blue+Drawing+Room",
  },
  {
    id: 5,
    hallNumber: 5,
    name: "Золотая гостиная",
    shortDescription: "Царские подарки и фантазийные произведения.",
    description:
      "Драгоценные подарки членов императорской семьи, фантазийные предметы Фаберже — табакерки, флаконы, миниатюрные фигуры.",
    coverImageUrl: "https://placehold.co/800x500/8b6f3f/ffffff?text=Gold+Drawing+Room",
  },
  {
    id: 6,
    hallNumber: 6,
    name: "Аванзал",
    shortDescription: "Украшения, часы и драгоценная галантерея.",
    description:
      "Ювелирные украшения, часы и драгоценные мелочи, выполненные Фаберже и другими мастерами рубежа XIX–XX веков.",
    coverImageUrl: "https://placehold.co/800x500/e5e2dc/0a0a0a?text=Avant+Hall",
  },
  {
    id: 7,
    hallNumber: 7,
    name: "Белая и Голубая гостиные",
    shortDescription: "Изделия с эмалью и русский фарфор.",
    description:
      "Эмалевые изделия Фаберже и других русских мастеров, а также избранные образцы русского фарфора.",
    coverImageUrl: "https://placehold.co/800x500/f5f4f0/0a0a0a?text=White+Blue+Rooms",
  },
  {
    id: 8,
    hallNumber: 8,
    name: "Выставочный зал",
    shortDescription: "Камнерезные изделия и живопись XIX века.",
    description:
      "Камнерезные миниатюры из уральских самоцветов, живопись русских мастеров XIX века.",
    coverImageUrl: "https://placehold.co/800x500/e5e2dc/0a0a0a?text=Exhibition+Hall",
  },
  {
    id: 9,
    hallNumber: 9,
    name: "Готический зал",
    shortDescription: "Коллекция русских икон XVI — XX вв.",
    description:
      "Собрание русских икон — от древних образов XVI века до работ начала XX века, оклады работы лучших мастеров.",
    coverImageUrl: "https://placehold.co/800x500/3a2c1a/ffffff?text=Gothic+Hall",
  },
  {
    id: 10,
    hallNumber: 10,
    name: "Верхняя буфетная",
    shortDescription: "Импрессионистическая живопись.",
    description: "Коллекция русской импрессионистической живописи конца XIX — начала XX века.",
    coverImageUrl: "https://placehold.co/800x500/c9a875/ffffff?text=Upper+Buffet",
  },
  {
    id: 11,
    hallNumber: 11,
    name: "Бежевый зал",
    shortDescription: "Русская эмаль и посуда.",
    description: "Финальный зал экспозиции: русская эмаль и парадная посуда.",
    coverImageUrl: "https://placehold.co/800x500/d4c5a0/0a0a0a?text=Beige+Hall",
  },
] satisfies Hall[];
