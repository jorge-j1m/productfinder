import { cn } from "#/lib/utils";
import { formatPrice } from "#/lib/format";

interface PriceDisplayProps {
  /** Price in cents */
  effectivePrice: number;
  /** Original price in cents (shown struck-through when on sale) */
  regularPrice?: number;
  isOnSale?: boolean;
  stockType?: "WEIGHT" | "UNITS";
  className?: string;
}

export function PriceDisplay({
  effectivePrice,
  regularPrice,
  isOnSale,
  stockType,
  className,
}: PriceDisplayProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-xl font-bold tabular-nums">
        {formatPrice(effectivePrice, stockType)}
      </span>
      {isOnSale && regularPrice && regularPrice !== effectivePrice && (
        <span className="text-muted-foreground text-sm line-through">
          {formatPrice(regularPrice, stockType)}
        </span>
      )}
    </div>
  );
}
