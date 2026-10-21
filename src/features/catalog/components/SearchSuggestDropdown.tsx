import { formatVND } from "@/lib/format";
import type { SuggestionResponse } from "../types";

interface SearchSuggestDropdownProps {
    id: string;
    suggestions: SuggestionResponse[];
    activeIndex: number;
    onActiveIndexChange: (index: number) => void;
    onSelect: (suggestion: SuggestionResponse) => void;
}

export function SearchSuggestDropdown({
    id,
    suggestions,
    activeIndex,
    onActiveIndexChange,
    onSelect,
}: SearchSuggestDropdownProps) {
    return (
        <ul id={id} role="listbox" aria-label="Gợi ý sản phẩm">
            {suggestions.map((suggestion, index) => (
                <li
                    key={suggestion.id}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseEnter={() => onActiveIndexChange(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onSelect(suggestion)}
                    className={
                        `cursor-pointer px-3 py-2 text-sm ${
                            activeIndex === index
                                ? "bg-muted"
                                : "hover:bg-muted"
                        }`
                    }
                >
                    <span className="block font-medium">
                        {suggestion.name}
                    </span>
                    <span className="text-muted-foreground">
                        {formatVND(suggestion.basePrice)}
                    </span>
                </li>
            ))}
        </ul>
    );
}