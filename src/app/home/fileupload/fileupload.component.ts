import { Component, ElementRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderService } from '../../Services/folder.service';
import { FileModel, FolderModel } from '../../models/folderModel';
import { file } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getDate } from 'date-fns';
import { FolderTreeNode } from '../../Models/filetreeNode';
import { HttpClient } from '@angular/common/http';
import { ClientComplianceTrackerService } from '../../Services/client-compliance-tracker.service';
import { ComplianceTrackerDocument } from '../../Models/compliancetracker';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.css']
})
export class FileuploadComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  fileModel: FileModel=  {
    fileName: '',
    fileType: '',
    userId: 1,

    //lastModified: new Date(),
    lastModifiedOn: 0,
    filePath: "",
    folderId: 1,
    id: 0
  };
  selectedFolderId: number =3;
  folderModel: FolderModel= {
    folderName: "",
    isParent: false,
    userId: 2,
    id: 0,
    entityId: 0
  };
  primaryfolderName: FolderModel= {
    folderName: "",
    isParent: false,
    userId: 2,
    parentId:0,
    id: 0,
    entityId: 0
  };

  formgroupCreateFolder!: FormGroup;
  fbCreatePrimaryFolder!: FormGroup;

  selectedEntityId: number =1;
  public columnDefs = [
    { headerName: 'Name', field: 'fileName',cellRenderer: this.fileCellRenderer.bind(this), sortable: true, filter: true },
    { headerName: 'Last modified', field: 'lastModifiedOn',cellRenderer:this.modifiedDateRenderer, sortable: true, filter: true },
    { headerName: 'ID', field: 'id', sortable: true, filter: true },
    { headerName: 'Owner', field: 'owner', sortable: true, filter: true },
    { headerName: 'Access', field: 'filePath', cellRenderer: this.imageRenderer },
    {
      headerName: 'Options',
      cellRenderer: (params: any) => this.optionsRenderer(params),  // Use an arrow function
      width: 100
    }
  ];

  public defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1

  };
  currentUserId: number= 1;
  selectedFolderTreeNodeItem: FolderTreeNode | null = null;
  breadcrumbPath: { label: string, node?: FolderTreeNode }[] = [];

  constructor(
    private folderService: FolderService,
    private notifier: NotifierService,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private clientComplianceService: ClientComplianceTrackerService,
    private router: Router
  ) {
    this.formgroupCreateFolder = this.formBuilder.group({
      folderName: ['', Validators.required],
      isParent: [false]
    });
    this.fbCreatePrimaryFolder = this.formBuilder.group({
      primaryFolderName:['',Validators.required]
    })
  }

  ngOnInit() {
    this.getAllFolders();
    this.getAllFilesbyFolderId(this.selectedFolderId);
    this.getGetFolderTree(this.selectedEntityId,this.currentUserId);

  }
  getGetFolderTree(selectedEntityId: number, currentUserId: any) {
    this.folderService.getGetFolderTree(selectedEntityId,currentUserId).subscribe((result: any) => {
      result.forEach((element: any) => {

      });
      //console.log("folders result == ",result);

      this.treeData = result;
      if (this.treeData.length > 0) {
        this.selectedFolderTreeNodeItem = this.treeData[0];
        this.buildBreadcrumbPath(this.treeData[0]); // Initialize breadcrumb
      }
    });
  }
  imageRenderer(params: any) {
    return `<img src="${params.value}" class="rounded-circle" width="30">`;
  }

  modifiedDateRenderer(params: any) {
    return `${params.data.lastModifiedOn}`;
  }


  fileCellRenderer(params: any) {
    const fileType = params.data.fileType;
    const fileName = params.data.fileName;
    const iconClass = this.getFileIcon(fileType);

    return `<i class="${iconClass}" style="margin-right: 8px;"></i>${fileName}`;
  }

  // Custom cell renderer for the options column
  optionsRenderer(params: any) {
    // Check if file content exists (for compliance documents) or filePath exists (for DMS)
    const hasFileContent = params.data?.fileContent;
    const hasFilePath = params.data?.filePath;
    const canViewDownload = hasFileContent || hasFilePath;
    
    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-sm btn-outline-secondary btn-view';
    viewButton.innerHTML = '<i class="bi bi-eye"></i>';
    
    // Disable if no file content/path available
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
    
    // Disable if no file content/path available
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
        return 'fas fa-file-pdf';
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        return 'fas fa-file-image';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'fas fa-file-excel';
      default:
        return 'fas fa-file';
    }
  }

  onClickFolder(folderId: number) {
      this.selectedFolderId= folderId;
  }

  onViewClick(params: any): void {
    // Check if this is a compliance document with base64 content
    if (params.data?.fileContent) {
      this.viewBase64File(params.data.fileContent, params.data.fileName);
    } else if (params.data?.filePath) {
      // Regular file with filePath - navigate to internal file viewer
      const imagePath = params.data.filePath;
      this.router.navigate(['/fileview'], { queryParams: { fileurl: imagePath } });
    } else {
      this.notifier.notify('error', 'No file content available to view');
    }
  }

  onDownloadClick(params: any): void {
    // Check if this is a compliance document with base64 content
    if (params.data?.fileContent) {
      this.downloadBase64File(params.data.fileContent, params.data.fileName);
    } else if (params.data?.filePath) {
      // Regular file with filePath
      const imagePath = params.data.filePath;
      const fileName = params.data.fileName || 'downloaded-file';

      this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob: Blob | MediaSource) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url); // Clean up
      }, (error: any) => {
        console.error('Error downloading the file:', error);
        this.notifier.notify('error', 'Failed to download file');
      });
    } else {
      this.notifier.notify('error', 'No file content available to download');
    }
  }

  /**
   * View base64 encoded file content - navigates to file viewer
   */
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
      
      // Navigate to internal file viewer with the blob URL
      this.router.navigate(['/fileview'], { queryParams: { fileurl: url } });
    } catch (error) {
      console.error('Error viewing file:', error);
      this.notifier.notify('error', 'Failed to view file');
    }
  }

  /**
   * Download base64 encoded file content
   */
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
      this.notifier.notify('success', 'File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      this.notifier.notify('error', 'Failed to download file');
    }
  }

  /**
   * Get MIME type based on file extension
   */
  getMimeType(fileName: string): string {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
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

  /**
   * Load compliance tracker documents by CompId
   */
  loadComplianceDocuments(compId: string): void {
    this.clientComplianceService.getComplianceTrackerDocuments(compId).subscribe({
      next: (documents: ComplianceTrackerDocument[]) => {
        if (documents && documents.length > 0) {
          this.files = documents.map((doc, index) => ({
            id: index + 1,
            fileName: doc.fileName,
            fullName: doc.fileName,
            compId: doc.compId,
            fileContent: doc.fileContent, // Base64 content for view/download
            createdBy: doc.createdBy,
            isDelete: doc.isDelete,
            createdOn: doc.createdDate,
            fileType: this.getMimeType(doc.fileName)
          }));
        } else {
          this.files = [];
          this.notifier.notify('info', 'No documents found');
        }
      },
      error: (err) => {
        console.error('Error loading compliance documents:', err);
        this.notifier.notify('error', 'Failed to load documents');
        this.files = [];
      }
    });
  }


  // Dropdown for the search filter
  searchFilter = 'Owned by me';
  private modalService = inject(NgbModal);

  folders: any[] = [];
  files: any[] = [];
  //selectedItem: FolderTreeNode | null = null;
  treeData: FolderTreeNode[] = [];

  // treeData: FileTreeNode[] = [
  //   {
  //     label:'COMPSEQR360 FOLDER',
  //     expanded: true,
  //     children: [
  //       {
  //         label: 'Folder1',
  //         expanded: true,
  //         children: [
  //           { label: '94D Filing' },
  //           { label: '94D Payment' }
  //         ]
  //       },
  //       // { label: '94F' },
  //       // { label: '94E' }
  //     ]
  //   },
  //   {
  //     label: 'Income Tax',
  //     expanded: false,
  //     children: [
  //       {
  //         label: 'TDS',
  //         expanded: false,
  //         children: [
  //           { label: '94D Filing' },
  //           { label: '94D Payment' }
  //         ]
  //       },
  //       { label: '94F' },
  //       { label: '94E' }
  //     ]
  //   },
  //   { label: 'Companies Act' },
  //   { label: 'LLP' }
  // ];


  viewAllFiles() {
    console.log('View All Files clicked');
  }

  onSearchInputChange(searchQuery: string) {
    console.log('Search Input:', searchQuery);
    // Implement search logic here
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();

  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.selectedFolderTreeNodeItem) {
      console.log("selected file ==",file);
      this.fileModel.fileName=file.name;
      this.fileModel.fileType = file.type;
      this.fileModel.filePath = file.webkitRelativePath;
      this.fileModel.folderId = this.selectedFolderTreeNodeItem.id;
      this.fileModel.lastModifiedOn = file.lastModified;
      console.log("file details == ",this.fileModel);
      this.uploadFile(file);
    }
  }



  isSelected(item: FolderTreeNode): boolean {
    return this.selectedFolderTreeNodeItem?.id === item.id;
  }

  uploadFile(file: File) {
    this.folderService.uploadFile(this.fileModel,file).subscribe(
      (result: any) => {
        console.log('File successfully uploaded:', result);
        this.getAllFilesbyFolderId(this.selectedFolderId);
        this.notifier.notify('success', 'Uploaded Successfully');
      },
      (error: any) => {
        console.error('Error uploading file:', error);
      }
    );
  }

  getAllFolders(){
    this.folders = [];
    this.folderService.getAllFolders().subscribe((result: any) => {
      result.forEach((element: any) => {

      });
      console.log("folders result == ",result);

      this.folders = result;
    });
  }

  getAllFilesbyFolderId(folderId: number){
    this.files = [];
    this.folderService.getFilesbyFolderId(folderId).subscribe((result: any) => {
      result.forEach((element: any) => {

      });
      console.log("files result == ",result);
      this.files = result;
    },(error: any) => {
      console.error("Error fetching files:", error);
      // You can add additional error handling logic here, such as showing a message to the user
    });
  }
  createSubFolder() {
    if (this.formgroupCreateFolder.valid && this.selectedFolderTreeNodeItem) {
      this.folderModel.folderName = this.formgroupCreateFolder.controls['folderName'].value;
      this.folderModel.isParent = false;
      this.folderModel.entityId =this.selectedEntityId;
      //set zero for primary folder
      this.folderModel.parentId =this.selectedFolderTreeNodeItem.id;
      this.folderService.createFolder(this.folderModel).subscribe(
        (result: any) => {
          this.notifier.notify('success', 'Folder Created Successfully');
          //this.getAllFilesbyFolderId(this.selectedFolderId);
          this.getGetFolderTree(this.selectedEntityId,this.currentUserId);
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

  createPrimaryFolder(){
    if (this.fbCreatePrimaryFolder.valid) {
      this.folderModel.folderName = this.fbCreatePrimaryFolder.controls['primaryFolderName'].value;
      this.folderModel.isParent = true;
      this.folderModel.entityId =this.selectedEntityId;

      this.folderModel.parentId =0;
      this.folderService.createFolder(this.folderModel).subscribe(
        (result: any) => {
          this.notifier.notify('success', 'Folder Created Successfully');
          //this.getAllFilesbyFolderId(this.selectedFolderId);
          this.getGetFolderTree(this.selectedEntityId,this.currentUserId);
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

  // onSubmitCreateFolder() {
  //   if (this.formgroupCreateFolder.valid) {
  //     this.folderModel.folderName = this.createfolderName;
  //     this.folderModel.isPrimary = this.isPrimary;

  //     this.folderService.createFolder(this.folderModel).subscribe(
  //       (result: any) => {
  //         this.notifier.notify('success', 'Folder Created Successfully');
  //         this.getAllFilesbyFolderId(this.selectedFolderId);
  //         this.files = result;
  //       },
  //       (error: any) => {
  //         console.error("Error creating folder:", error);
  //         this.notifier.notify('error', 'Error creating folder. Please try again.');
  //       }
  //     );
  //   } else {
  //     this.notifier.notify('warning', 'Please enter a valid folder name.');
  //   }
  // }


  // Example method to change search filter
  changeSearchFilter(filter: string) {
    this.searchFilter = filter;
    console.log('Search Filter changed to:', this.searchFilter);
  }

  openSm(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true, size: 'md'  });
  }
  open(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true});
  }



  toggle(item: FolderTreeNode,event: Event): void {
    event.stopPropagation();
    item.expanded = !item.expanded;
  }

  selectItem(item: FolderTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedFolderTreeNodeItem = item;
    console.log("selected item ==",this.selectedFolderTreeNodeItem);
    this.buildBreadcrumbPath(item);
    
    // Check if the item has a compId (compliance tracker document)
    // CompId format example: TOC202681R1824
    if (item.fileData?.compId || item.fileData?.cmpId || item.fileData?.typeOfComplianceUID) {
      const compId = item.fileData.compId || item.fileData.cmpId || item.fileData.typeOfComplianceUID;
      console.log("Loading compliance documents for compId:", compId);
      this.loadComplianceDocuments(compId);
    } else {
      // Regular folder - load files by folder ID
      this.getAllFilesbyFolderId(item.id);
    }
  }

  buildBreadcrumbPath(selectedNode: FolderTreeNode): void {
    this.breadcrumbPath = [{ label: 'DMS' }]; // Start with DMS root
    
    // Find the path to the selected node
    const path = this.findNodePath(this.treeData, selectedNode);
    if (path) {
      this.breadcrumbPath = this.breadcrumbPath.concat(path.map(node => ({ label: node.label, node })));
    }
  }

  findNodePath(nodes: FolderTreeNode[], targetNode: FolderTreeNode): FolderTreeNode[] | null {
    for (const node of nodes) {
      if (node.id === targetNode.id) {
        return [node];
      }
      
      if (node.children && node.children.length > 0) {
        const childPath = this.findNodePath(node.children, targetNode);
        if (childPath) {
          return [node, ...childPath];
        }
      }
    }
    return null;
  }

  navigateToBreadcrumb(breadcrumb: { label: string, node?: FolderTreeNode }): void {
    if (breadcrumb.node) {
      this.selectedFolderTreeNodeItem = breadcrumb.node;
      this.buildBreadcrumbPath(breadcrumb.node);
      this.getAllFilesbyFolderId(breadcrumb.node.id);
    } else {
      // Navigate to root (DMS)
      if (this.treeData.length > 0) {
        this.selectedFolderTreeNodeItem = this.treeData[0];
        this.buildBreadcrumbPath(this.treeData[0]);
        this.getAllFilesbyFolderId(this.treeData[0].id);
      }
    }
  }
}
