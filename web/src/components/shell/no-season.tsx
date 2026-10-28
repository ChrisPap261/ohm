import Link from "next/link";
import { EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export function NoSeasonState() {
  return (
    <EmptyState
      message="Δεν έχει οριστεί ενεργή περίοδος. Δημιούργησε ή ενεργοποίησε μία για να συνεχίσεις."
      action={
        <Link href="/seasons">
          <Button>Μετάβαση στις περιόδους</Button>
        </Link>
      }
    />
  );
}
