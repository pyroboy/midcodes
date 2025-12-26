// Image Upload Utilities
// Functions: uploadImage(), blobToDataUrl(), fetchBackgroundAsBlob()

export async function uploadImage(file: File, path: string, userId: string) {
  // TODO: Implement image upload logic
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchBackgroundAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}
