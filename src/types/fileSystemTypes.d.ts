interface FileSystemWritableFileStream extends WritableStream {
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
  write(data: FileSystemWriteChunkType): Promise<void>;
  close(): Promise<void>;
}

type FileSystemWriteChunkType = string | BufferSource | Blob | DataView;

interface FileSystemDirectoryHandle {
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  name: string;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
    showSaveFilePicker(options: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

export {}; 