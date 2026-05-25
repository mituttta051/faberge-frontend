import type { Hall } from "./hall";
import type { Exhibit } from "./exhibit";

/** Один результат поиска — это либо зал, либо экспонат. */
export type SearchResult = { kind: "hall"; hall: Hall } | { kind: "exhibit"; exhibit: Exhibit };

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}
