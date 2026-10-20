import { Button } from "@/components/ui/button";
import { useEffect, useState, type SubmitEvent } from "react";


interface SearchBarProps {
    initialValue: string;
    onSearch: (keyword: string) => void;
}

export function SearchBar({ initialValue, onSearch }: SearchBarProps) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        onSearch(value.trim());
    }

    return (
        <form onSubmit={handleSubmit} role="search" className="flex gap-2">
            <label htmlFor="product-search" className="sr-only">
                Tìm kiểm sản phẩm
            </label>

            <input
                id="product-search"
                type="search"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Tìm sản phẩm..."
                className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
            />
            
            <Button type="submit">
                Tìm kiếm
            </Button>
        </form>
    )
}