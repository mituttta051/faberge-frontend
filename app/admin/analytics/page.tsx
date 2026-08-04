"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsUnanswered } from "@/lib/types";
import type { AnalyticsRange } from "@/lib/api/analytics";
import {
  useAnalyticsEngagement,
  useAnalyticsExhibits,
  useAnalyticsOverview,
  useAnalyticsQuestions,
  useAnalyticsRecognition,
  useAnalyticsRoutes,
  useAnalyticsUnanswered,
} from "@/lib/api/analytics-hooks";
import { formatRangeLabel, presetRange } from "@/lib/admin/date-range";
import {
  formatCount,
  formatDateTime,
  formatDecimal,
  formatDuration,
  formatShare,
} from "@/lib/admin/format";
import { BarList } from "@/components/admin/analytics/bar-list";
import { DateRangeFilter } from "@/components/admin/analytics/date-range-filter";
import { ExhibitsTable, type ExhibitsOrder } from "@/components/admin/analytics/exhibits-table";
import { QuestionTable } from "@/components/admin/analytics/question-table";
import { RecognitionReport } from "@/components/admin/analytics/recognition-report";
import { ReportSection } from "@/components/admin/analytics/report-section";
import { RoutesReport } from "@/components/admin/analytics/routes-report";
import { StatTile } from "@/components/admin/analytics/stat-tile";
import { UnansweredTable } from "@/components/admin/analytics/unanswered-table";

export default function AnalyticsPage() {
  // useSearchParams требует Suspense-границы — как на главной и в чате.
  return (
    <Suspense fallback={null}>
      <AnalyticsPageInner />
    </Suspense>
  );
}

const EXHIBITS_PAGE = 20;

function AnalyticsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Период живёт в URL, а не в состоянии компонента: ссылку на «июль» можно
   * переслать, и она откроется тем же отчётом. Значение по умолчанию — 30 дней,
   * за всё время цифры за годы работы музея никому не отвечают на вопрос
   * «как дела сейчас».
   */
  const range: AnalyticsRange = React.useMemo(() => {
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    if (!from && !to && !searchParams.has("all")) return presetRange("30d");
    return { from, to };
  }, [searchParams]);

  const setRange = React.useCallback(
    (next: AnalyticsRange) => {
      const params = new URLSearchParams();
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      // «Всё время» — пустой диапазон. Без явной метки его не отличить от
      // первого захода, и страница молча возвращалась бы к 30 дням.
      if (!next.from && !next.to) params.set("all", "1");
      router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const [exhibitsOrder, setExhibitsOrder] = React.useState<ExhibitsOrder>("views");
  const [exhibitsLimit, setExhibitsLimit] = React.useState(EXHIBITS_PAGE);

  const overview = useAnalyticsOverview(range);
  const engagement = useAnalyticsEngagement(range);
  const questions = useAnalyticsQuestions(range);
  const routes = useAnalyticsRoutes(range);
  const unanswered = useAnalyticsUnanswered(range);
  const exhibits = useAnalyticsExhibits(range, { order: exhibitsOrder, limit: exhibitsLimit });
  const recognition = useAnalyticsRecognition(range);

  const updatedAt = formatDateTime(overview.data?.updatedAt);
  const noData =
    !overview.isLoading &&
    !overview.error &&
    (overview.data?.totalSessions ?? 0) === 0 &&
    (overview.data?.totalAppOpens ?? 0) === 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl">Аналитика</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Посещения, вопросы к гиду и маршруты — {formatRangeLabel(range)}.
          {updatedAt && <> Данные на {updatedAt}.</>}
        </p>
      </header>

      <DateRangeFilter value={range} onChange={setRange} />

      {noData ? (
        <p className="border-border text-muted-foreground border border-dashed p-6 text-sm">
          За выбранный период событий нет. Если приложением пользуются, проверьте, что фронтенд
          отправляет телеметрию в <code>POST /telemetry/events</code>: без событий все отчёты
          пустые.
        </p>
      ) : (
        <>
          {/* ── Ключевые цифры ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Сессии"
              value={formatCount(overview.data?.totalSessions)}
              hint="визитов за период"
              loading={overview.isLoading}
            />
            <StatTile
              label="Открытий"
              value={formatCount(overview.data?.totalAppOpens)}
              hint="запусков приложения"
              loading={overview.isLoading}
            />
            <StatTile
              label="Вопросов гиду"
              value={formatCount(overview.data?.totalChatMessages)}
              hint="реплик посетителей"
              loading={overview.isLoading}
            />
            <StatTile
              label="Средний визит"
              value={formatDuration(engagement.data?.avgDurationSec)}
              hint={`медиана ${formatDuration(engagement.data?.medianDurationSec)}`}
              loading={engagement.isLoading}
            />
            <StatTile
              label="Распознаваний"
              value={formatCount(overview.data?.totalRecognitions)}
              hint={`успешно ${formatShare(overview.data?.recognitionSuccessRate)}`}
              loading={overview.isLoading}
            />
            <StatTile
              label="Озвучек"
              value={formatCount(overview.data?.totalAudioPlays)}
              hint="нажатий «Прослушать»"
              loading={overview.isLoading}
            />
            <StatTile
              label="Конверсия в диалог"
              value={formatShare(engagement.data?.chatConversionRate)}
              hint={`${formatCount(engagement.data?.sessionsWithChat)} визитов из ${formatCount(engagement.data?.sessionsWithAppOpen)}`}
              loading={engagement.isLoading}
            />
            <StatTile
              label="Глубина визита"
              value={formatDecimal(engagement.data?.avgExhibitsPerSession)}
              hint="экспонатов за визит"
              loading={engagement.isLoading}
            />
          </div>

          {/* ── Вовлечённость ── */}
          {/* Визит ≠ сессия: бэкенд режет поток событий по неактивности дольше
              30 минут, поэтому вкладка, открытая утром и ожившая вечером, даёт
              два визита. Показываем оба числа — иначе расхождение со сводкой
              выглядит ошибкой отчёта. */}
          <ReportSection
            title="Длительность визита"
            description="Визит — непрерывная активность; пауза дольше 30 минут начинает новый."
            loading={engagement.isLoading}
            error={engagement.error}
            empty={(engagement.data?.totalVisits ?? 0) === 0}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <BarList
                items={(engagement.data?.buckets ?? []).map((b) => ({
                  key: b.label,
                  label: b.label,
                  count: b.count,
                }))}
              />
              <dl className="border-border flex flex-col border">
                <Row label="Визитов" value={formatCount(engagement.data?.totalVisits)} />
                <Row label="Сессий" value={formatCount(engagement.data?.totalSessions)} />
                <Row label="Средняя" value={formatDuration(engagement.data?.avgDurationSec)} />
                <Row label="Медиана" value={formatDuration(engagement.data?.medianDurationSec)} />
                <Row label="Максимум" value={formatDuration(engagement.data?.maxDurationSec)} />
                <Row
                  label="Событий за визит"
                  value={formatDecimal(engagement.data?.avgEventsPerSession, 2)}
                />
                <Row
                  label="Вопросов за визит"
                  value={formatDecimal(engagement.data?.avgQuestionsPerSession, 2)}
                />
                <Row
                  label="Дошли до вопроса"
                  value={`${formatShare(engagement.data?.questionConversionRate)} · ${formatCount(engagement.data?.sessionsWithQuestions)}`}
                />
              </dl>
            </div>
          </ReportSection>

          {/* ── Вопросы ── */}
          <ReportSection
            title="Частые вопросы к AI-гиду"
            description={
              questions.data
                ? `Всего ${formatCount(questions.data.totalQuestions)} вопросов: ${formatCount(questions.data.uniqueQuestions)} формулировок в ${formatCount(questions.data.totalClusters)} смысловых группах.`
                : undefined
            }
            loading={questions.isLoading}
            error={questions.error}
            empty={(questions.data?.frequent.length ?? 0) === 0}
          >
            <QuestionTable items={questions.data?.frequent ?? []} />
          </ReportSection>

          <ReportSection
            title="Редкие и нестандартные вопросы"
            description="Длинный хвост: о чём спрашивают единицы — обычно это то, чего не хватает в описаниях."
            loading={questions.isLoading}
            error={questions.error}
            empty={(questions.data?.rare.length ?? 0) === 0}
          >
            <QuestionTable items={questions.data?.rare ?? []} />
          </ReportSection>

          <ReportSection
            title="Вопросы без ответа"
            description={unansweredDescription(unanswered.data)}
            loading={unanswered.isLoading}
            error={unanswered.error}
            empty={(unanswered.data?.items.length ?? 0) === 0}
            emptyLabel="За период гид отвечал на все вопросы."
          >
            <UnansweredTable items={unanswered.data?.items ?? []} />
          </ReportSection>

          {/* ── Экспонаты ── */}
          <ReportSection
            title="Экспонаты"
            description={
              exhibits.data
                ? `Просмотры, вопросы к гиду и озвучки по каждой карточке. Ни разу не открывали — ${formatCount(exhibits.data.neverViewed)} из ${formatCount(exhibits.data.totalExhibits)}.`
                : "Просмотры, вопросы к гиду и озвучки по каждой карточке."
            }
            loading={exhibits.isLoading}
            error={exhibits.error}
            empty={(exhibits.data?.items.length ?? 0) === 0}
            action={
              exhibits.data && (
                <button
                  type="button"
                  onClick={() => setExhibitsOrder(exhibitsOrder === "asc" ? "views" : "asc")}
                  className="border-border hover:bg-muted border px-3 py-1.5 text-sm transition-colors"
                >
                  {exhibitsOrder === "asc" ? "Показать популярные" : "Почти не открывают"}
                </button>
              )
            }
          >
            <ExhibitsTable
              items={exhibits.data?.items ?? []}
              order={exhibitsOrder}
              onOrderChange={setExhibitsOrder}
              hasMore={(exhibits.data?.totalExhibits ?? 0) > (exhibits.data?.items.length ?? 0)}
              onShowMore={() => setExhibitsLimit((n) => n + EXHIBITS_PAGE)}
            />
          </ReportSection>

          {/* ── Маршруты ── */}
          <ReportSection
            title="Маршрут посетителя"
            description="Какие залы смотрят, в каком порядке и где заканчивают визит."
            loading={routes.isLoading}
            error={routes.error}
            empty={(routes.data?.totalSessionsWithRoute ?? 0) === 0}
          >
            {routes.data && <RoutesReport data={routes.data} />}
          </ReportSection>

          {/* ── Распознавание ── */}
          <ReportSection
            title="Распознавание по фото"
            description="Доля успеха, срабатывание фолбэка с топ-3 и уходы после неудачи."
            loading={recognition.isLoading}
            error={recognition.error}
            empty={(recognition.data?.total ?? 0) === 0}
          >
            {recognition.data && <RecognitionReport data={recognition.data} />}
          </ReportSection>
        </>
      )}
    </div>
  );
}

/**
 * Подпись к «вопросам без ответа».
 *
 * Доля важнее списка: пять строк могут быть и двумя процентами всех вопросов,
 * и половиной — без знаменателя таблица не говорит, насколько всё плохо.
 * `unclassified` называем отдельно: это диалоги до 03.08.2026, у которых
 * признака ответа нет вовсе, и в долю они не входят.
 */
function unansweredDescription(data?: AnalyticsUnanswered): string {
  const base = "Гид не смог ответить — сигнал дополнить карточку экспоната.";
  if (!data) return base;
  const classified = data.totalUnanswered + data.totalAnswered;
  const parts = [
    `без ответа ${formatShare(data.unansweredRate)} — ${formatCount(data.totalUnanswered)} из ${formatCount(classified)}`,
  ];
  if (data.unclassified > 0) {
    parts.push(`ещё ${formatCount(data.unclassified)} старых вопросов без разметки`);
  }
  return `${base} За период ${parts.join(", ")}.`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex items-center justify-between border-b px-3 py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
