"use client";

import { motion } from "framer-motion";
import {
  EXAMPLE_CSV_COLUMNS,
  EXAMPLE_CSV_ROWS,
} from "@/components/landing/example-data";
import { Container } from "@/components/ui/container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DataPreview() {
  return (
    <section
      id="data"
      className="scroll-mt-20 border-b border-border bg-background"
      aria-labelledby="data-heading"
    >
      <Container size="wide" className="py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12"
        >
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider">
            Dataset
          </Badge>
          <h2 id="data-heading" className="text-3xl font-bold tracking-tight mt-4 text-foreground">
            Structured CSV output
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            BizScrape turns listing noise into a normalized table - names,
            websites, phones, emails from public sites, socials, ratings, and
            map links.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="mb-3 text-xs text-muted-foreground md:hidden flex items-center gap-2">
            <span className="block w-2 h-2 rounded-full bg-primary animate-pulse" />
            Swipe horizontally to explore all columns.
          </p>
          <Card className="relative border border-primary/30 bg-black/90 overflow-hidden shadow-[0_0_50px_rgba(200,240,74,0.05)] rounded-xl group">
            {/* Animated scanline */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(200,240,74,0.05)_50%,transparent_100%)] h-full w-full bg-[length:100%_4px] bg-repeat-y animate-[motion-live-dot_2s_linear_infinite]" />
            
            <div className="relative z-10 border-b border-primary/20 bg-[#0B0D0C]/80 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
              <div className="flex gap-2 items-center">
                <div className="size-2.5 rounded-full bg-error" />
                <div className="size-2.5 rounded-full bg-warning" />
                <div className="size-2.5 rounded-full bg-primary animate-pulse" />
                <span className="ml-2 font-mono text-xs text-primary/70">EXPORT_VIEW_CSV</span>
              </div>
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">bizscrape_engine_v0.1.0</div>
            </div>

            <CardContent className="p-0 overflow-x-auto relative z-10 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/50">
              <Table className="w-full">
                <TableHeader className="bg-[#111513]/90 backdrop-blur-md sticky top-0 border-b border-primary/30">
                  <TableRow className="border-none hover:bg-transparent">
                    {EXAMPLE_CSV_COLUMNS.map((column) => (
                      <TableHead key={column} className="font-mono text-[10px] uppercase tracking-widest text-primary/60 whitespace-nowrap px-4 py-3 border-r border-primary/10 last:border-r-0">
                        {column.replace(/_/g, " ")}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EXAMPLE_CSV_ROWS.map((row, i) => (
                    <TableRow 
                      key={row.company_name} 
                      className="border-b border-primary/10 hover:bg-primary/[0.03] transition-all duration-300 group/row"
                    >
                      {EXAMPLE_CSV_COLUMNS.map((column) => {
                        const isMono = column === "website" || column === "email_primary" || column === "phone_primary" || column === "maps_url" || column === "linkedin" || column === "facebook" || column === "instagram";
                        const isTruncated = column === "website" || column === "address" || column === "maps_url" || column === "linkedin" || column === "facebook" || column === "instagram";
                        
                        return (
                          <TableCell
                            key={column}
                            className={`whitespace-nowrap px-4 py-3 border-r border-primary/5 last:border-r-0 group-hover/row:border-primary/20 transition-colors
                              ${isMono ? 'font-mono text-xs text-muted' : 'text-sm text-foreground/90 font-medium'} 
                              ${isTruncated ? 'max-w-[200px] truncate' : ''}
                              ${column === 'company_name' ? 'text-primary drop-shadow-[0_0_8px_rgba(200,240,74,0.3)]' : ''}`}
                            title={String(row[column as keyof typeof row])}
                          >
                            {row[column as keyof typeof row] ? (
                              <span className={column === 'company_name' ? 'relative' : ''}>
                                {column === 'company_name' && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-3 bg-primary opacity-0 group-hover/row:opacity-100 transition-opacity" />}
                                {row[column as keyof typeof row]}
                              </span>
                            ) : (
                              <span className="text-primary/20">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="mt-4 font-mono text-xs text-muted-foreground/60 text-right">
            Sample rows for illustration only. Domains and contacts are
            fictional.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
