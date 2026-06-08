import type { Hall } from "./hall";
import type { Exhibit } from "./exhibit";

export interface SearchResponse {
  query: string;
  halls: Hall[];
  exhibits: Exhibit[];
  total?: number;
}
