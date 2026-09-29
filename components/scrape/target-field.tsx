import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TARGET_MAX, TARGET_MIN } from "@/lib/scrape/constants";

type TargetFieldProps = {
  value: number;
  error?: string;
  onChange: (value: number) => void;
};

export function TargetField({ value, error, onChange }: TargetFieldProps) {
  return (
    <Field
      id="target"
      label="Target count"
      hint={`${TARGET_MIN}–${TARGET_MAX} businesses to collect.`}
      error={error}
    >
      <Input
        name="target"
        type="number"
        inputMode="numeric"
        min={TARGET_MIN}
        max={TARGET_MAX}
        step={1}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          onChange(Number.isNaN(next) ? Number.NaN : next);
        }}
        required
      />
    </Field>
  );
}
