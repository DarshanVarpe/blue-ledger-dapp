"use client";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const FileUpload = ({
  onChange,
  className,
  multiple = true, // ✅ Set default value to true
}: {
  onChange?: (files: File[]) => void;
  className?: string;
  multiple?: boolean; // ✅ Add the 'multiple' prop to the interface
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    // If multiple is false, replace the existing file. Otherwise, add to the list.
    const updatedFiles = multiple ? [...files, ...newFiles] : [...newFiles];
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };
  
  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple, // ✅ Use the 'multiple' prop here
    noClick: true,
    onDrop: handleFileChange,
  });

  return (
    <div className={cn("w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors", className)} {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file block cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          multiple={multiple} // ✅ Use the 'multiple' prop here
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center py-4">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Drop files here or click to upload
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-sm mt-2">
            Upload PDFs, drone imagery, etc.
          </p>
          <div className="relative w-full mt-6 max-w-xl mx-auto">
            {files.length === 0 && (
              <>
                <motion.div
                  layoutId="file-upload-icon"
                  variants={mainVariant}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn("relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-24 mt-4 w-full max-w-[8rem] mx-auto rounded-md", "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]")}
                >
                  {isDragActive ? (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neutral-600 flex flex-col items-center">
                      Drop it
                      <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    </motion.p>
                  ) : (
                    <IconUpload className="h-6 w-6 text-neutral-600 dark:text-neutral-300" />
                  )}
                </motion.div>
                <motion.div
                  variants={secondaryVariant}
                  className="absolute opacity-0 border border-dashed border-primary inset-0 z-30 bg-transparent flex items-center justify-center h-24 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                ></motion.div>
              </>
            )}
            {files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                {files.map((file, idx) => (
                  <motion.div
                    key={"file" + idx}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex items-center justify-between p-3 w-full mx-auto rounded-md shadow-sm"
                  >
                    <motion.p layout className="text-sm text-neutral-700 dark:text-neutral-300 truncate max-w-xs">{file.name}</motion.p>
                    <div className="flex items-center gap-2">
                      <motion.p layout className="rounded-lg px-2 py-1 w-fit shrink-0 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </motion.p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>
                        <IconX className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: 11 }).map((_, row) =>
        Array.from({ length: 41 }).map((_, col) => {
          const index = row * 41 + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}