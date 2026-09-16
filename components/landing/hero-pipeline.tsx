import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { cn } from "@/lib/cn";

type PipelinePanelProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  delayClass?: string;
  showConnector?: boolean;
};

function PipelinePanel({
  title,
  children,
  className,
  delayClass,
  showConnector,
}: PipelinePanelProps) {
  return (
    <div className="relative">
      {showConnector ? (
        <span
          className="absolute -top-3 left-1/2 hidden -translate-x-1/2 text-border sm:block xl:hidden"
          aria-hidden="true"
        >
          ↓
        </span>
      ) : null}
      <div
        className={cn(
          "hero-panel rounded-lg border border-border bg-surface p-3 shadow-[var(--shadow-sm)]",
          delayClass,
          className,
        )}
      >
        <p className="mb-2 font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}

/**
 * Product-shaped hero visual: input → discovery → enrichment → CSV.
 * Static example data only — not a live scrape.
 */
export function HeroPipeline() {
  return (
    <aside
      className="relative w-full min-w-0"
      aria-label="Example BizScrape pipeline preview"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Badge variant="info">Example run</Badge>
        <StatusIndicator status="success" label="Sample output" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PipelinePanel title="Input" delayClass="hero-panel-1">
          <dl className="space-y-1.5 font-mono text-xs text-foreground">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">niche</dt>
              <dd>cafe</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">city</dt>
              <dd>Surat</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">area</dt>
              <dd>Mota Varachha</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">target</dt>
              <dd>50</dd>
            </div>
          </dl>
        </PipelinePanel>

        <PipelinePanel title="Discovery" delayClass="hero-panel-2" showConnector>
          <ul className="space-y-1.5 font-mono text-xs">
            <li className="flex justify-between gap-2">
              <span className="text-muted">found</span>
              <span>84</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted">local matches</span>
              <span className="text-success">61</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted">source</span>
              <span>gmaps</span>
            </li>
          </ul>
        </PipelinePanel>

        <PipelinePanel title="Enrichment" delayClass="hero-panel-3" showConnector>
          <ul className="space-y-1.5 font-mono text-xs">
            <li className="flex justify-between gap-2">
              <span className="text-muted">websites</span>
              <span>48</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted">emails</span>
              <span className="text-success">37</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted">phones</span>
              <span>52</span>
            </li>
          </ul>
        </PipelinePanel>

        <PipelinePanel title="CSV" delayClass="hero-panel-4" showConnector>
          <ul className="space-y-1.5 font-mono text-xs">
            <li className="flex justify-between gap-2">
              <span className="text-muted">records</span>
              <span className="text-primary">61</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-muted">deduped</span>
              <span>yes</span>
            </li>
            <li className="truncate text-muted">surat_cafe.csv</li>
          </ul>
        </PipelinePanel>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-border-subtle bg-[#080a0d]">
        <div className="border-b border-border-subtle px-3 py-1.5 font-mono text-[0.65rem] tracking-wide text-muted uppercase">
          pipeline
        </div>
        <pre className="overflow-x-auto p-3 font-mono text-[0.7rem] leading-relaxed break-anywhere text-[#c8cdd3] hero-terminal">
          <span className="terminal-prompt">$</span> bizscrape run --city surat
          --niche cafe --area &quot;mota varachha&quot; --target 50{"\n"}
          <span className="terminal-stage">DISCOVER</span>
          {"  "}84 listings · 61 local matches{"\n"}
          <span className="terminal-stage">RESOLVE</span>
          {"   "}48 websites found{"\n"}
          <span className="terminal-stage">ENRICH</span>
          {"    "}37 public emails · social links{"\n"}
          <span className="terminal-ok">EXPORT</span>
          {"    "}wrote data/surat_cafe.csv
        </pre>
      </div>
    </aside>
  );
}
