import type { Metadata } from "next";

import {
  DialogDemo,
  DrawerDemo,
} from "@/components/design-system/dialog-demo";
import { IconAlert, IconCheck, IconInfo } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBlock, LoadingState } from "@/components/ui/feedback-states";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal } from "@/components/ui/terminal";
import { Textarea } from "@/components/ui/textarea";
import { ToastDemoList } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { colors } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Design system",
  description: "Internal BizScrape visual and component reference.",
  robots: {
    index: false,
    follow: false,
  },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-section-heading border-b border-border-subtle pb-3">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Swatch({
  name,
  variable,
  className,
  hex,
}: {
  name: string;
  variable: string;
  className: string;
  hex?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`size-10 shrink-0 rounded-md border border-border ${className}`}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="font-mono text-xs text-muted">{variable}</p>
        {hex ? <p className="font-mono text-xs text-muted">{hex}</p> : null}
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <Container size="wide" className="py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="font-mono text-sm tracking-wide text-primary uppercase">
          Internal
        </p>
        <h1 className="text-page-heading mt-2">Design system</h1>
        <p className="mt-3 text-small">
          Visual foundation for BizScrape Web. Green-black canvas (#0B0D0C), electric
          lime signal, sharp geometry. No gradients, glass, or glow. Not a
          public marketing page.
        </p>
      </header>

      <nav
        aria-label="Design system sections"
        className="mt-8 flex flex-wrap gap-2"
      >
        {[
          ["colors", "Colors"],
          ["typography", "Typography"],
          ["tokens", "Tokens"],
          ["buttons", "Buttons"],
          ["forms", "Forms"],
          ["feedback", "Feedback"],
          ["overlays", "Overlays"],
          ["data", "Data"],
          ["terminal", "Terminal"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={`#${href}`}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-ui hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-14 flex flex-col gap-16">
        <Section id="colors" title="Colors">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Swatch
              name="Canvas"
              variable="--background"
              className="bg-background"
              hex={colors.canvas}
            />
            <Swatch
              name="Surface"
              variable="--surface"
              className="bg-surface"
              hex={colors.surface}
            />
            <Swatch
              name="Elevated"
              variable="--elevated"
              className="bg-elevated"
              hex={colors.elevated}
            />
            <Swatch
              name="Border"
              variable="--border"
              className="bg-border"
              hex={colors.border}
            />
            <Swatch
              name="Foreground"
              variable="--foreground"
              className="bg-foreground"
              hex={colors.foreground}
            />
            <Swatch
              name="Muted"
              variable="--muted"
              className="bg-muted"
              hex={colors.muted}
            />
            <Swatch
              name="Signal"
              variable="--primary"
              className="bg-primary"
              hex={colors.signal}
            />
            <Swatch
              name="Success"
              variable="--success"
              className="bg-success"
              hex={colors.success}
            />
            <Swatch
              name="Warning"
              variable="--warning"
              className="bg-warning"
              hex={colors.warning}
            />
            <Swatch
              name="Error"
              variable="--error"
              className="bg-error"
              hex={colors.error}
            />
          </div>
        </Section>

        <Section id="typography" title="Typography">
          <div className="flex flex-col gap-5">
            <p className="text-display">Display heading</p>
            <p className="text-page-heading">Page heading</p>
            <p className="text-section-heading">Section heading</p>
            <p className="text-body">
              Body text for interface copy. IBM Plex Sans for UI; IBM Plex Mono
              for metrics, logs, IDs, and scraped data.
            </p>
            <p className="text-small">Small text for hints and secondary detail.</p>
            <p className="text-label">Field label</p>
            <p className="text-metric text-primary">42 enriched · 3 failed</p>
            <p className="text-code text-muted">
              $ bizscrape run --city surat --niche cafe
            </p>
          </div>
        </Section>

        <Section id="tokens" title="Spacing, radius, elevation">
          <ul className="space-y-2 text-small">
            <li>
              Spacing scale:{" "}
              <code className="text-code text-foreground">--space-1</code> …
              <code className="text-code text-foreground">--space-24</code>
            </li>
            <li>
              Radii stay minimal: sm 2px · md 4px · lg 6px · xl 8px
            </li>
            <li>
              Shadows are flat elevation only (
              <code className="text-code text-foreground">--shadow-sm</code> /{" "}
              <code className="text-code text-foreground">--shadow-md</code>)
            </li>
            <li>
              Z-index layers: sticky · dropdown · overlay · modal · toast ·
              tooltip
            </li>
            <li>
              Focus:{" "}
              <code className="text-code text-foreground">
                --focus-ring-width / offset / color
              </code>
            </li>
          </ul>
        </Section>

        <Section id="buttons" title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Confirm">
              <IconCheck size={16} />
            </IconButton>
            <Tooltip content="Copy job ID">
              <IconButton label="Copy" size="sm" variant="outline">
                <IconInfo size={14} />
              </IconButton>
            </Tooltip>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Dropdown
              label="Actions"
              align="start"
              items={[
                { id: "export", label: "Export CSV" },
                { id: "retry", label: "Retry failed" },
                { id: "cancel", label: "Cancel job", destructive: true },
              ]}
            />
          </div>
        </Section>

        <Section id="forms" title="Forms">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Field conventions</CardTitle>
              <CardDescription>
                Label above control. Optional marker when needed. Hint below.
                Error replaces hint and sets invalid styles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="field-group">
                <Field
                  id="demo-niche"
                  label="Business type"
                  hint="e.g. cafe, dentist, IT services"
                >
                  <Input placeholder="cafe" />
                </Field>
                <Field id="demo-city" label="City">
                  <Input defaultValue="Surat" />
                </Field>
                <Field id="demo-area" label="Area / locality" optional>
                  <Input placeholder="Adajan" />
                </Field>
                <Field
                  id="demo-target"
                  label="Target count"
                  error="Enter a number between 1 and 500."
                >
                  <Input type="number" defaultValue={0} />
                </Field>
                <Field id="demo-source" label="Source">
                  <Select defaultValue="gmaps">
                    <option value="gmaps">Google Maps</option>
                  </Select>
                </Field>
                <Field id="demo-notes" label="Notes" optional>
                  <Textarea placeholder="Optional operator notes" />
                </Field>
                <Checkbox
                  id="demo-headless"
                  name="headless"
                  label="Headless browser"
                  description="Run without a visible browser window."
                  defaultChecked
                />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section id="feedback" title="Feedback & status">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <StatusIndicator status="idle" />
            <StatusIndicator status="running" />
            <StatusIndicator status="success" />
            <StatusIndicator status="warning" />
            <StatusIndicator status="error" />
          </div>

          <div className="mt-6 grid max-w-xl gap-4">
            <Progress value={42} label="Enrichment" showValue />
            <Spinner label="Working" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10" rounded="md" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Tabs defaultValue="empty">
              <TabsList>
                <TabsTrigger value="empty">Empty</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
                <TabsTrigger value="error">Error</TabsTrigger>
              </TabsList>
              <TabsContent value="empty">
                <EmptyState
                  icon={<IconInfo size={20} />}
                  title="No results yet"
                  description="Run a scrape to populate business rows. CSV export appears when the job completes."
                  action={<Button size="sm">Start a scrape</Button>}
                />
              </TabsContent>
              <TabsContent value="loading">
                <LoadingState
                  title="Loading results"
                  description="Fetching the latest enriched rows."
                />
              </TabsContent>
              <TabsContent value="error">
                <ErrorBlock
                  title="Could not load results"
                  description="The job snapshot is unavailable. Retry or return to history."
                  action={<Button size="sm">Retry</Button>}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-6">
            <ToastDemoList
              items={[
                {
                  title: "Export ready",
                  description: "surat_cafe.csv downloaded.",
                  tone: "success",
                },
                {
                  title: "Rate limited",
                  description: "Wait a moment before starting another job.",
                  tone: "warning",
                },
                {
                  title: "Job failed",
                  description: "Enrichment stopped after repeated errors.",
                  tone: "error",
                },
              ]}
            />
          </div>

          <Divider className="my-8" label="Dividers" />
          <p className="text-small inline-flex items-center gap-2">
            <IconAlert size={16} className="text-warning" />
            Prefer status color + copy over decorative alerts.
          </p>
        </Section>

        <Section id="overlays" title="Dialogs & drawers">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dialog</CardTitle>
                <CardDescription>Accessible modal foundation.</CardDescription>
              </CardHeader>
              <CardContent>
                <DialogDemo />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Drawer</CardTitle>
                <CardDescription>Side panel overlay.</CardDescription>
              </CardHeader>
              <CardContent>
                <DrawerDemo />
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section id="data" title="Data table">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Business</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Website</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Adajan Dental Care</TableCell>
                <TableCell mono>+91 98765 43210</TableCell>
                <TableCell mono truncate>
                  hello@example.com
                </TableCell>
                <TableCell mono truncate>
                  https://example.com/very/long/path
                </TableCell>
                <TableCell>
                  <Badge variant="success">enriched</Badge>
                </TableCell>
              </TableRow>
              <TableRow selected>
                <TableCell>Surat Cafe Co.</TableCell>
                <TableCell mono>+91 91234 56789</TableCell>
                <TableCell mono truncate>
                  —
                </TableCell>
                <TableCell mono truncate>
                  https://suratcafe.example
                </TableCell>
                <TableCell>
                  <Badge variant="warning">pending</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-3 text-small">
            Horizontal overflow on narrow viewports. Long URLs and emails use
            mono + truncate. Selected rows use a muted signal wash.
          </p>
        </Section>

        <Section id="terminal" title="Terminal">
          <Terminal title="bizscrape">
            <span className="terminal-prompt">$</span> bizscrape run --city surat
            --niche cafe{"\n"}
            <span className="terminal-stage">DISCOVER</span>
            {"  "}scanning Google Maps…{"\n"}
            <span className="terminal-stage">WEBSITE LOOKUP</span>
            {"  "}resolving missing sites…{"\n"}
            <span className="terminal-stage">ENRICH</span>
            {"  "}extracting public contact details…{"\n"}
            <span className="terminal-ok">EXPORT</span>
            {"  "}wrote data/surat_cafe.csv
          </Terminal>
        </Section>

        <Section id="responsive" title="Responsive notes">
          <ul className="list-disc space-y-2 pl-5 text-small">
            <li>
              Containers use{" "}
              <code className="text-code text-foreground">narrow</code> /{" "}
              <code className="text-code text-foreground">default</code> /{" "}
              <code className="text-code text-foreground">wide</code> max-widths
              with fluid horizontal padding.
            </li>
            <li>Controls stay at least 2.5rem tall for touch targets.</li>
            <li>Tables and terminals scroll horizontally instead of crushing.</li>
            <li>Cards and form groups stack naturally in a single column on mobile.</li>
          </ul>
        </Section>
      </div>
    </Container>
  );
}
