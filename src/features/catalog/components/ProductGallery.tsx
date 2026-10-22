import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [failedUrls, setFailedUrls] = useState<string[]>([]);

    const selectedUrl = images[selectedIndex];
    const selectedImageFailed =
        selectedUrl !== undefined && failedUrls.includes(selectedUrl);

    function markImageFailed(url: string) {
        setFailedUrls((current) =>
            current.includes(url) ? current : [...current, url],
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {selectedUrl && !selectedImageFailed ? (
                    <img
                        src={selectedUrl}
                        alt={name}
                        onError={() => markImageFailed(selectedUrl)}
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Chưa có ảnh sản phẩm
                    </p>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex flex-wrap gap-2" aria-label="Chọn ảnh sản phẩm">
                    {images.map((url, index) => (
                        <button
                            key={`${url}-${index}`}
                            type="button"
                            aria-label={`Xem ảnh ${index + 1} của ${name}`}
                            aria-pressed={selectedIndex === index}
                            onClick={() => setSelectedIndex(index)}
                            className="h-16 w-16 overflow-hidden rounded-md border bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {failedUrls.includes(url) ? (
                                <span className="text-xs text-muted-foreground">Lỗi ảnh</span>
                            ) : (
                                <img
                                    src={url}
                                    alt=""
                                    loading="lazy"
                                    onError={() => markImageFailed(url)}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}