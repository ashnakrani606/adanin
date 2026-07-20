"use client";

import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { urlForImage } from "@/lib/sanity";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-3 font-display text-xl font-semibold text-ink sm:text-2xl">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="mb-5 text-[15px] leading-relaxed text-dark-grayish-blue sm:text-base">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-accent-blue pl-5 font-serif text-lg italic text-ink">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-5 list-disc space-y-2 pl-5 text-[15px] text-dark-grayish-blue sm:text-base">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-5 list-decimal space-y-2 pl-5 text-[15px] text-dark-grayish-blue sm:text-base">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = value?.href || "#";
      const blank = value?.blank !== false;
      return (
        <a
          href={href}
          className="text-accent-blue underline underline-offset-4 hover:text-accent-teal"
          {...(blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
    code: ({ children }) => (
      <code className="rounded bg-mist px-1.5 py-0.5 text-sm text-ink">{children}</code>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const src = urlForImage(value).width(1200).url();
      return (
        <figure className="my-8">
          <div className="relative aspect-[16/9] overflow-hidden bg-mist">
            <Image
              src={src}
              alt={value.alt || ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {value.alt && (
            <figcaption className="mt-2 text-center text-sm text-dark-grayish-blue">
              {value.alt}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

type BlogPortableTextProps = {
  value: PortableTextBlock[];
};

export function BlogPortableText({ value }: BlogPortableTextProps) {
  if (!value?.length) return null;
  return <PortableText value={value} components={components} />;
}
