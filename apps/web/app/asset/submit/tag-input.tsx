"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { searchTags } from "./actions";

export type Tag = { id?: string; name: string };

interface TagInputProps {
    initialTags?: Tag[];
    maxTags?: number;
}

export default function TagInput({ initialTags = [], maxTags = 10 }: TagInputProps) {
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setSelectedIndex(-1);
        if (!inputValue.trim()) {
            setSuggestions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                const results = await searchTags(inputValue);
                // Filter out already selected tags
                const filteredResults = results.filter(
                    res => !tags.some(t => t.name.toLowerCase() === res.name.toLowerCase())
                );
                setSuggestions(filteredResults);
                setIsOpen(true);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [inputValue, tags]);

    const addTag = (tag: Tag) => {
        if (tags.length >= maxTags) return;
        const normalizedName = tag.name.trim().toLowerCase();
        if (tags.some(t => t.name === normalizedName)) return;
        setTags([...tags, { ...tag, name: normalizedName }]);
        setInputValue("");
        setSuggestions([]);
        setIsOpen(false);
    };

    const removeTag = (indexToRemove: number) => {
        setTags(tags.filter((_, index) => index !== indexToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const showCreateOption = inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase());
        const totalOptions = suggestions.length + (showCreateOption ? 1 : 0);

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (isOpen && totalOptions > 0) {
                setSelectedIndex(prev => (prev < totalOptions - 1 ? prev + 1 : prev));
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (isOpen && totalOptions > 0) {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
            }
        } else if (e.key === "Enter") {
            e.preventDefault();

            if (isOpen && selectedIndex >= 0 && selectedIndex < totalOptions) {
                if (selectedIndex < suggestions.length) {
                    addTag(suggestions[selectedIndex]);
                } else {
                    addTag({ name: inputValue.trim().toLowerCase() });
                }
                return;
            }

            const trimmed = inputValue.trim().toLowerCase();
            if (!trimmed) return;

            // If we have an exact match in suggestions, use it to get the ID
            const exactMatch = suggestions.find(s => s.name.toLowerCase() === trimmed);
            if (exactMatch) {
                addTag(exactMatch);
            } else {
                addTag({ name: trimmed }); // New tag, no ID
            }
        } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            <div className={`p-2 bg-white border rounded-lg flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[48px] ${tags.length >= maxTags ? "bg-gray-50 bg-opacity-50" : ""}`}>
                {tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {tag.name}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeTag(index); }}
                            className="text-blue-600 hover:text-blue-900 focus:outline-none rounded-full ml-1"
                            aria-label={`Remove tag ${tag.name}`}
                        >
                            &times;
                        </button>
                    </span>
                ))}

                <input
                    id="tags"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={tags.length >= maxTags}
                    placeholder={tags.length === 0 ? "e.g. react, nextjs, api..." : tags.length >= maxTags ? `Maximum ${maxTags} tags reached` : "Add another tag..."}
                    className="flex-1 min-w-[120px] outline-none bg-transparent placeholder-gray-400 text-gray-900 text-sm py-1 disabled:cursor-not-allowed"
                />
            </div>

            <input type="hidden" name="tags" value={JSON.stringify(tags.map(t => t.name))} />

            {isOpen && (suggestions.length > 0 || isLoading || (!isLoading && inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()))) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                    ) : (
                        <>
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`px-4 py-2 cursor-pointer text-sm text-gray-700 ${selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-100"}`}
                                    onClick={() => addTag(suggestion)}
                                >
                                    {suggestion.name}
                                </div>
                            ))}
                            {inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                                <div
                                    className={`px-4 py-2 cursor-pointer text-sm text-gray-700 italic ${selectedIndex === suggestions.length ? "bg-gray-100" : "hover:bg-gray-100"}`}
                                    onClick={() => addTag({ name: inputValue.trim().toLowerCase() })}
                                >
                                    Create &quot;{inputValue.trim()}&quot;
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
