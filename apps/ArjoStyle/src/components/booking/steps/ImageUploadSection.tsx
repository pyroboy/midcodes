import React from "react";

interface ImageUploadSectionProps {
  images: File[];
  setImages: (files: File[]) => void;
  uploadError: string | null;
  setUploadError: (err: string | null) => void;
  isDraggingOver: boolean;
  setIsDraggingOver: (drag: boolean) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  maxImages: number;
  allowedImageTypes: string[];
  maxFileSizeMb: number;
  onShowGuide: () => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  isDraggingOver,
  handleFileChange,
  removeImage,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  maxImages,
  allowedImageTypes,
  maxFileSizeMb,
  onShowGuide,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-foreground dark:text-foreground flex items-center gap-2">
          Reference Images
          <span className="text-xs text-muted-foreground font-normal bg-muted/30 px-2 py-0.5 rounded-full">
            {images.length}/{maxImages}
          </span>
        </h3>
        <button
          className="text-sm text-primary hover:text-primary/80 underline transition-colors flex items-center gap-1 px-2 py-1 rounded"
          type="button"
          onClick={onShowGuide}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Submission Guide
        </button>
      </div>

      <div
        className={`bg-white dark:bg-gray-800 transition-all duration-300 border-2 rounded-lg shadow-sm hover:shadow-md ${
          isDraggingOver
            ? "border-primary border-solid ring-2 ring-primary/20"
            : "border-dashed border-muted/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {images.length === 0 ? (
          // Full-width placeholder when no images
          <label
            htmlFor="file-upload-empty"
            className={`flex flex-col items-center justify-center cursor-pointer py-2 px-2 transition-colors rounded-md ${
              isDraggingOver
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted/20"
            }`}
          >
            <div
              className={`w-16 h-16  rounded-full flex items-center justify-center ${
                isDraggingOver ? "bg-primary/20" : "bg-muted/30"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={
                  isDraggingOver ? "text-primary" : "text-muted-foreground"
                }
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <p className="text-xl font-medium mb-1">
              {isDraggingOver ? "Drop images here" : "Drag / Drop Images here"}
            </p>
            <p className="text-sm text-center text-muted-foreground max-w-md">
              or click to upload up to {maxImages} images (max {maxFileSizeMb}MB
              each, JPG/PNG/GIF/WEBP)
            </p>
            {/* MODIFIED INPUT BELOW */}
            <input
              id="file-upload-empty"
              name="file-upload"
              type="file"
              accept={allowedImageTypes.join(",")}
              // Removed: absolute inset-0 w-full h-full opacity-0 cursor-pointer
              // Use sr-only or similar to hide visually but keep accessible
              className="sr-only"
              onChange={handleFileChange}
              multiple
              disabled={images.length >= maxImages}
              aria-label="Upload reference images"
            />
            {/* END OF MODIFIED INPUT */}
          </label>
        ) : (
          // Grid layout when images exist
          <div className="p-4">
            <div className="text-muted-foreground dark:text-muted-foreground text-sm mb-4">
              Drag & drop or click to upload up to {maxImages} images (max{" "}
              {maxFileSizeMb}MB each, JPG/PNG/GIF/WEBP).
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="relative aspect-square rounded-lg overflow-hidden group border border-muted/30 hover:border-muted transition-all shadow-sm hover:shadow-md"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Reference preview ${index + 1}: ${file.name}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-white text-xs truncate w-full">
                      {file.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-destructive"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < maxImages && (
                <label
                  htmlFor="file-upload"
                  className={`relative border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-primary hover:border-primary aspect-square ${
                    isDraggingOver
                      ? "border-primary bg-primary/10 text-primary border-solid"
                      : "border-dashed border-muted/50 hover:bg-muted/20"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mb-2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span className="text-xs font-medium text-center px-2">
                    {isDraggingOver ? "Drop here" : "Add image"}
                  </span>
                  {/* Note: The input here also uses absolute positioning, but it's for the smaller "Add image" box */}
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept={allowedImageTypes.join(",")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    multiple
                    disabled={images.length >= maxImages}
                    aria-label="Upload more reference images"
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadSection;
