import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { AppConfig } from '../app.config';
import { ActivatedRoute } from '@angular/router';
import { FolderService } from '../Services/folder.service';

// NOTE: This component uses SheetJS (xlsx) to render Excel files in-browser.
// Install the dependency in your project if not already present:
// npm install xlsx --save

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.scss']
})
export class FileViewerComponent implements OnInit {
  // URL to the file to view. In real usage, pass this as an @Input()
  fileUrl: string = 'https://localhost:44314/UploadedFiles/All_Candidates_Report_export_1761821355001.xlsx';

  // Rendered outputs for different types
  sheetHtml: SafeHtml | null = null; // for Excel
  docHtml: SafeHtml | null = null; // for docx -> html
  textContent: string | null = null; // for text/csv/json
  blobResourceUrl: SafeResourceUrl | null = null; // for pdf/other/embed
  imageSrc: SafeResourceUrl | null = null; // for images

  fileType: string | null = null; // inferred type/extension
  loading = false;
  error: string | null = null;

  private _objectUrl: string | null = null;
  // Workbook and sheet data for table rendering
  private _workbook: any | null = null;
  private _lastXLSXModule: any = null;
  sheetNames: string[] = [];
  selectedSheetIndex = 0;
  sheetHeaders: string[] = [];
  sheetDataRows: any[][] = [];

  constructor(private http: HttpClient, private sanitizer: DomSanitizer, private url: AppConfig, private route: ActivatedRoute, private folderService: FolderService) {}

  ngOnInit(): void {
    const fileId = this.route.snapshot.queryParams['fileId'];
    const type = this.route.snapshot.queryParams['type'];
    const subType = this.route.snapshot.queryParams['subType'];
    const fileurl = this.route.snapshot.queryParams['fileurl'];

    if (fileId && type) {
      // Call GetDataByTypeAndId API to get file
      this.loading = true;
      this.folderService.getDataByTypeAndId(type, Number(fileId), subType || undefined).subscribe(
        (result: any) => {
          // Handle response with success flag and files array
          if (result && result.success && result.files && result.files.length > 0) {
            const file = result.files[0];
            const fileName = file.fileName || 'file';
            const fileContent = file.fileContent;
            // Determine file type from fileName extension
            const ext = this.getExtension(fileName);
            const mimeType = this.guessMimeFromExt(ext) || 'application/octet-stream';
            this.loadAndRenderFromBase64(fileContent, fileName, mimeType);
          } else if (result && result.fileContent) {
            // Fallback: direct fileContent in response
            const fileName = result.fileName || 'file';
            const fileType = result.fileType || 'application/octet-stream';
            this.loadAndRenderFromBase64(result.fileContent, fileName, fileType);
          } else if (result && result.filePath) {
            // Render from file path
            this.fileUrl = this.url.BaseUrl + '/' + result.filePath;
            this.loadAndRender(this.fileUrl);
          } else {
            this.error = 'No file content or path in API response';
            this.loading = false;
          }
        },
        (error: any) => {
          console.error('Error fetching file:', error);
          this.error = 'Failed to load file from server.';
          this.loading = false;
        }
      );
    } else if (fileurl) {
      this.fileUrl = this.url.BaseUrl + '/' + fileurl;
      this.loadAndRender(this.fileUrl);
    }
  }

  ngOnDestroy(): void {
    if (this._objectUrl) {
      try { URL.revokeObjectURL(this._objectUrl); } catch (e) { /* ignore */ }
      this._objectUrl = null;
    }
  }

  private getExtension(url: string): string {
    try {
      const qIdx = url.indexOf('?');
      const clean = qIdx === -1 ? url : url.substring(0, qIdx);
      const parts = clean.split('/');
      const last = parts[parts.length - 1] || '';
      const dot = last.lastIndexOf('.');
      return dot === -1 ? '' : last.substring(dot + 1).toLowerCase();
    } catch {
      return '';
    }
  }

  async loadAndRender(url: string) {
    this.loading = true;
    this.error = null;
    this.sheetHtml = null;
    this.docHtml = null;
    this.textContent = null;
    this.blobResourceUrl = null;
    this.imageSrc = null;
    this.fileType = null;

    const ext = this.getExtension(url);
    this.fileType = ext;

    try {
      if (!ext) {
        this.error = 'Unknown file type';
        return;
      }

      // For text-like files
      if (['txt', 'csv', 'json'].includes(ext)) {
        this.textContent = (await this.http.get(url, { responseType: 'text' }).toPromise()) ?? null;
        return;
      }

      // For binary files, fetch as arraybuffer and branch
      const arrayBuffer = await this.http.get(url, { responseType: 'arraybuffer' }).toPromise();

      // Handle PDF
      if (ext === 'pdf') {
        const blob = new Blob([arrayBuffer as ArrayBuffer], { type: 'application/pdf' });
        this.setObjectUrl(blob);
        return;
      }

      // Images
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) {
        const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/' + ext;
        const blob = new Blob([arrayBuffer as ArrayBuffer], { type: mime });
        this.setImageUrl(blob);
        return;
      }

      // Excel handling (xlsx/xls)
      if (ext === 'xlsx' || ext === 'xls') {
        try {
          const XLSX = await import('xlsx');
          const data = new Uint8Array(arrayBuffer as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          // store workbook and expose sheet names
          this._workbook = workbook;
          this._lastXLSXModule = XLSX;
          this.sheetNames = workbook.SheetNames || [];
          // render first sheet as a structured table (headers + rows)
          this.renderSheetAsTable(0, XLSX);
          return;
        } catch (err: any) {
          console.error('Error rendering excel', err);
          if (err && err.code === 'MODULE_NOT_FOUND') {
            this.error = 'The "xlsx" package is required to render Excel files. Run: npm install xlsx --save';
          } else {
            this.error = 'Failed to parse Excel file. Ensure it is a valid spreadsheet and CORS allows access.';
          }
          return;
        }
      }

      // DOCX handling via mammoth (optional)
      if (ext === 'docx') {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer as ArrayBuffer });
          this.docHtml = this.sanitizer.bypassSecurityTrustHtml(result.value);
          return;
        } catch (err: any) {
          console.error('Error rendering docx', err);
          if (err && err.code === 'MODULE_NOT_FOUND') {
            this.error = 'To render DOCX files in-browser install "mammoth": npm install mammoth --save';
          } else {
            this.error = 'Failed to parse DOCX file. You can download it instead.';
          }
          return;
        }
      }

      // Generic fallback: create blob and try to embed
      const mimeGuess = this.guessMimeFromExt(ext);
      const blob = new Blob([arrayBuffer as ArrayBuffer], { type: mimeGuess });
      this.setObjectUrl(blob);
    } catch (err: any) {
      console.error('Error loading file', err);
      this.error = 'Failed to load file. Check the URL and CORS headers.';
    } finally {
      this.loading = false;
    }
  }

  private renderSheetAsTable(index: number, XLSX: any) {
    if (!this._workbook) return;
    const name = this._workbook.SheetNames[index];
    const worksheet = this._workbook.Sheets[name];
    // Get an array-of-arrays representation. header:1 gives rows where first row usually contains headers
    const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!matrix || matrix.length === 0) {
      this.sheetHeaders = [];
      this.sheetDataRows = [];
      return;
    }
    // First row as headers
    this.sheetHeaders = matrix[0].map((h: any, i: number) => (h === undefined || h === null || h === '' ? 'Column ' + (i + 1) : String(h)));
    this.sheetDataRows = matrix.slice(1);
    this.selectedSheetIndex = index;
    // clear any raw HTML rendering
    this.sheetHtml = null;
  }

  changeSheet(index: any) {
    if (!this._workbook) return;
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= this.sheetNames.length) return;
    const XLSX = this._lastXLSXModule;
    this.renderSheetAsTable(idx, XLSX);
  }

  private setObjectUrl(blob: Blob) {
    if (this._objectUrl) {
      try { URL.revokeObjectURL(this._objectUrl); } catch (e) { /* ignore */ }
    }
    const url = URL.createObjectURL(blob);
    this._objectUrl = url;
    this.blobResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private setImageUrl(blob: Blob) {
    if (this._objectUrl) {
      try { URL.revokeObjectURL(this._objectUrl); } catch (e) { /* ignore */ }
    }
    const url = URL.createObjectURL(blob);
    this._objectUrl = url;
    this.imageSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private guessMimeFromExt(ext: string): string {
    const map: any = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'csv': 'text/csv',
      'txt': 'text/plain',
      'json': 'application/json'
    };
    return map[ext] || 'application/octet-stream';
  }

  /**
   * Load and render file from base64 content
   */
  async loadAndRenderFromBase64(base64Content: string, fileName: string, mimeType: string) {
    this.loading = true;
    this.error = null;
    this.sheetHtml = null;
    this.docHtml = null;
    this.textContent = null;
    this.blobResourceUrl = null;
    this.imageSrc = null;

    try {
      // Get extension from filename
      const ext = this.getExtension(fileName);
      this.fileType = ext || this.getMimeExtension(mimeType);

      // Remove data URL prefix if present
      let cleanBase64 = base64Content;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      // Convert base64 to ArrayBuffer
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const arrayBuffer = byteArray.buffer;

      // For text-like files
      if (['txt', 'csv', 'json'].includes(this.fileType || '')) {
        this.textContent = new TextDecoder().decode(byteArray);
        return;
      }

      // Handle PDF
      if (this.fileType === 'pdf' || mimeType === 'application/pdf') {
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        this.setObjectUrl(blob);
        return;
      }

      // Images
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'jfif'].includes(this.fileType || '') || mimeType.startsWith('image/')) {
        const blob = new Blob([arrayBuffer], { type: mimeType });
        this.setImageUrl(blob);
        return;
      }

      // Excel handling (xlsx/xls)
      if (this.fileType === 'xlsx' || this.fileType === 'xls') {
        try {
          const XLSX = await import('xlsx');
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          this._workbook = workbook;
          this._lastXLSXModule = XLSX;
          this.sheetNames = workbook.SheetNames || [];
          this.renderSheetAsTable(0, XLSX);
          return;
        } catch (err: any) {
          console.error('Error rendering excel', err);
          this.error = 'Failed to parse Excel file.';
          return;
        }
      }

      // DOCX handling via mammoth
      if (this.fileType === 'docx') {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
          this.docHtml = this.sanitizer.bypassSecurityTrustHtml(result.value);
          return;
        } catch (err: any) {
          console.error('Error rendering docx', err);
          this.error = 'Failed to parse DOCX file.';
          return;
        }
      }

      // Generic fallback: create blob and try to embed
      const blob = new Blob([arrayBuffer], { type: mimeType });
      this.setObjectUrl(blob);
    } catch (err: any) {
      console.error('Error loading file from base64', err);
      this.error = 'Failed to load file.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get extension from mime type
   */
  private getMimeExtension(mimeType: string): string {
    const map: any = {
      'application/pdf': 'pdf',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/csv': 'csv',
      'text/plain': 'txt',
      'application/json': 'json'
    };
    return map[mimeType] || '';
  }
}
