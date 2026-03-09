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
            <div className={`p-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-white focus-within:border-gray-900 dark:focus-within:border-white min-h-[52px] transition-all shadow-sm ${tags.length >= maxTags ? "bg-gray-50/50 dark:bg-black/20" : ""}`}>
                {tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-sm">
                        {tag.name}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeTag(index); }}
                            className="text-gray-300 hover:text-white dark:text-gray-500 dark:hover:text-gray-900 focus:outline-none rounded-full ml-1 transition-colors flex items-center justify-center w-4 h-4 hover:bg-white/20 dark:hover:bg-black/10"
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
                    className="flex-1 min-w-[120px] outline-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 text-sm py-1 px-1 disabled:cursor-not-allowed"
                />
            </div>

            <input type="hidden" name="tags" value={JSON.stringify(tags.map(t => t.name))} />

            {isOpen && (suggestions.length > 0 || isLoading || (!isLoading && inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()))) && (
                <div className="absolute z-10 w-full mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto overflow-x-hidden p-1">
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Searching...
                        </div>
                    ) : (
                        <>
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`px-4 py-2.5 mx-1 my-0.5 rounded-lg cursor-pointer text-sm transition-colors ${selectedIndex === index ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                                    onClick={() => addTag(suggestion)}
                                >
                                    {suggestion.name}
                                </div>
                            ))}
                            {inputValue.trim() && !suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                                <div
                                    className={`px-4 py-2.5 mx-1 my-0.5 rounded-lg cursor-pointer text-sm transition-colors flex items-center justify-between group ${selectedIndex === suggestions.length ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                                    onClick={() => addTag({ name: inputValue.trim().toLowerCase() })}
                                >
                                    <span>Create &quot;<span className="font-semibold">{inputValue.trim()}</span>&quot;</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 opactiy-0 group-hover:opacity-100 flex items-center">
                                        Press Enter <span className="ml-1 text-base">↵</span>
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
