"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { Download, X } from "lucide-react";
import { createPortal } from "react-dom";

interface ImageWithPreviewProps extends Omit<ImageProps, "onClick"> {
  previewUrl?: string;
}

export function ImageWithPreview({ previewUrl, ...props }: ImageWithPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const urlToDownload = previewUrl || (props.src as string);
      const response = await fetch(urlToDownload);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = blob.type.split("/")[1] || "jpg";
      link.download = `${props.alt || "image"}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const imageSrc = props.src as string;
  const isPlaceholder = !imageSrc || imageSrc.includes('null') || imageSrc.includes('example/image/upload');

  if (isPlaceholder) {
    return <Image {...props} />;
  }

  return (
    <>
      <div 
        className="cursor-pointer relative w-full h-full group" 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <Image {...props} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-inherit flex items-center justify-center opacity-0 group-hover:opacity-100">
          {/* Subtle hover effect to indicate clickability */}
        </div>
      </div>

      {isMounted && isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors z-10"
          >
            <X size={32} />
          </button>
          
          <div 
            className="relative w-full max-w-5xl flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[75vh]">
              <Image
                src={previewUrl || props.src}
                alt={props.alt || "Preview"}
                fill
                className="object-contain drop-shadow-2xl"
                sizes="100vw"
                priority
              />
            </div>
            <button
              onClick={handleDownload}
              className="mt-8 flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-xl"
            >
              <Download size={20} />
              Download Original Image
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
