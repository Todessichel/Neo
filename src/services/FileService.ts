import { DocumentType } from '../types/projectTypes';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';
import { marked } from 'marked';

export interface FileLocation {
  directory: string;
  files: {
    [key in DocumentType]?: string;
  };
}

export class FileService {
  private static readonly STORAGE_KEY = 'neo_document_directory';
  private static readonly SUPPORTED_FORMATS = {
    'application/json': 'json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/pdf': 'pdf',
    'text/csv': 'csv',
    'text/markdown': 'md'
  };

  // Add document type to format mapping
  private static readonly DOCUMENT_FORMAT_MAP: Record<DocumentType, 'md' | 'json'> = {
    'Strategy': 'md',
    'Canvas': 'md',
    'OKRs': 'md',
    'Financial Projection': 'json'
  };

  static async getFileLocation(): Promise<FileLocation | null> {
    try {
      const savedLocation = localStorage.getItem(this.STORAGE_KEY);
      return savedLocation ? JSON.parse(savedLocation) : null;
    } catch (error) {
      console.error('Error getting file location:', error);
      return null;
    }
  }

  static async saveFileLocation(location: FileLocation): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(location));
      console.log('File location saved:', location);
    } catch (error) {
      console.error('Error saving file location:', error);
      throw error;
    }
  }

  static async selectDirectory(): Promise<string | null> {
    try {
      console.log('Checking File System Access API support...');
      if (!window.showDirectoryPicker) {
        console.error('File System Access API is not supported in your browser');
        throw new Error('File System Access API is not supported in your browser. Please use a modern browser like Chrome, Edge, or Opera.');
      }

      console.log('Requesting directory picker...');
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      
      if (!dirHandle) {
        console.error('No directory selected');
        return null;
      }

      console.log('Directory handle received:', dirHandle);
      return dirHandle.name;
    } catch (error) {
      console.error('Error selecting directory:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to select directory. Please try again.');
    }
  }

  static async uploadFiles(): Promise<FileLocation | null> {
    try {
      console.log('Starting file upload process...');
      if (!window.showDirectoryPicker) {
        throw new Error('File System Access API is not supported in your browser');
      }

      console.log('Requesting directory picker...');
      const dirHandle = await window.showDirectoryPicker();
      console.log('Directory handle received:', dirHandle);

      console.log('Creating files directory...');
      const files = await dirHandle.getFileHandle('files', { create: true });
      console.log('Files directory created:', files);
      
      const fileLocation: FileLocation = {
        directory: dirHandle.name,
        files: {}
      };

      console.log('Saving file location...');
      await this.saveFileLocation(fileLocation);
      console.log('File location saved:', fileLocation);

      return fileLocation;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }

  static async convertToJson(file: File): Promise<any> {
    try {
      console.log('Converting file to JSON:', file.name, file.type);
      
      // First try to read the file content
      const content = await this.readFileContent(file, 'text/plain');
      
      // Detect file type from extension if MIME type is not available
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let mimeType = file.type;

      // If no MIME type is provided, try to detect from extension
      if (!mimeType && fileExtension) {
        mimeType = this.getMimeTypeFromExtension(fileExtension);
      }

      // If still no MIME type, try to infer from file name
      if (!mimeType && file.name.toLowerCase().endsWith('.md')) {
        mimeType = 'text/markdown';
      }

      if (!mimeType) {
        throw new Error('Unsupported file type');
      }

      let jsonData: any;

      switch (mimeType) {
        case 'application/json':
          jsonData = JSON.parse(content as string);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          jsonData = await this.convertDocxToJson(content as ArrayBuffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          jsonData = await this.convertXlsxToJson(content as ArrayBuffer);
          break;
        case 'application/pdf':
          jsonData = await this.convertPdfToJson(content as ArrayBuffer);
          break;
        case 'text/csv':
          jsonData = await this.convertCsvToJson(content as string);
          break;
        case 'text/markdown':
          jsonData = await this.convertMarkdownToJson(content as string);
          break;
        default:
          throw new Error(`Unsupported file format: ${mimeType}`);
      }

      // Add metadata to the JSON output
      return {
        metadata: {
          originalFileName: file.name,
          fileType: mimeType,
          fileSize: file.size,
          lastModified: file.lastModified,
          convertedAt: new Date().toISOString()
        },
        content: jsonData
      };
    } catch (error) {
      console.error('Error converting file to JSON:', error);
      throw error;
    }
  }

  private static async readFileContent(file: File, mimeType: string): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file content'));
          return;
        }

        // For text-based files, ensure we get a string
        if (mimeType === 'text/csv' || mimeType === 'text/markdown' || mimeType === 'application/json' || mimeType === 'text/plain') {
          if (typeof event.target.result === 'string') {
            resolve(event.target.result);
          } else {
            // Convert ArrayBuffer to string if needed
            const decoder = new TextDecoder('utf-8');
            resolve(decoder.decode(event.target.result as ArrayBuffer));
          }
        } else {
          // For binary files, ensure we get an ArrayBuffer
          if (event.target.result instanceof ArrayBuffer) {
            resolve(event.target.result);
          } else {
            reject(new Error('Invalid file content type for binary file'));
          }
        }
      };

      reader.onerror = () => reject(new Error('Error reading file'));

      // Choose reading method based on file type
      if (mimeType === 'application/pdf' || mimeType.includes('word') || mimeType.includes('excel')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file, 'utf-8');
      }
    });
  }

  private static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'json': 'application/json',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'pdf': 'application/pdf',
      'csv': 'text/csv',
      'md': 'text/markdown',
      'txt': 'text/plain'
    };
    return mimeTypes[extension] || '';
  }

  private static async convertDocxToJson(content: ArrayBuffer): Promise<any> {
    try {
      console.log('Converting DOCX to JSON...');
      const result = await mammoth.convertToHtml({ arrayBuffer: content });
      console.log('DOCX conversion result:', result);
      return {
        html: result.value,
        messages: result.messages,
        structure: this.extractDocumentStructure(result.value)
      };
    } catch (error) {
      console.error('Error converting DOCX:', error);
      throw error;
    }
  }

  private static async convertXlsxToJson(content: ArrayBuffer): Promise<any> {
    try {
      console.log('Converting XLSX to JSON...');
      const workbook = XLSX.read(content, { type: 'array' });
      console.log('Workbook loaded:', workbook);
      
      const sheets: { [key: string]: any[] } = {};
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      });

      return {
        sheets,
        metadata: {
          sheetNames: workbook.SheetNames,
          totalSheets: workbook.SheetNames.length
        }
      };
    } catch (error) {
      console.error('Error converting XLSX:', error);
      throw error;
    }
  }

  private static async convertPdfToJson(content: ArrayBuffer): Promise<any> {
    try {
      console.log('Converting PDF to JSON...');
      const pdf = await pdfjsLib.getDocument({ data: content }).promise;
      console.log('PDF loaded:', pdf);
      
      const pages = [];
      const metadata = await pdf.getMetadata();
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        
        pages.push({
          pageNumber: i,
          text: textContent.items.map((item: any) => item.str).join(' '),
          dimensions: {
            width: viewport.width,
            height: viewport.height
          }
        });
      }
      
      return {
        pages,
        metadata: {
          ...metadata?.info,
          numPages: pdf.numPages
        }
      };
    } catch (error) {
      console.error('Error converting PDF:', error);
      throw error;
    }
  }

  private static async convertCsvToJson(content: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Converting CSV to JSON...');
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV parsing complete:', results);
            resolve({
              data: results.data,
              meta: results.meta,
              errors: results.errors
            });
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('Error in CSV conversion:', error);
        reject(error);
      }
    });
  }

  private static async convertMarkdownToJson(content: string): Promise<any> {
    try {
      console.log('Converting Markdown to JSON...');
      const html = marked(content);
      console.log('Markdown conversion complete');
      return {
        html,
        raw: content,
        structure: this.extractDocumentStructure(html)
      };
    } catch (error) {
      console.error('Error converting Markdown:', error);
      throw error;
    }
  }

  private static extractDocumentStructure(html: string): any {
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Extract headings and their content
    const structure: any = {};
    let currentHeading = '';
    
    Array.from(div.children).forEach((element) => {
      if (element.tagName.match(/^H[1-6]$/)) {
        currentHeading = element.textContent || '';
        structure[currentHeading] = [];
      } else if (currentHeading) {
        structure[currentHeading].push(element.textContent);
      }
    });
    
    return structure;
  }

  static async saveFile(directory: string, filename: string, content: any, docType: DocumentType): Promise<void> {
    try {
      const format = this.DOCUMENT_FORMAT_MAP[docType];
      let blob: Blob;
      let fileExtension: string;

      if (format === 'md') {
        // For Markdown files, use the content directly if it's already a string
        // or convert it if it's an object
        const markdown = typeof content === 'string' ? content : this.convertToMarkdown(content);
        blob = new Blob([markdown], { type: 'text/markdown' });
        fileExtension = '.md';
      } else {
        // Keep as JSON
        const jsonString = JSON.stringify(content, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
        fileExtension = '.json';
      }

      // If directory is provided, use it
      if (directory) {
        // Create a FileSystemDirectoryHandle for the directory
        const dirHandle = await window.showDirectoryPicker();
        
        // Create a new file in the directory
        const fileHandle = await dirHandle.getFileHandle(filename + fileExtension, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to showSaveFilePicker if no directory is specified
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename + fileExtension,
          types: [{
            description: format === 'md' ? 'Markdown File' : 'JSON File',
            accept: { [format === 'md' ? 'text/markdown' : 'application/json']: [fileExtension] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      }
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  private static convertToMarkdown(content: any): string {
    // Convert JSON content to Markdown format
    let markdown = '';

    if (typeof content === 'object' && content !== null) {
      if (Array.isArray(content)) {
        content.forEach((item, index) => {
          markdown += `\n## Item ${index + 1}\n\n`;
          markdown += this.convertToMarkdown(item);
        });
      } else {
        Object.entries(content).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            markdown += `\n### ${key}\n\n`;
            markdown += this.convertToMarkdown(value);
          } else {
            markdown += `**${key}**: ${value}\n\n`;
          }
        });
      }
    } else {
      markdown += `${content}\n\n`;
    }

    return markdown;
  }
} 