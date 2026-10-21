import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useId, useState, type SubmitEvent, type KeyboardEvent } from "react";
import { useProductSuggestions } from "../queries";
import { useNavigate } from "react-router";
import type { SuggestionResponse } from "../types";
import { SearchSuggestDropdown } from "./SearchSuggestDropdown";


interface SearchBarProps {
    initialValue: string;
    onSearch: (keyword: string) => void;
}

export function SearchBar({ initialValue, onSearch }: SearchBarProps) {
    const navigate = useNavigate();
    const listboxId = useId();

    const [value, setValue] = useState(initialValue);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const keyword = value.trim();
    const debouncedKeyword = useDebounce(keyword, 300);

    const canSuggest = isOpen && keyword.length > 0;
    const isDebouncing = keyword !== debouncedKeyword;

    const queryKeyword =
        canSuggest && !isDebouncing ? debouncedKeyword : "";

    const suggestionsQuery = useProductSuggestions(
        queryKeyword,
        queryKeyword.length > 0,
    );

    const suggestions = queryKeyword
        ? suggestionsQuery.data ?? []
        : [];

    function closeSuggestions() {
        setIsOpen(false);
        setActiveIndex(-1);
    }

    function selectSuggestion(suggestion: SuggestionResponse) {
        closeSuggestions();
        navigate(`/products/${suggestion.id}`);
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        closeSuggestions();
        onSearch(value.trim());
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.nativeEvent.isComposing) return;

        if (event.key === "Escape" && canSuggest) {
            event.preventDefault();
            closeSuggestions();
            return;
        }

        if (!canSuggest || suggestions.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) =>
                index >= suggestions.length - 1 ? 0 : index + 1,
            );
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) =>
                index <= 0 ? suggestions.length - 1 : index - 1,
            );
        }

        if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
        }
    }

    return (
        <form onSubmit={handleSubmit} role="search" className="flex gap-2">
            <label htmlFor="product-search" className="sr-only">
                Tìm kiếm sản phẩm
            </label>

            <div className="relative min-w-0 flex-1">
                <input
                    id="product-search"
                    type="search"
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setIsOpen(true);
                        setActiveIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={closeSuggestions}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={canSuggest}
                    aria-controls={canSuggest ? listboxId : undefined}
                    aria-activedescendant={
                        canSuggest && suggestions[activeIndex]
                            ? `${listboxId}-option-${activeIndex}`
                            : undefined
                    }
                    autoComplete="off"
                    placeholder="Tìm sản phẩm..."
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />

                {canSuggest && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-background shadow-md">
                        {(isDebouncing ||
                            suggestionsQuery.isFetching) && (
                            <p role="status" className="px-3 py-2 text-sm">
                                Đang tìm gợi ý…
                            </p>
                        )}

                        {queryKeyword && suggestionsQuery.isError && (
                            <p role="status" className="px-3 py-2 text-sm">
                                Không tải được gợi ý.
                            </p>
                        )}

                        {queryKeyword &&
                            suggestionsQuery.isSuccess &&
                            suggestions.length === 0 && (
                                <p role="status" className="px-3 py-2 text-sm">
                                    Không có gợi ý phù hợp.
                                </p>
                            )}

                        <SearchSuggestDropdown
                            id={listboxId}
                            suggestions={suggestions}
                            activeIndex={activeIndex}
                            onActiveIndexChange={setActiveIndex}
                            onSelect={selectSuggestion}
                        />
                    </div>
                )}
            </div>
            
            <Button type="submit">
                Tìm kiếm
            </Button>
        </form>
    )
}
