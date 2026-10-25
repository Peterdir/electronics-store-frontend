import { useState } from "react";
import { Link } from "react-router";

interface DiscoveryTileProps {
  name: string;
  imageUrl: string | null;
  to: string;
  imageFit?: "cover" | "contain";
}

export function DiscoveryTile({
  name,
  imageUrl,
  to,
  imageFit = "cover",
}: DiscoveryTileProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      to={to}
      className="flex aspect-square w-28 min-w-0 flex-col overflow-hidden rounded-lg bg-transparent transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={`h-full w-full ${
              imageFit === "contain" ? "object-contain" : "object-cover"
            }`}
          />
        ) : (
          <span className="text-sm text-muted-foreground">Chưa có ảnh</span>
        )}
      </div>

      <span className="px-2 py-3 text-center text-sm font-medium">
        {name}
      </span>
    </Link>
  );
}
