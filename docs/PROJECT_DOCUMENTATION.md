# DMS UI - Folder & File Management Documentation

## Table of Contents
1. [Overview](#overview)
2. [Component Structure](#component-structure)
3. [Data Models](#data-models)
4. [Service Layer](#service-layer)
5. [API Reference](#api-reference)

---

## Overview

The folder and file management system provides document management capabilities including:
- Hierarchical folder tree structure
- File upload functionality
- File viewing/preview
- Entity-based folder organization

**Base URL:** `http://74.208.221.20/complianceclientapi/api`

---

## Component Structure

```
src/app/
├── file-viewer/                      # File viewer/preview component
│   ├── file-viewer.component.html    # Template - displays file content
│   ├── file-viewer.component.scss    # Styles
│   └── file-viewer.component.ts      # Component logic - handles file preview
│
├── fileupload/                       # File upload component
│   ├── fileupload.component.html     # Template - upload form UI
│   ├── fileupload.component.scss     # Styles
│   └── fileupload.component.ts       # Component logic - handles file uploads
│
├── home/
│   └── fileupload/                   # Client-side file upload (homepage module)
│
├── Components/
│   └── treeview/                     # Reusable tree view for folder navigation
│
├── Models/
│   ├── folderModel.ts                # Folder and File data models
│   └── filetreeNode.ts               # File tree node model for treeview
│
└── Services/
    └── folder.service.ts             # Folder/File API service
```

### Component Details

#### 1. File Viewer Component (`file-viewer/`)
**Purpose:** Displays and previews uploaded files (documents, images, etc.)
- Uses `ngx-doc-viewer` for document rendering
- Supports multiple file formats
- Safe blob URL handling via pipes

#### 2. File Upload Component (`fileupload/`)
**Purpose:** Handles file selection and upload to server
- Form-based file selection
- Multi-part form data upload
- Progress indication
- Folder selection for upload destination

#### 3. Tree View Component (`Components/treeview/`)
**Purpose:** Displays hierarchical folder structure
- Expandable/collapsible nodes
- Folder navigation
- File/folder icons
- Selection handling

---

## Data Models

### FolderModel (`Models/folderModel.ts`)

```typescript
export interface FolderModel {
  folderId: number;
  folderName: string;
  parentFolderId: number | null;
  entityId: number;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  isActive: boolean;
  children?: FolderModel[];
}
```

### FileModel (`Models/folderModel.ts`)

```typescript
export interface FileModel {
  fileId: number;
  fileName: string;
  folderId: number;
  userId: number;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedDate: string;
  isActive: boolean;
}
```

### FileTreeNode (`Models/filetreeNode.ts`)

```typescript
export interface FileTreeNode {
  id: number;
  label: string;
  expanded: boolean;
  children: FileTreeNode[];
  nodeType: 'folder' | 'file' | 'document';
  isFile: boolean;
  path: string[];
  data?: any;
}
```

---

## Service Layer

### FolderService (`Services/folder.service.ts`)

**Location:** `src/app/Services/folder.service.ts`

**Injection:** `providedIn: 'root'`

```typescript
@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private BASEURL: string;
  
  constructor(
    public http: HttpClient, 
    private config: AppConfig
  ) {
    this.BASEURL = this.config.ServiceUrl;
  }

  // Get all folders
  getAllFolders(): Observable<FolderModel[]>;
  
  // Get complete folder list
  getcompleteFolderList(): Observable<any>;
  
  // Get folder tree by entity and user
  getGetFolderTree(entityId: number, userId: number): Observable<FolderModel[]>;
  
  // Get files by folder ID
  getFilesbyFolderId(folderId: number, type?: string): Observable<FolderModel[]>;
  
  // Create new folder
  createFolder(folderModel: FolderModel): Observable<boolean>;
  
  // Upload file
  uploadFile(fileModel: FileModel, file: File): Observable<any>;
}
```

---

## API Reference

### Folder Management APIs (`/FolderManagement`)

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/FolderManagement/FoldersByEntity` | Get all folders for entity | - |
| GET | `/FolderManagement/tree` | Get folder tree structure | `intityId`, `userId` |
| POST | `/FolderManagement/create-folder` | Create a new folder | `FolderModel` (body) |

#### Get Folder Tree
```
GET /FolderManagement/tree?intityId={entityId}&userId={userId}
```
**Response:** Array of `FolderModel` with nested children

#### Create Folder
```
POST /FolderManagement/create-folder
Content-Type: application/json
Authorization: Bearer {token}

{
  "folderName": "New Folder",
  "parentFolderId": 1,
  "entityId": 5,
  "createdBy": 10
}
```
**Response:** `boolean` (success/failure)

---

### File Upload APIs (`/FileUpload`)

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/FileUpload/GetComseq` | Get complete folder sequence | - |
| GET | `/FileUpload/getFiles` | Get files by folder | `folderId`, `mtype` |
| POST | `/FileUpload/FileUpload` | Upload a file | `folderId`, `userId`, `file` (multipart) |

#### Get Files by Folder
```
GET /FileUpload/getFiles?folderId={folderId}&mtype={type}
```
**Parameters:**
- `folderId` (required): Target folder ID
- `mtype` (optional): File type filter (default: `'Dms'`)

**Response:** Array of file objects

#### Upload File
```
POST /FileUpload/FileUpload?folderId={folderId}&userId={userId}
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
  - file: [Binary file data]
```
**Response:** Upload result object

---

### Related Compliance Tracker APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ComplianceTracker/GetComplianceTrackerDocuments` | Get compliance documents |

#### Get Compliance Documents
```
GET /ComplianceTracker/GetComplianceTrackerDocuments?CompId={complianceId}
```
**Response:** Array of `ComplianceTrackerDocument`

---

## Authentication

All API requests require Bearer token authentication:

```typescript
Headers: {
  'Authorization': 'Bearer {access_token}',
  'Content-Type': 'application/json'  // or 'multipart/form-data' for uploads
}
```

Token is retrieved from `localStorage.getItem('currentUser')`.

---

*Document generated on: February 11, 2026*
