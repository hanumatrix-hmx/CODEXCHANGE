"use strict";
"use client";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
// import Image, { ImageProps } from "next/image";
import { ImageProps } from "next/image";

export function ZoomImage({ src, alt, className, ...props }: ImageProps) {
    return (
        <Zoom>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src as string}
                alt={alt}
                className={className}
                {...props}
            />
        </Zoom>
    );
}
