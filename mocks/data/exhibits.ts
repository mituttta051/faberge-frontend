import type { Exhibit } from "@/lib/types";

/**
 * Шедевры коллекции Музея Фаберже.
 * Источник: https://fabergemuseum.ru/kollekczii/shedevryi-kollekczii/
 * Фото — placehold.co (заменим на реальные при наполнении БД).
 */
export const exhibits = [
  // ============================
  // Синяя гостиная — императорские пасхальные яйца
  // ============================
  {
    id: 1001,
    showcaseId: 41,
    hallId: 4,
    labelSlug: "faberge_egg_rosebud",
    name: "Яйцо «Бутон розы»",
    yearCreated: 1895,
    masterName: "Михаил Перхин",
    material: "Золото, эмаль, бриллианты, рубины",
    shortDescription:
      "Первое императорское пасхальное яйцо Николая II — подарок супруге Александре Фёдоровне.",
    photoUrl: "https://placehold.co/800x800/2c4a7c/ffffff?text=Rosebud+Egg",
    rawHistory:
      "Мастер — Михаил Перхин. Заказчик — Николай II. Подарок императрице Александре Фёдоровне на Пасху 1895 года. Корпус из красной гильошированной эмали по золоту. Внутри сюрприз — бутон розы, открывающийся миниатюрной короной и подвеской с рубином-кабошоном.",
  },
  {
    id: 1002,
    showcaseId: 41,
    hallId: 4,
    labelSlug: "faberge_egg_lily_of_the_valley",
    name: "Яйцо «Ландыши»",
    yearCreated: 1898,
    masterName: "Михаил Перхин",
    material: "Золото, эмаль, жемчуг, бриллианты",
    shortDescription:
      "Любимый цветочный мотив императрицы Александры Фёдоровны — подарок Николая II на Пасху 1898 года.",
    photoUrl: "https://placehold.co/800x800/2c4a7c/ffffff?text=Lily+Egg",
    rawHistory:
      "Мастер — Михаил Перхин. Заказчик — Николай II. Подарок императрице Александре Фёдоровне. Розовая гильошированная эмаль, букетики ландышей из жемчуга и бриллиантов. Внутри — три миниатюрных портрета: Николая II и двух дочерей Ольги и Татьяны.",
  },
  {
    id: 1003,
    showcaseId: 41,
    hallId: 4,
    labelSlug: "faberge_egg_coronation",
    name: "Яйцо «Коронационное»",
    yearCreated: 1897,
    masterName: "Михаил Перхин, Генрих Вигстрём",
    material: "Золото, эмаль, бриллианты, горный хрусталь",
    shortDescription: "Подарено в честь коронации Николая II 1896 года.",
    photoUrl: "https://placehold.co/800x800/8b6f3f/ffffff?text=Coronation+Egg",
    rawHistory:
      "Мастера — Михаил Перхин и Генрих Вигстрём. Жёлтая эмаль воспроизводит коронационную мантию императрицы. Сюрприз — точная миниатюрная копия коронационной кареты, выполненная Георгом Штейном.",
  },
  {
    id: 1004,
    showcaseId: 41,
    hallId: 4,
    labelSlug: "faberge_egg_renaissance",
    name: "Яйцо «Ренессанс»",
    yearCreated: 1894,
    masterName: "Михаил Перхин",
    material: "Молочный агат, золото, эмаль, бриллианты, рубины",
    shortDescription: "Последний пасхальный подарок Александра III императрице Марии Фёдоровне.",
    photoUrl: "https://placehold.co/800x800/2c4a7c/ffffff?text=Renaissance+Egg",
    rawHistory:
      "Мастер — Михаил Перхин. Заказчик — Александр III. Корпус из молочного агата, оправа в стиле Ренессанс. Сюрприз утрачен — предположительно жемчужное ожерелье.",
  },
  {
    id: 1005,
    showcaseId: 42,
    hallId: 4,
    labelSlug: "faberge_egg_hen",
    name: "Яйцо «Курочка»",
    yearCreated: 1885,
    masterName: "Эрик Коллин",
    material: "Золото, эмаль, рубин",
    shortDescription:
      "Первое яйцо Фаберже — подарок Александра III Марии Фёдоровне на Пасху 1885 года.",
    photoUrl: "https://placehold.co/800x800/c9a875/0a0a0a?text=Hen+Egg",
    rawHistory:
      "Мастер — Эрик Коллин. Заказчик — Александр III. Простое «куриное» яйцо: белая эмалевая «скорлупа» открывается, внутри золотой желток, в котором — золотая курочка с рубиновыми глазами.",
  },

  // ============================
  // Золотая гостиная — фантазийные предметы
  // ============================
  {
    id: 2001,
    showcaseId: 51,
    hallId: 5,
    labelSlug: "faberge_pansy_basket",
    name: "Корзина с анютиными глазками",
    yearCreated: 1896,
    masterName: "Август Хольмстрём",
    material: "Серебро, золото, эмаль, аметисты, бриллианты",
    shortDescription: "Подарок Николая II императрице Александре Фёдоровне.",
    photoUrl: "https://placehold.co/800x800/8b6f3f/ffffff?text=Pansy+Basket",
    rawHistory:
      "Корзина с букетом анютиных глазок — натуралистичный мотив, типичный для Фаберже. Лепестки из аметистов и эмали.",
  },

  // ============================
  // Аванзал — часы
  // ============================
  {
    id: 3001,
    showcaseId: 61,
    hallId: 6,
    labelSlug: "faberge_chanticleer_clock",
    name: "Часы «Шантеклер»",
    yearCreated: 1903,
    masterName: "Михаил Перхин",
    material: "Серебро, золото, эмаль, жемчуг",
    shortDescription: "Уникальные часы с механической фигурой петуха, поющего каждый час.",
    photoUrl: "https://placehold.co/800x800/c9a875/ffffff?text=Chanticleer+Clock",
    rawHistory:
      "Мастер — Михаил Перхин. Каждый час из верхушки часов появляется механическая фигурка петуха, поёт и взмахивает крыльями.",
  },

  // ============================
  // Готический зал — иконы
  // ============================
  {
    id: 4001,
    showcaseId: 91,
    hallId: 9,
    labelSlug: "icon_virgin_kazan",
    name: "Икона Казанской Божией Матери",
    yearCreated: 1700,
    material: "Дерево, темпера, оклад серебро",
    shortDescription: "Русская икона начала XVIII века в серебряном окладе.",
    photoUrl: "https://placehold.co/800x800/3a2c1a/ffffff?text=Icon+Kazan",
    rawHistory: "Икона начала XVIII века, оклад работы московских серебряников. Темпера на дереве.",
  },

  // ============================
  // Рыцарский зал
  // ============================
  {
    id: 5001,
    showcaseId: 21,
    hallId: 2,
    labelSlug: "ceremonial_sabre_19c",
    name: "Парадная сабля офицера гвардии",
    yearCreated: 1850,
    material: "Сталь, золото, эмаль",
    shortDescription: "Парадное холодное оружие середины XIX века.",
    photoUrl: "https://placehold.co/800x800/e5e2dc/0a0a0a?text=Sabre",
    rawHistory: "Парадная офицерская сабля гвардии Российской империи, середина XIX века.",
  },
] satisfies Exhibit[];
