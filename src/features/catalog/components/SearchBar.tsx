import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useId, useState, type SubmitEvent, type KeyboardEvent } from "react";
import { useProductSuggestions } from "../queries";
import { useNavigate } from "react-router";
import type { SuggestionResponse } from "../types";
import { SearchSuggestDropdown } from "./SearchSuggestDropdown";


interface SearchBarProps {
    initialValue: string;
    onSearch: (keyword: string) => void;
    className?: string;
}

export function SearchBar({ initialValue, onSearch, className }: SearchBarProps) {
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
    const activeSuggestion = suggestions[activeIndex];

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

        if (event.key === "Enter" && activeSuggestion) {
            event.preventDefault();
            selectSuggestion(activeSuggestion);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            role="search"
            aria-label="Tìm kiếm sản phẩm"
            className={className}
        >
            <div className="relative flex h-12 min-w-0 items-center rounded-xl border border-input bg-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                <Search aria-hidden="true" className="ml-4 hidden size-5 shrink-0 text-muted-foreground sm:block" />
                <input
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
                    aria-label="Từ khóa tìm kiếm sản phẩm"
                    aria-autocomplete="list"
                    aria-expanded={canSuggest}
                    aria-controls={canSuggest ? listboxId : undefined}
                    aria-activedescendant={
                        canSuggest && activeSuggestion
                            ? `${listboxId}-option-${activeIndex}`
                            : undefined
                    }
                    autoComplete="off"
                    placeholder="Bạn đang tìm sản phẩm gì?"
                    className="h-full w-full min-w-0 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
                />

                <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="mr-1 flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                    <Search aria-hidden="true" className="size-4" />
                    <span className="hidden xl:inline">Tìm kiếm</span>
                </button>

                {canSuggest && (
                    <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-[50vh] overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
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
        </form>
    )
}
