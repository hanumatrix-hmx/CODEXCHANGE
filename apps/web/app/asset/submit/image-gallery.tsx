"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

export type GridImage = {
    id: string;
    type: "existing" | "new";
    url: string;
    file?: File;
};

interface SortableImageItemProps {
    image: GridImage;
    isCover: boolean;
    onRemove: (id: string) => void;
}

function SortableImageItem({ image, isCover, onRemove }: SortableImageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative group cursor-grab touch-none rounded-lg border overflow-hidden h-32 w-48 bg-gray-50 flex-shrink-0 flex items-center justify-center ${isCover ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
        >
            <Image src={image.url} alt="Gallery item" width={192} height={128} unoptimized className="h-full w-full object-cover pointer-events-none" />

            {isCover && (
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg pointer-events-none z-10">
                    Cover
                </div>
            )}

            <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(image.id); }}
                className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-white text-red-600 font-bold rounded-full border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-20 m-4 cursor-pointer"
                title="Remove image"
            >
                ✕
            </button>
        </div>
    );
}

interface ImageGalleryProps {
    initialImages?: GridImage[];
    maxFileSizeMB?: number;
    onErrorStateChange?: (hasError: boolean) => void;
    onImagesChange?: (isChanged: boolean) => void;
}

export default function ImageGallery({
    initialImages = [],
    maxFileSizeMB = 4,
    onErrorStateChange,
    onImagesChange
}: ImageGalleryProps) {
    const [images, setImages] = useState<GridImage[]>(initialImages);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync files to hidden input via DataTransfer
    useEffect(() => {
        if (fileInputRef.current) {
            // DataTransfer is supported in modern browsers
            const dt = new DataTransfer();
            images.forEach(img => {
                if (img.type === 'new' && img.file) {
                    dt.items.add(img.file);
                }
            });
            fileInputRef.current.files = dt.files;
        }
    }, [images]);

    const hasError = images.length < 3 || images.length > 10;

    useEffect(() => {
        if (onErrorStateChange) {
            onErrorStateChange(hasError);
        }
    }, [hasError, onErrorStateChange]);

    useEffect(() => {
        if (onImagesChange) {
            // Check if lengths are different
            if (images.length !== initialImages.length) {
                onImagesChange(true);
                return;
            }

            // Or if order/content is different
            let isChanged = false;
            for (let i = 0; i < images.length; i++) {
                if (images[i].id !== initialImages[i].id) {
                    isChanged = true;
                    break;
                }
            }
            onImagesChange(isChanged);
        }
    }, [images, initialImages, onImagesChange]);

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMsg(null);
        if (!e.target.files?.length) return;

        const files = Array.from(e.target.files);
        const oversized = files.filter(f => f.size > maxFileSizeMB * 1024 * 1024);

        if (oversized.length > 0) {
            setErrorMsg(`${oversized.length} file(s) exceed the ${maxFileSizeMB} MB limit.`);
        }

        let validFiles = files.filter(f => f.size <= maxFileSizeMB * 1024 * 1024);

        if (images.length + validFiles.length > 10) {
            const allowedCount = Math.max(0, 10 - images.length);
            validFiles = validFiles.slice(0, allowedCount);
            setErrorMsg(`Maximum 10 images allowed. Only the first ${allowedCount} valid files were added.`);
        }

        const newImages: GridImage[] = validFiles.map((file, idx) => ({
            id: `new-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            type: "new",
            url: URL.createObjectURL(file),
            file
        }));

        setImages(prev => [...prev, ...newImages]);

        // Reset the visible file input
        e.target.value = '';
    };

    const handleRemove = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setImages((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Prepare sort order data for action
    const newImagesOnly = images.filter(img => img.type === 'new');
    const imageOrder = images.map(img => {
        if (img.type === 'existing') {
            return { type: 'existing', url: img.url };
        } else {
            return { type: 'new', fileIndex: newImagesOnly.indexOf(img) };
        }
    });

    return (
        <div className="space-y-4">
            <input type="hidden" name="imageOrder" value={JSON.stringify(imageOrder)} />
            <input type="file" name="newImages" multiple hidden ref={fileInputRef} />

            <div className="flex items-center gap-4 mb-2">
                <label className={`whitespace-nowrap cursor-pointer inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${images.length >= 10 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                    Add Images
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFiles}
                        disabled={images.length >= 10}
                        className="hidden"
                    />
                </label>
                <p className="text-sm text-gray-500">
                    Drag and drop to reorder. The first image will be used as the cover. Minimum 3, maximum 10 images required.
                </p>
            </div>

            {errorMsg && (
                <div className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    <p className="text-sm text-red-600">⚠️ {errorMsg}</p>
                    <button type="button" onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
                </div>
            )}

            {images.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={images.map(i => i.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="flex flex-wrap gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-white min-h-[160px]">
                            {images.map((img, index) => (
                                <SortableImageItem
                                    key={img.id}
                                    image={img}
                                    isCover={index === 0}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 min-h-[160px]">
                    <p className="text-gray-500 text-sm">No images added yet.</p>
                </div>
            )}

            {images.length > 0 && images.length < 3 && (
                <p className="text-sm text-amber-600 font-medium">
                    ⚠️ Please add at least {3 - images.length} more image(s). (1 Cover + 2 Gallery minimum)
                </p>
            )}
            {images.length >= 3 && (
                <p className="text-sm text-green-600 font-medium">
                    ✓ {images.length} images set. The first is pinned as Cover.
                </p>
            )}
        </div>
    );
}
