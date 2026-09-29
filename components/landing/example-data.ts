/**
 * Static example rows for the landing CSV preview.
 * Not scraped at render time - labeled as sample data in the UI.
 */

export type ExampleBusinessRow = {
  company_name: string;
  website: string;
  email_primary: string;
  phone_primary: string;
  address: string;
  area: string;
  category: string;
  rating: string;
  review_count: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  maps_url: string;
};

export const EXAMPLE_CSV_ROWS: ExampleBusinessRow[] = [
  {
    company_name: "Bean & Byte Cafe",
    website: "https://beanbyte.example",
    email_primary: "hello@beanbyte.example",
    phone_primary: "+1 98765 43001",
    address: "12 Ring Road, Manhattan",
    area: "Manhattan",
    category: "Cafe",
    rating: "4.4",
    review_count: "128",
    linkedin: "-",
    facebook: "facebook.com/beanbyte.example",
    instagram: "instagram.com/beanbyte.example",
    maps_url: "https://maps.google.com/?cid=example1",
  },
  {
    company_name: "New York Roast House",
    website: "https://nycroast.example",
    email_primary: "contact@nycroast.example",
    phone_primary: "+1 98765 43022",
    address: "Near Lajamni Chowk",
    area: "Manhattan",
    category: "Cafe",
    rating: "4.2",
    review_count: "86",
    linkedin: "-",
    facebook: "-",
    instagram: "instagram.com/nycroast.example",
    maps_url: "https://maps.google.com/?cid=example2",
  },
  {
    company_name: "Varachha Brew Lab",
    website: "https://varachhabrew.example",
    email_primary: "-",
    phone_primary: "+1 91234 55010",
    address: "Shop 4, Paradise Complex",
    area: "Manhattan",
    category: "Cafe",
    rating: "4.6",
    review_count: "210",
    linkedin: "linkedin.com/company/varachhabrew",
    facebook: "-",
    instagram: "instagram.com/varachhabrew.example",
    maps_url: "https://maps.google.com/?cid=example3",
  },
];

export const EXAMPLE_CSV_COLUMNS: Array<keyof ExampleBusinessRow> = [
  "company_name",
  "website",
  "email_primary",
  "phone_primary",
  "address",
  "area",
  "category",
  "rating",
  "review_count",
  "linkedin",
  "facebook",
  "instagram",
  "maps_url",
];
