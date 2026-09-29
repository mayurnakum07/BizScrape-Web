export type ResultsColumnId =
  | "company"
  | "website"
  | "email"
  | "phone"
  | "area"
  | "category"
  | "rating"
  | "coverage"
  | "address";

export type ResultsDensity = "compact" | "comfortable";

export type ResultsColumnDef = {
  id: ResultsColumnId;
  label: string;
  /** Default visible in the workspace table. */
  defaultVisible: boolean;
  /** Prefer hiding on narrower desktop widths via CSS. */
  hideBelow?: "lg" | "xl";
  /** Column width hint for the table layout. */
  widthClass: string;
  align?: "left" | "right";
  sortable?: boolean;
};

export const RESULTS_COLUMNS: ResultsColumnDef[] = [
  {
    id: "company",
    label: "Company",
    defaultVisible: true,
    widthClass: "w-[14rem] min-w-[11rem]",
    sortable: true,
  },
  {
    id: "website",
    label: "Website",
    defaultVisible: true,
    widthClass: "w-[11rem] min-w-[9rem]",
  },
  {
    id: "email",
    label: "Email",
    defaultVisible: true,
    widthClass: "w-[13rem] min-w-[10rem]",
  },
  {
    id: "phone",
    label: "Phone",
    defaultVisible: true,
    widthClass: "w-[9.5rem] min-w-[8rem]",
  },
  {
    id: "area",
    label: "Area",
    defaultVisible: true,
    hideBelow: "lg",
    widthClass: "w-[8rem] min-w-[6.5rem]",
  },
  {
    id: "category",
    label: "Category",
    defaultVisible: true,
    hideBelow: "xl",
    widthClass: "w-[8rem] min-w-[6.5rem]",
  },
  {
    id: "rating",
    label: "Rating",
    defaultVisible: true,
    widthClass: "w-[6.5rem] min-w-[5.5rem]",
    align: "right",
    sortable: true,
  },
  {
    id: "coverage",
    label: "Coverage",
    defaultVisible: true,
    widthClass: "w-[5.5rem] min-w-[4.5rem]",
  },
  {
    id: "address",
    label: "Address",
    defaultVisible: false,
    widthClass: "w-[14rem] min-w-[12rem]",
  },
];

export const DEFAULT_VISIBLE_COLUMNS: ResultsColumnId[] = RESULTS_COLUMNS.filter(
  (column) => column.defaultVisible,
).map((column) => column.id);

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type ResultsPageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: ResultsPageSize = 25;
export const DEFAULT_DENSITY: ResultsDensity = "compact";

export function toggleColumnVisibility(
  visible: ResultsColumnId[],
  id: ResultsColumnId,
): ResultsColumnId[] {
  if (id === "company") {
    return visible.includes("company") ? visible : ["company", ...visible];
  }
  if (visible.includes(id)) {
    const next = visible.filter((column) => column !== id);
    return next.includes("company") ? next : ["company", ...next];
  }
  return [...visible, id];
}
