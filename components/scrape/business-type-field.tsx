import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type BusinessTypeFieldProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export function BusinessTypeField({
  value,
  error,
  onChange,
}: BusinessTypeFieldProps) {
  return (
    <Field
      id="business-type"
      label="Business type"
      hint="What kind of businesses are you looking for?"
      error={error}
    >
      <Input
        name="businessType"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cafe, gym, jewellery store…"
        autoComplete="off"
        required
      />
    </Field>
  );
}
