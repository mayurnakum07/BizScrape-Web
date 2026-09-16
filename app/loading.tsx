import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <Container className="flex items-center py-24">
      <Spinner label="Loading" />
    </Container>
  );
}
