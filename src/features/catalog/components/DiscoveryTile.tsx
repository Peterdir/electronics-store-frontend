import { useState } from "react";
import { Link } from "react-router";

interface DiscoveryTileProps {
  name: string;
  imageUrl: string | null;
  to: string;
  imageFit?: "cover" | "contain";
  imageClassName?: string;
}

export function DiscoveryTile({
  name,
  imageUrl,
  to,
  imageFit = "cover",
  imageClassName = "",
}: DiscoveryTileProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      to={to}
      className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-background/50 p-3 transition-colors duration-150 hover:border-primary/50 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={`h-full w-full ${
              imageFit === "contain" ? "object-contain" : "object-cover"
            } ${imageClassName}`}
          />
        ) : (
          <span className="px-2 text-center text-sm text-muted-foreground">Chưa có ảnh</span>
        )}
      </div>

      <span className="line-clamp-2 min-h-10 wrap-anywhere text-center text-sm font-medium leading-5">
        {name}
      </span>
    </Link>
  );
}
