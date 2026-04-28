import { Component, ElementRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderService } from '../Services/folder.service';
import { FileModel, FolderModel } from '../Models/folderModel';
import { NotifierService } from 'angular-notifier';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FolderTreeNode } from '../Models/filetreeNode';
import { HttpClient } from '@angular/common/http';
import { PersistenceService } from '../Services/persistence.service';
import { Router } from '@angular/router';
import { ClientComplianceTrackerService } from '../Services/client-compliance-tracker.service';
import { UserAssignedEntity, PendingComplianceTracker, LocationMaster, ComplianceTrackerDocument, RegulationWithTOC, TypeOfCompliance } from '../Models/compliancetracker';
import { forkJoin, Observable } from 'rxjs';
import { AppConfig } from '../app.config';

// Interface for the Unified Tree API response
interface UnifiedTreeResponse {
  treeData: UnifiedTreeNode[];
  userEntities: UserAssignedEntity[];
  selectedEntity: UserAssignedEntity;
  metadata: {
    totalEntities: number;
    totalPendingCompliance: number;
    totalLocations: number;
    totalRegulations: number;
    totalNotices: number;
    generatedAt: string;
  };
}

// Interface for nodes from the Unified Tree API
interface UnifiedTreeNode {
  id: number;
  label: string;
  parentId: number;
  expanded: boolean;
  folderTitle: string;
  children: UnifiedTreeNode[];
  treeType: string;
  path: string[];
  isFile: boolean;
  nodeType: string | null;
  complianceTrackerDocumentId: string | null;
}

@Component({
  selector: 'app-fileuploadnew',
  templateUrl: './fileuploadnew.component.html',
  styleUrls: ['./fileuploadnew.component.scss']
})
export class FileuploadnewComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  // API Base URL for the Unified Tree
  private unifiedTreeApiUrl: string;

  fileModel: FileModel = {
    fileName: '',
    fileType: '',
    userId: 1,
    lastModifiedOn: 0,
    filePath: "",
    folderId: 1,
    id: 0
  };
  
  selectedFolderId: number = 3;
  folderModel: FolderModel = {
    folderName: "",
    isParent: false,
    userId: this.persistenceService.getUserId() || 0,
    id: 0,
    entityId: 0
  };
  
  primaryfolderName: FolderModel = {
    folderName: "",
    isParent: false,
    userId: this.persistenceService.getUserId() || 0,
    parentId: 0,
    id: 0,
    entityId: 0
  };

  formgroupCreateFolder!: FormGroup;
  fbCreatePrimaryFolder!: FormGroup;

  selectedEntityId: number = 1;
  
  public columnDefs = [
    { headerName: 'ID', valueGetter: 'node.rowIndex + 1', sortable: true, filter: true },
    { headerName: 'File Name', field: 'fullName', cellRenderer: this.fileCellRenderer.bind(this), sortable: true, filter: true },
    { headerName: 'Folder', field: 'folderName', sortable: true, filter: true },
    { headerName: 'Last modified', field: 'createdOn', sortable: true, filter: true },
    { headerName: 'Owner', field: 'createdByName', sortable: true, filter: true },
    {
      headerName: 'Options',
      cellRenderer: (params: any) => this.optionsRenderer(params),
      width: 100
    }
  ];

  public defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1
  };

  // Pagination settings
  paginationPageSize: number = 5;

  currentUserId: number = 1;
  selectedFolderTreeNodeItem: FolderTreeNode | null = null;
  breadcrumbPath: { label: string, node?: FolderTreeNode }[] = [];
  sidebarCollapsed: boolean = false;
  complianceFolders: any[] = [];
  selectedComplianceFolder: any = null;
  complianceFiles: any[] = [];

  // User entities and compliance data
  userAssignedEntities: UserAssignedEntity[] = [];
  selectedEntity: UserAssignedEntity | null = null;
  pendingComplianceData: PendingComplianceTracker[] = [];
  locationMasterData: LocationMaster[] = [];

  // Regulations and TOC
  regulationsData: RegulationWithTOC[] = [];
  selectedRegulation: RegulationWithTOC | null = null;
  typeOfComplianceList: TypeOfCompliance[] = [];
  selectedTOC: TypeOfCompliance | null = null;
  isLoadingRegulations: boolean = false;
  isLoadingTOC: boolean = false;

  // Notices
  noticesData: RegulationWithTOC[] = [];
  isLoadingNotices: boolean = false;
  noticesListByRegulation: Map<number, any[]> = new Map();

  // Loading state
  isLoading: boolean = false;

  // Metadata from API
  metadata: any = null;

  constructor(
    private folderService: FolderService,
    private notifier: NotifierService,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private persistenceService: PersistenceService,
    private route: Router,
    private clientComplianceService: ClientComplianceTrackerService,
    private config: AppConfig
  ) {
    this.unifiedTreeApiUrl = `${this.config.ServiceUrl}/UnifiedTree/tree`;
    var userdata = sessionStorage.getItem('currentUser');
    if (userdata) {
      var user = JSON.parse(userdata);
      this.currentUserId = user.id;
    }
    this.formgroupCreateFolder = this.formBuilder.group({
      folderName: ['', Validators.required],
      isParent: [false]
    });
    this.fbCreatePrimaryFolder = this.formBuilder.group({
      primaryFolderName: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Load the unified tree at loading time
    this.loadUnifiedTree();
  }

  /**
   * Load the unified tree from the API
   * API: http://74.208.221.20/complianceclientapi/api/UnifiedTree/tree?userId={userId}&entityId={entityId}
   */
  loadUnifiedTree() {
    const userId = this.persistenceService.getUserId() || 16;
    const entityId = 231; // Default entity ID, can be made dynamic
    
    this.isLoading = true;
    
    const apiUrl = `${this.unifiedTreeApiUrl}?entityId=${entityId}`;
    
    this.http.get<UnifiedTreeResponse>(apiUrl).subscribe({
      next: (response) => {
        console.log('Unified Tree API Response:', response);
        
        // Store metadata
        this.metadata = response.metadata;
        
        // Store user entities
        this.userAssignedEntities = response.userEntities || [];
        
        // Store selected entity
        if (response.selectedEntity) {
          this.selectedEntity = response.selectedEntity;
          this.selectedEntityId = response.selectedEntity.id;
        }
        
        // Convert the unified tree data to FolderTreeNode format
        this.treeData = this.convertUnifiedTreeToFolderTree(response.treeData);
        
        // Attach parent references for breadcrumb navigation
        this.attachParentReferences(this.treeData);
        
        this.isLoading = false;
        
        console.log('Converted Tree Data:', this.treeData);
      },
      error: (err) => {
        console.error('Error loading unified tree:', err);
        this.notifier.notify('error', 'Failed to load tree data');
        this.isLoading = false;
        
        // Fallback to empty tree
        this.treeData = [];
      }
    });
  }

  /**
   * Convert UnifiedTreeNode array to FolderTreeNode array
   */
  convertUnifiedTreeToFolderTree(unifiedNodes: UnifiedTreeNode[], parent: FolderTreeNode | null = null): FolderTreeNode[] {
    if (!unifiedNodes || unifiedNodes.length === 0) {
      return [];
    }

    return unifiedNodes.map(node => {
      const folderNode: FolderTreeNode = {
        id: node.id,
        label: node.label,
        parentId: node.parentId,
        expanded: node.expanded,
        foldertitle: node.folderTitle,
        children: [],
        treeType: node.treeType as 'DMS' | 'COMPSEQR360',
        path: node.path,
        isFile: node.isFile,
        nodeType: node.nodeType || undefined,
        fileData: node.complianceTrackerDocumentId ? { complianceTrackerDocumentId: node.complianceTrackerDocumentId } : undefined,
        parent: parent || undefined
      };

      // Recursively convert children
      if (node.children && node.children.length > 0) {
        folderNode.children = this.convertUnifiedTreeToFolderTree(node.children, folderNode);
      }

      return folderNode;
    });
  }

  /**
   * Reload tree when entity changes
   */
  onEntityChange(entity: UserAssignedEntity) {
    this.selectedEntity = entity;
    this.selectedEntityId = entity.id;
    
    // Reload the unified tree with the new entity
    this.loadUnifiedTreeForEntity(entity.id);
  }

  /**
   * Load unified tree for a specific entity
   */
  loadUnifiedTreeForEntity(entityId: number) {
    const userId = this.persistenceService.getUserId() || 16;
    
    this.isLoading = true;
    
    const apiUrl = `${this.unifiedTreeApiUrl}?userId=${userId}&entityId=${entityId}`;
    
    this.http.get<UnifiedTreeResponse>(apiUrl).subscribe({
      next: (response) => {
        console.log('Unified Tree API Response for entity:', entityId, response);
        
        // Store metadata
        this.metadata = response.metadata;
        
        // Convert and update tree data
        this.treeData = this.convertUnifiedTreeToFolderTree(response.treeData);
        this.attachParentReferences(this.treeData);
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading unified tree for entity:', err);
        this.notifier.notify('error', 'Failed to load tree data');
        this.isLoading = false;
      }
    });
  }

  // ====== Grid Renderers ======

  fileCellRenderer(params: any) {
    const fileType = params.data.fileType;
    const fileName = params.data.fileName;
    const iconSrc = this.getFileIcon(fileType);
    return `<img src="${iconSrc}" style="margin-right: 8px;width: 24px;height: 24px;" alt="file">${fileName}`;
  }

  optionsRenderer(params: any) {
    const hasFileContent = params.data.fileContent;
    const hasFilePath = params.data.filePath;
    const canViewDownload = hasFileContent || hasFilePath;

    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-sm btn-outline-secondary btn-view';
    viewButton.innerHTML = '<i class="bi bi-eye"></i>';

    if (!canViewDownload) {
      viewButton.disabled = true;
      viewButton.style.opacity = '0.5';
      viewButton.style.cursor = 'not-allowed';
      viewButton.title = 'No document available';
    } else {
      viewButton.addEventListener('click', () => {
        this.onViewClick(params);
      });
    }

    const downloadButton = document.createElement('button');
    downloadButton.className = 'btn btn-sm btn-outline-secondary btn-download';
    downloadButton.innerHTML = '<i class="bi bi-download"></i>';

    if (!canViewDownload) {
      downloadButton.disabled = true;
      downloadButton.style.opacity = '0.5';
      downloadButton.style.cursor = 'not-allowed';
      downloadButton.title = 'No document available';
    } else {
      downloadButton.addEventListener('click', () => {
        this.onDownloadClick(params);
      });
    }

    const container = document.createElement('div');
    container.className = 'btn-group';
    container.appendChild(viewButton);
    container.appendChild(downloadButton);

    return container;
  }

  getFileIcon(fileType: string | null): string {
    switch (fileType) {
      case 'application/pdf':
        return 'assets/images/icons/pdf.png';
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        return 'assets/images/icons/google.png';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'assets/images/icons/excel.svg';
      default:
        return 'assets/images/icons/docs.png';
    }
  }

  // ====== File Operations ======

  onViewClick(params: any): void {
    const data = params.data;

    if (data?.fileContent) {
      const fileName = data.fileName || data.fullName || 'document';
      this.viewBase64File(data.fileContent, fileName);
      return;
    }

    if (data?.activityData?.fileContent) {
      const fileName = data.activityData.fileName || data.fileName || 'document';
      this.viewBase64File(data.activityData.fileContent, fileName);
      return;
    }

    if (data?.filePath) {
      window.open(data.filePath, '_blank');
      return;
    }

    this.notifier.notify('error', 'No file content available to view');
  }

  onDownloadClick(params: any): void {
    if (params.data.fileContent) {
      this.downloadBase64File(params.data.fileContent, params.data.fileName);
    } else {
      const imagePath = params.data.filePath;
      const fileName = params.data.fileName || 'downloaded-file';

      this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob: Blob | MediaSource) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      }, (error: any) => {
        console.error('Error downloading the file:', error);
      });
    }
  }

  viewBase64File(base64Content: string, fileName: string): void {
    try {
      const mimeType = this.getMimeType(fileName);
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        this.notifier.notify('warning', 'Popup blocked. Please allow popups or use download instead.');
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.click();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Error viewing file:', error);
      this.notifier.notify('error', 'Failed to view file');
    }
  }

  downloadBase64File(base64Content: string, fileName: string): void {
    try {
      const mimeType = this.getMimeType(fileName);
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      this.notifier.notify('error', 'Failed to download file');
    }
  }

  getMimeType(fileName: string): string {
    const ext = this.getFileExtension(fileName);
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'xml': 'application/xml',
      'zip': 'application/zip',
      'html': 'text/html'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : '';
  }

  // ====== Modal and UI ======

  searchFilter = 'Owned by me';
  private modalService = inject(NgbModal);

  folders: any[] = [];
  files: any[] = [];
  treeData: FolderTreeNode[] = [];

  triggerFileInput() {
    var path = this.selectedFolderTreeNodeItem?.path;
    if (path && path.includes("COMPSEQR360")) {
      alert("Cannot create or upload files to COMPSEQR360 folder.");
      return;
    }
    this.fileInput.nativeElement.click();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.selectedFolderTreeNodeItem) {
      this.fileModel.fileName = file.name;
      this.fileModel.fileType = file.type;
      this.fileModel.filePath = file.webkitRelativePath;
      this.fileModel.folderId = this.selectedFolderTreeNodeItem.id;
      this.fileModel.lastModifiedOn = file.lastModified;

      this.uploadFile(file);
    }
  }

  isSelected(item: FolderTreeNode): boolean {
    return this.selectedFolderTreeNodeItem?.id === item.id;
  }

  uploadFile(file: File) {
    this.folderService.uploadFile(this.fileModel, file).subscribe(
      (result: any) => {
        if (this.selectedFolderTreeNodeItem) {
          this.getAllFilesbyFolderId(
            this.selectedFolderTreeNodeItem.id,
            this.getModuleType(this.selectedFolderTreeNodeItem.foldertitle || '')
          );
        } else {
          this.getAllFilesbyFolderId(this.selectedFolderId);
        }
        this.notifier.notify('success', 'Uploaded Successfully');
      },
      (error: any) => {
        console.error('Error uploading file:', error);
      }
    );
  }

  getAllFilesbyFolderId(folderId: number, type: any = 'proedox') {
    this.files = [];
    this.folderService.getFilesbyFolderId(folderId, type).subscribe((result: any) => {
      this.files = result;
    }, (error: any) => {
      console.error("Error fetching files:", error);
    });
  }

  createSubFolder() {
    if (this.formgroupCreateFolder.valid && this.selectedFolderTreeNodeItem) {
      this.folderModel.folderName = this.formgroupCreateFolder.controls['folderName'].value;
      this.folderModel.isParent = false;
      this.folderModel.entityId = this.selectedEntityId;
      this.folderModel.parentId = this.selectedFolderTreeNodeItem.id;
      
      this.folderService.createFolder(this.folderModel).subscribe(
        (result: any) => {
          this.notifier.notify('success', 'Folder Created Successfully');
          this.loadUnifiedTreeForEntity(this.selectedEntityId);
          this.files = result;
          this.modalService.dismissAll();
        },
        (error: any) => {
          console.error("Error creating folder:", error);
          this.notifier.notify('error', 'Error creating folder. Please try again.');
        }
      );
    } else {
      this.notifier.notify('warning', 'Please enter a valid folder name.');
    }
  }

  createPrimaryFolder() {
    if (this.fbCreatePrimaryFolder.valid) {
      this.folderModel.folderName = this.fbCreatePrimaryFolder.controls['primaryFolderName'].value;
      this.folderModel.isParent = true;
      this.folderModel.entityId = this.selectedEntityId;
      this.folderModel.parentId = 0;
      
      this.folderService.createFolder(this.folderModel).subscribe(
        (result: any) => {
          this.notifier.notify('success', 'Folder Created Successfully');
          this.loadUnifiedTreeForEntity(this.selectedEntityId);
          this.files = result;
          this.modalService.dismissAll();
        },
        (error: any) => {
          console.error("Error creating folder:", error);
          this.notifier.notify('error', 'Error creating folder. Please try again.');
        }
      );
    } else {
      this.notifier.notify('warning', 'Please enter a valid folder name.');
    }
  }

  openSm(content: TemplateRef<any>, type: string = 'subfolder') {
    if (type === 'subfolder') {
      const dmsRoot = this.findDmsRoot();
      if (!dmsRoot || !dmsRoot.children || dmsRoot.children.length === 0) {
        this.notifier.notify('warning', 'Please create a Primary Folder first.');
        return;
      }
    }

    var path = this.selectedFolderTreeNodeItem?.path;
    if (path && path.includes("COMPSEQR360")) {
      alert("Cannot create or upload files to COMPSEQR360 folder.");
      return;
    }
    this.modalService.open(content, { centered: true, size: 'md' });
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true });
  }

  toggle(item: FolderTreeNode, event: Event): void {
    event.stopPropagation();
    item.expanded = !item.expanded;
  }

  selectItem(item: FolderTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    const realNode = this.findNodeById(this.treeData, item.id, item.treeType) || item;

    this.selectedFolderTreeNodeItem = realNode;
    this.buildBreadcrumbPath(realNode);

    // Handle selection based on node type
    if (realNode.treeType === 'COMPSEQR360') {
      this.handleComplianceTrackerSelection(realNode);
    } else {
      this.getAllFilesbyFolderId(realNode.id, this.getModuleType(realNode.path || ''));
    }
  }

  /**
   * Handle selection of Compliance Tracker nodes
   */
  handleComplianceTrackerSelection(node: FolderTreeNode): void {
    const foldertitle = node.foldertitle;

    // Get complianceTrackerDocumentId from node's fileData
    const complianceTrackerDocumentId = node.fileData?.complianceTrackerDocumentId;

    if (complianceTrackerDocumentId) {
      // Load documents for this compliance item
      this.loadComplianceDocuments(parseInt(complianceTrackerDocumentId, 10), node);
    } else if (node.children && node.children.length > 0) {
      // Collect all complianceTrackerDocumentIds from children
      this.loadComplianceDocumentsForParent(node);
    } else {
      // No documents to load, display node info
      this.files = [{
        id: node.id,
        fileName: node.label,
        fullName: node.label,
        folderName: node.path?.[node.path.length - 2] || 'Folder',
        fileType: 'folder'
      }];
    }
  }

  /**
   * Load compliance tracker documents from API
   */
  loadComplianceDocuments(complianceTrackerDocumentId: number, node: FolderTreeNode): void {
    const locationFolderName = node.path?.[node.path.length - 2] || node.label;

    this.clientComplianceService.getComplianceTrackerDocuments(complianceTrackerDocumentId).subscribe({
      next: (documents: ComplianceTrackerDocument[]) => {
        if (documents && documents.length > 0) {
          this.files = documents.map((doc, index) => ({
            id: index + 1,
            fileName: doc.fileName,
            fullName: doc.fileName,
            folderName: locationFolderName,
            compId: doc.compId,
            fileContent: doc.fileContent,
            createdBy: doc.createdBy,
            createdByName: doc.createdByName,
            isDelete: doc.isDelete,
            createdOn: doc.createdDate,
            fileType: this.getFileExtension(doc.fileName)
          }));
        } else {
          this.files = [{
            id: node.id,
            fileName: node.label,
            fullName: node.label,
            folderName: locationFolderName,
            fileType: 'compliance'
          }];
        }
      },
      error: (err) => {
        console.error('Error loading compliance documents:', err);
        this.notifier.notify('error', 'Failed to load documents');
        this.files = [];
      }
    });
  }

  /**
   * Collect all complianceTrackerDocumentIds from child nodes and load documents
   */
  loadComplianceDocumentsForParent(node: FolderTreeNode): void {
    const documentIds = this.collectComplianceTrackerDocumentIds(node);

    if (documentIds.length === 0) {
      this.files = this.collectAllFiles(node);
      return;
    }

    const locationFolderName = node.foldertitle === 'Location'
      ? node.label
      : node.path?.[node.path.length - 1] || node.label;

    const idsParam = documentIds.join(',');

    this.clientComplianceService.getComplianceTrackerDocuments(idsParam).subscribe({
      next: (documents: ComplianceTrackerDocument[]) => {
        if (documents && documents.length > 0) {
          this.files = documents.map((doc, index) => ({
            id: index + 1,
            fileName: doc.fileName,
            fullName: doc.fileName,
            folderName: locationFolderName,
            compId: doc.compId,
            fileContent: doc.fileContent,
            createdBy: doc.createdBy,
            createdByName: doc.createdByName,
            isDelete: doc.isDelete,
            createdOn: doc.createdDate,
            fileType: this.getMimeType(doc.fileName)
          }));
        } else {
          this.files = this.collectAllFiles(node);
        }
      },
      error: (err) => {
        console.error('Error loading documents for parent:', err);
        this.files = this.collectAllFiles(node);
      }
    });
  }

  /**
   * Collect all complianceTrackerDocumentIds from child nodes recursively
   */
  collectComplianceTrackerDocumentIds(node: FolderTreeNode): string[] {
    let ids: string[] = [];

    if (node.fileData?.complianceTrackerDocumentId) {
      ids.push(node.fileData.complianceTrackerDocumentId);
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        ids = [...ids, ...this.collectComplianceTrackerDocumentIds(child)];
      }
    }

    return [...new Set(ids)]; // Remove duplicates
  }

  /**
   * Collect all files from node and children
   */
  collectAllFiles(node: FolderTreeNode): any[] {
    let files: any[] = [];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (child.isFile && child.fileData) {
          files.push({
            ...child.fileData,
            folderName: node.label,
            fullName: child.label
          });
        } else {
          files = [...files, ...this.collectAllFiles(child)];
        }
      }
    }
    return files;
  }

  // ====== Tree Navigation ======

  findNodeById(nodes: FolderTreeNode[], id: number, treeType?: 'DMS' | 'COMPSEQR360'): FolderTreeNode | null {
    if (!nodes) return null;
    for (const n of nodes) {
      if (n.id === id && (!treeType || n.treeType === treeType)) {
        return n;
      }
      if (n.children && n.children.length) {
        const found = this.findNodeById(n.children, id, treeType);
        if (found) return found;
      }
    }
    return null;
  }

  buildBreadcrumbPath(selectedNode: FolderTreeNode): void {
    if (!selectedNode) {
      this.breadcrumbPath = [{ label: 'ProEDox' }];
      return;
    }

    const node: any = selectedNode;
    this.breadcrumbPath = [];

    if (node.path && Array.isArray(node.path)) {
      this.breadcrumbPath = node.path.map((label: string, i: number) => ({
        label,
        node: i === node.path.length - 1 ? selectedNode : undefined
      }));
      return;
    }

    const path: FolderTreeNode[] = [];
    let current: FolderTreeNode | undefined = selectedNode;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    path.forEach(n => this.breadcrumbPath.push({
      label: n.label,
      node: n
    }));
  }

  navigateToBreadcrumb(breadcrumb: { label: string; node?: FolderTreeNode }): void {
    if (!breadcrumb.node) {
      const dmsRoot = this.findDmsRoot();
      if (dmsRoot) {
        this.selectedFolderTreeNodeItem = dmsRoot;
        this.buildBreadcrumbPath(dmsRoot);
        this.getAllFilesbyFolderId(dmsRoot.id, 'Dms');
      }
      return;
    }

    const actualNode = this.findNodeById(this.treeData, breadcrumb.node.id) || breadcrumb.node;

    this.selectedFolderTreeNodeItem = actualNode;
    this.buildBreadcrumbPath(actualNode);
    this.getAllFilesbyFolderId(
      actualNode.id,
      this.getModuleType(actualNode.foldertitle || '')
    );
  }

  findDmsRoot(): FolderTreeNode | null {
    return this.treeData.find(node =>
      node.label.toLowerCase() === 'proedox' ||
      (node.foldertitle || '').toLowerCase() === 'proedox'
    ) || null;
  }

  attachParentReferences(nodes: FolderTreeNode[], parent: FolderTreeNode | null = null) {
    if (!nodes) return;
    for (const n of nodes) {
      n.parent = parent || undefined;
      if (parent) n.parentId = parent.id;
      if (n.children && n.children.length > 0) {
        this.attachParentReferences(n.children, n);
      }
    }
  }

  getModuleType(label: any): string {
    if (label.includes("COMPSEQR360") && label.length > 1) {
      return label[1]?.toLowerCase();
    } else if (label.includes("COMPSEQR360") && label.length === 1) {
      return label[0]?.toLowerCase();
    } else {
      return label[0]?.toLowerCase();
    }
  }

  /**
   * Check if current view is showing compliance files
   */
  isComplianceView(): boolean {
    return this.selectedComplianceFolder !== null;
  }

  /**
   * Compare entities for dropdown selection
   */
  compareEntities(entity1: UserAssignedEntity, entity2: UserAssignedEntity): boolean {
    return entity1 && entity2 ? entity1.id === entity2.id : entity1 === entity2;
  }
}
