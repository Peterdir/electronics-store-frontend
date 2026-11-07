export interface PriceBounds {
  minPrice: number;
  maxPrice: number;
}

export interface PriceRange {
  label: string;
  minPrice?: number;
  maxPrice?: number;
}

type ParsedPriceRange =
  | { valid: true; minPrice?: number; maxPrice?: number }
  | { valid: false; error: string };

function getPriceUnit(price: number) {
  if (price >= 1_000_000_000) return { divisor: 1_000_000_000, label: "tỷ" };
  if (price >= 1_000_000) return { divisor: 1_000_000, label: "triệu" };
  if (price >= 1_000) return { divisor: 1_000, label: "nghìn" };
  return { divisor: 1, label: "đ" };
}

function formatShortPrice(price: number): string {
  const unit = getPriceUnit(price);
  const amount = (price / unit.divisor).toLocaleString("vi-VN", {
    maximumFractionDigits: 9,
  });
  return `${amount} ${unit.label}`;
}

function formatRangeLabel(minPrice: number, boundary: number): string {
  const unit = getPriceUnit(minPrice);
  const sameUnit = unit.divisor === getPriceUnit(boundary).divisor;
  const from = sameUnit
    ? (minPrice / unit.divisor).toLocaleString("vi-VN", { maximumFractionDigits: 9 })
    : formatShortPrice(minPrice);
  return `Từ ${from}–${formatShortPrice(boundary)}`;
}

export function parsePriceRange(minInput: string, maxInput: string): ParsedPriceRange {
  function parse(value: string) {
    if (value === "") return undefined;
    const price = Number(value);
    return /^\d+$/.test(value) && Number.isSafeInteger(price) ? price : null;
  }

  const minPrice = parse(minInput);
  const maxPrice = parse(maxInput);

  if (minPrice === null || maxPrice === null) {
    return { valid: false, error: "Giá phải là số nguyên không âm và không quá lớn" };
  }

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return { valid: false, error: "Giá tối thiểu không được lớn hơn giá tối đa" };
  }

  return { valid: true, minPrice, maxPrice };
}

export function buildCategoryPriceRanges(bounds: PriceBounds): PriceRange[] {
  if (bounds.minPrice >= bounds.maxPrice) return [];

  const targetStep = (bounds.maxPrice - bounds.minPrice) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const multiplier = [1, 2, 5, 10].find((value) => value * magnitude >= targetStep)!;
  const step = Math.max(1, multiplier * magnitude);
  const ranges: PriceRange[] = [];
  let minPrice: number | undefined;

  for (
    let boundary = (Math.floor(bounds.minPrice / step) + 1) * step;
    boundary <= bounds.maxPrice;
    boundary += step
  ) {
    ranges.push({
      label: minPrice === undefined
        ? `Dưới ${formatShortPrice(boundary)}`
        : formatRangeLabel(minPrice, boundary),
      minPrice,
      maxPrice: boundary - 1,
    });
    minPrice = boundary;
  }

  if (minPrice === undefined) return [];
  ranges.push({ label: `Từ ${formatShortPrice(minPrice)}`, minPrice });
  return ranges;
}
