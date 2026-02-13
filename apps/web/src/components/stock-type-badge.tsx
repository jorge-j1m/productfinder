import { Badge } from "#/components/ui/badge";
import { Weight, Package } from "lucide-react";

export function StockTypeBadge({
  stockType,
}: {
  stockType: "WEIGHT" | "UNITS";
}) {
  return (
    <Badge variant="secondary">
      {stockType === "WEIGHT" ? (
        <Weight className="size-3" />
      ) : (
        <Package className="size-3" />
      )}
      {stockType === "WEIGHT" ? "By Weight" : "Units"}
    </Badge>
  );
}
