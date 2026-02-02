import { Component, ElementRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderService } from '../Services/folder.service';
import { FileModel, FolderModel } from '../Models/folderModel';
import { file } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getDate } from 'date-fns';
import { FolderTreeNode } from '../Models/filetreeNode';
import { HttpClient } from '@angular/common/http';
import { PersistenceService } from '../Services/persistence.service';
import { Router } from '@angular/router';

interface ComFolder {
  label: string;
  id: number;
  parentId: number;
  expanded: boolean;
  foldertitle?: string;
  children: ComFolder[];
  isCompseqrRoot?: boolean;
  path?: string[];
  isFile?: boolean;
  fileData?: any;
  sourceId?: number; // Original ID from API for regulations/organizations/announcements
  isToc?: boolean; // Indicates this is a TOC folder
  isCompliance?: boolean; // Indicates this is a Compliance folder
}

@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.scss']
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
    userId: this.persistenceService.getUserId() || 0,
    id: 0,
    entityId: 0
  };
  primaryfolderName: FolderModel= {
    folderName: "",
    isParent: false,
    userId: this.persistenceService.getUserId() || 0,
    parentId:0,
    id: 0,
    entityId: 0
  };

  formgroupCreateFolder!: FormGroup;
  fbCreatePrimaryFolder!: FormGroup;

  selectedEntityId: number =1;
  public columnDefs = [
     { headerName: 'ID', valueGetter: 'node.rowIndex + 1', sortable: true, filter: true },
     { headerName: 'File Name', field: 'fullName',cellRenderer: this.fileCellRenderer.bind(this), sortable: true, filter: true },
     { headerName: 'Folder', field: 'folderName', sortable: true, filter: true },
    { headerName: 'Last modified', field: 'createdOn', sortable: true, filter: true },
    { headerName: 'Owner', field: 'fullName', sortable: true, filter: true },
    // { headerName: 'Access', field: 'filePath', cellRenderer: this.imageRenderer },
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
  sidebarCollapsed: boolean = false; // Add sidebar toggle property
  complianceFolders: any[] = []; // Folders with Files data
  selectedComplianceFolder: any = null; // Selected compliance folder
  complianceFiles: any[] = []; // Files from selected compliance folder

  constructor(private folderService: FolderService,private notifier:NotifierService,private formBuilder: FormBuilder,private http: HttpClient,private persistenceService: PersistenceService,private route:Router) {
    this.formgroupCreateFolder = this.formBuilder.group({
      folderName: ['', Validators.required],
      isParent: [false]
    });
    this.fbCreatePrimaryFolder = this.formBuilder.group({
      primaryFolderName:['',Validators.required]
    })
  }

  ngOnInit() {
    //this.getAllFolders();
    this.getcompdata();
  }
  getGetFolderTree(selectedEntityId: number, currentUserId: any) {
    this.folderService.getGetFolderTree(selectedEntityId, currentUserId).subscribe((result: any) => {
      // Filter out COMPSEQR360 data if present in DMS result
      const filteredResult = Array.isArray(result) ? result.filter((item: any) => 
        (item.label || item.folderName) !== 'COMPSEQR360'
      ) : [];

      // Find ProEDox root
      const dmsRoot = this.treeData.find(n => n.treeType === 'DMS' && n.label === 'ProEDox');
      
      if (dmsRoot) {
        // Update DMS children
        const normalizedDmsNodes = this.normalizeNodes(filteredResult, dmsRoot, 'DMS');
        dmsRoot.children = normalizedDmsNodes;
        this.markTreeType([dmsRoot], 'DMS');
        this.attachParentReferences([dmsRoot]);
      } else {
        // Fallback if DMS root doesn't exist (shouldn't happen if getcompdata ran)
        // But if it does, we might need to rebuild or just do nothing
        console.warn('DMS Root not found during refresh');
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
    const iconSrc = this.getFileIcon(fileType);

    return `<img src="${iconSrc}" style="margin-right: 8px;width: 24px;height: 24px;" alt="file">${fileName}`;
  }

  // Custom cell renderer for the options column
  optionsRenderer(params: any) {
    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-sm btn-outline-secondary btn-view';
    viewButton.innerHTML = '<i class="bi bi-eye"></i>';

    viewButton.addEventListener('click', () => {
      this.onViewClick(params);
    });

    const downloadButton = document.createElement('button');
    downloadButton.className = 'btn btn-sm btn-outline-secondary btn-download';
    downloadButton.innerHTML = '<i class="bi bi-download"></i>';

    downloadButton.addEventListener('click', () => {
      this.onDownloadClick(params);
    });

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
        return 'assets/images/icons/excel.png';
      default:
        return 'assets/images/icons/file.png';
    }
  }

  onClickFolder(folderId: number) {
      this.selectedFolderId= folderId;
  }

  onViewClick(params: any): void {
    const fileData = params.data;
    const entityId = fileData.entityId; // Use entityId (regulation ID, TOC ID, org ID, announcement ID)
    const type = fileData.type || '';
    const subType = fileData.subType || '';

    console.log('View clicked - fileData:', fileData);
    console.log('View clicked - entityId:', entityId, 'type:', type, 'subType:', subType);

    if (entityId && type) {
      // Build URL with query params and open in new tab
      let url = `/fileview?fileId=${entityId}&type=${type}`;
      if (subType) {
        url += `&subType=${subType}`;
      }
      console.log('Opening in new tab:', url);
      window.open(url, '_blank');
    } else if (fileData.filePath) {
      // Fallback: Open file viewer with file path in new tab
      const url = `/fileview?fileurl=${encodeURIComponent(fileData.filePath)}`;
      window.open(url, '_blank');
    } else {
      console.error('No entity ID or path available for viewing');
    }
  }

  onDownloadClick(params: any): void {
    const fileData = params.data;
    const fileName = fileData.fileName || 'downloaded-file';
    const fileContent = fileData.fileContent;
    const fileType = fileData.fileType || 'application/octet-stream';

    if (fileContent) {
      // Download from base64 fileContent
      try {
        // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        let base64Data = fileContent;
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }

        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileType });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file from base64:', error);
      }
    } else if (fileData.filePath) {
      // Fallback: Download from file path URL
      this.http.get(fileData.filePath, { responseType: 'blob' }).subscribe((blob: Blob | MediaSource) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      }, (error: any) => {
        console.error('Error downloading the file:', error);
      });
    } else {
      console.error('No file content or file path available for download');
    }
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
    
  }

  onSearchInputChange(searchQuery: string) {
    
    // Implement search logic here
  }

  triggerFileInput() {
     var path = this.selectedFolderTreeNodeItem?.path;
    if(path && path.includes("COMPSEQR360")){
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
      
      this.fileModel.fileName=file.name;
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
    this.folderService.uploadFile(this.fileModel,file).subscribe(
      (result: any) => {
        // Refresh the current folder's files instead of hardcoded selectedFolderId
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

  getAllFolders(){
    // this.getcompdata();
    this.folders = [];
    this.folderService.getAllFolders().subscribe((result: any) => {
      this.getAllFilesbyFolderId(result[0]?.id);
      

      this.folders = result;
    });
  }

 

  // getcompdata(){
  //   this.folders = [];
  //   this.folderService.getcompleteFolderList().subscribe((result: any) => {
  //     const comFolderTree = this.buildComFolderTree(result);
  //         this.treeData = comFolderTree;
          
  //      this.getGetFolderTree(this.selectedEntityId,this.currentUserId);
  //   });
   
  // }

getcompdata() {
  this.folderService.getcompleteFolderList().subscribe((result: any) => {
    console.log('Organization data received:', result);
    
    // Reset compliance folders array
    this.complianceFolders = [];
    
    // Process compliance items directly from the new data structure
    if (Array.isArray(result)) {
      result.forEach((item: any) => {
        if (this.hasFiles(item)) {
          this.processComplianceItem(item, 'Compliance');
        }
      });
    }

    const compseqrTree = this.buildComFolderTree(result);
    console.log('Built tree structure:', compseqrTree);
    const normalizedCompNodes = this.normalizeNodes(compseqrTree as any, null, 'COMPSEQR360');
    console.log('Normalized comp nodes:', normalizedCompNodes);
    this.markTreeType(normalizedCompNodes, 'COMPSEQR360');
    this.folderService.getGetFolderTree(this.selectedEntityId, this.currentUserId)
      .subscribe({
        next: (dmsResult: any) => {
          this.mergeDmsNodes(normalizedCompNodes, dmsResult);
        },
        error: (err: any) => {
          console.error('Error fetching DMS data', err);
          this.mergeDmsNodes(normalizedCompNodes, []);
        }
      });
  });
}

  mergeDmsNodes(normalizedCompNodes: FolderTreeNode[], dmsResult: any) {
    // Filter out COMPSEQR360 from DMS result to prevent duplication/leakage
    const filteredDmsResult = Array.isArray(dmsResult) ? dmsResult.filter((item: any) => 
      (item.label || item.folderName) !== 'COMPSEQR360'
    ) : [];

    const normalizedDmsNodes = this.normalizeNodes(filteredDmsResult, null, 'DMS');

    const dmsRoot: FolderTreeNode = {
      id: Math.floor(Math.random() * 1e9),
      label: 'ProEDox',
      expanded: true,
      children: normalizedDmsNodes,
      parentId: 0,
      foldertitle: 'ProEDox',
      treeType: 'DMS'  // ✅ root also tagged
    };

    this.markTreeType([dmsRoot], 'DMS');

    this.attachParentReferences(normalizedCompNodes);
    this.attachParentReferences([dmsRoot]);

    this.treeData = [...normalizedCompNodes, dmsRoot];
    if (this.treeData.length > 0) {
      // Select first node if nothing selected, or keep selection logic
      // this.selectedFolderTreeNodeItem = this.treeData[0];
      // this.buildBreadcrumbPath(this.treeData[0]);
    }
  }

markTreeType(nodes: FolderTreeNode[], type: 'DMS' | 'COMPSEQR360') {
  for (const node of nodes) {
    node.treeType = type;
    if (node.children && node.children.length > 0) {
      this.markTreeType(node.children, type);
    }
  }
}

/** Ensure every node has `.parent` set for breadcrumb traversal */
attachParentReferences(nodes: FolderTreeNode[], parent: FolderTreeNode | null = null) {
  if (!nodes) return;
  for (const n of nodes) {
    n.parent = parent || undefined;
    // If parentId also needed, ensure it's set
    if (parent) n.parentId = parent.id;
    if (n.children && n.children.length > 0) {
      this.attachParentReferences(n.children, n);
    }
  }
}


  
  getAllFilesbyFolderId(folderId: number,type:any='proedox'){
    this.files = [];
    this.folderService.getFilesbyFolderId(folderId,type).subscribe((result: any) => {
      result.forEach((element: any) => {

      });
      
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
    
  }

  openSm(content: TemplateRef<any>, type: string = 'subfolder') {
    // Check if DMS is empty when trying to create a subfolder
    if (type === 'subfolder') {
      const dmsRoot = this.findDmsRoot();
      if (!dmsRoot || !dmsRoot.children || dmsRoot.children.length === 0) {
        this.notifier.notify('warning', 'Please create a Primary Folder first.');
        return;
      }
    }

    var path = this.selectedFolderTreeNodeItem?.path;
    if(path && path.includes("COMPSEQR360")){
     alert("Cannot create or upload files to COMPSEQR360 folder.");
     return;
    }
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
  // ✅ Use treeType to ensure we find the correct node in correct tree
  const realNode = this.findNodeById(this.treeData, item.id, item.treeType) || item;

  console.log('selectItem called for:', realNode.label, 'treeType:', realNode.treeType, 'path[0]:', realNode.path?.[0]);

  this.selectedFolderTreeNodeItem = realNode;
  this.buildBreadcrumbPath(realNode);

  if (realNode.isFile && realNode.fileData) {
    console.log('Selected a file:', realNode.label);
    this.files = [{
      ...realNode.fileData,
      fullName: realNode.label
    }];
  } else if (realNode.treeType === 'COMPSEQR360' || (realNode.path && realNode.path[0] === 'COMPSEQR360')) {
    // ✅ Fetch files from API based on folder type (regulation, organization, announcement)
    console.log('Fetching files for COMPSEQR360 node via API');
    this.fetchCompseqrFilesFromApi(realNode);
  } else {
    console.log('Fetching files from API for DMS node');
    this.getAllFilesbyFolderId(realNode.id, this.getModuleType(realNode.path || ''));
  }
}

/**
 * Fetch files from API based on the COMPSEQR360 folder type
 * Supports regulations, organizations, and announcements
 */
fetchCompseqrFilesFromApi(node: FolderTreeNode): void {
  const path = node.path || [];
  console.log('fetchCompseqrFilesFromApi - path:', path, 'foldertitle:', node.foldertitle, 'label:', node.label);

  // Determine the type by checking current node and traversing up parent chain
  const parentType = this.getParentFolderType(node);
  const folderType = (node.foldertitle || '').toLowerCase();
  const pathType = path.length > 1 ? path[1]?.toLowerCase() : '';
  const nodeLabel = (node.label || '').toLowerCase();

  console.log('Determined parentType:', parentType);

  // Check if this is a TOC folder - use isToc flag first, then check by label/path
  const isTocFolder = node.isToc || 
                      this.checkIsTocFromParentChain(node) ||
                      nodeLabel.includes('toc') || 
                      path.some(p => p.toLowerCase().includes('toc')) ||
                      node.foldertitle?.toLowerCase().includes('toc');

  // Check if this is a compliance folder - use isCompliance flag first, then check by label/path
  const isComplianceFolder = node.isCompliance ||
                             this.checkIsComplianceFromParentChain(node) ||
                             nodeLabel.includes('compliance') || 
                             path.some(p => p.toLowerCase().includes('compliance')) ||
                             node.foldertitle?.toLowerCase().includes('compliance');

  // Use parentType if current node's type is not specific enough
  const effectiveType = (folderType === 'regulation' || folderType === 'organization' || folderType === 'announcement') 
    ? folderType 
    : (pathType === 'regulation' || pathType === 'organization' || pathType === 'announcement')
      ? pathType
      : parentType;

  console.log('effectiveType:', effectiveType, 'isTocFolder:', isTocFolder, 'isComplianceFolder:', isComplianceFolder);

  if (effectiveType === 'regulation') {
    // Determine subType and appropriate ID based on the folder being clicked
    let subType: string | undefined;
    let apiId: number;
    
    if (isTocFolder) {
      subType = 'tocdues';
      // For TOC folders, use the TOC item's own sourceId
      apiId = node.sourceId || node.id;
    } else if (isComplianceFolder) {
      subType = 'regulation';
      // For compliance folders, use the compliance item's own sourceId
      apiId = node.sourceId || node.id;
    } else {
      // For regulation root, use the parent regulation ID
      apiId = this.getSourceIdFromParentChain(node);
    }

    // Call regulation API with appropriate subType
    console.log('Calling regulation API with id:', apiId, 'subType:', subType);
    this.folderService.getDataByTypeAndId('regulation', apiId, subType).subscribe({
      next: (result: any) => {
        console.log('Regulation API response:', result);
        this.files = this.extractFilesFromApiResponse(result, node.label, 'regulation', subType, apiId);
      },
      error: (err: any) => {
        console.error('Error fetching regulation data:', err);
        // Fallback to collecting files from node
        this.files = this.collectAllFiles(node);
      }
    });
  } else if (effectiveType === 'organization') {
    // Call organization API - use the node's own sourceId
    const apiId = node.sourceId || this.getSourceIdFromParentChain(node);
    console.log('Calling organization API with id:', apiId);
    this.folderService.getDataByTypeAndId('organization', apiId).subscribe({
      next: (result: any) => {
        console.log('Organization API response:', result);
        this.files = this.extractFilesFromApiResponse(result, node.label, 'organization', undefined, apiId);
      },
      error: (err: any) => {
        console.error('Error fetching organization data:', err);
        // Fallback to collecting files from node
        this.files = this.collectAllFiles(node);
      }
    });
  } else if (effectiveType === 'announcement') {
    // Call announcement API - use the node's own sourceId
    const apiId = node.sourceId || this.getSourceIdFromParentChain(node);
    console.log('Calling announcement API with id:', apiId);
    this.folderService.getDataByTypeAndId('announcement', apiId).subscribe({
      next: (result: any) => {
        console.log('Announcement API response:', result);
        this.files = this.extractFilesFromApiResponse(result, node.label, 'announcement', undefined, apiId);
      },
      error: (err: any) => {
        console.error('Error fetching announcement data:', err);
        // Fallback to collecting files from node
        this.files = this.collectAllFiles(node);
      }
    });
  } else {
    // Fallback: collect all files recursively from the node
    console.log('Fallback: collecting files from node - folderType:', folderType, 'pathType:', pathType, 'parentType:', parentType);
    this.files = this.collectAllFiles(node);
  }
}

/**
 * Get the folder type by traversing up the parent chain
 */
getParentFolderType(node: FolderTreeNode): string {
  let current: FolderTreeNode | undefined = node;
  while (current) {
    const folderTitle = (current.foldertitle || '').toLowerCase();
    if (folderTitle === 'regulation' || folderTitle === 'organization' || folderTitle === 'announcement') {
      return folderTitle;
    }
    // Also check the path
    if (current.path && current.path.length > 1) {
      const pathType = current.path[1]?.toLowerCase();
      if (pathType === 'regulation' || pathType === 'organization' || pathType === 'announcement') {
        return pathType;
      }
    }
    current = current.parent;
  }
  return '';
}

/**
 * Check if this node or any parent is marked as TOC
 */
checkIsTocFromParentChain(node: FolderTreeNode): boolean {
  let current: FolderTreeNode | undefined = node;
  while (current) {
    if (current.isToc) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Check if this node or any parent is marked as Compliance
 */
checkIsComplianceFromParentChain(node: FolderTreeNode): boolean {
  let current: FolderTreeNode | undefined = node;
  while (current) {
    if (current.isCompliance) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Get the source ID by traversing up the parent chain to find the regulation/org/announcement node
 */
getSourceIdFromParentChain(node: FolderTreeNode): number {
  let current: FolderTreeNode | undefined = node;
  while (current) {
    const folderTitle = (current.foldertitle || '').toLowerCase();
    // If this node has a sourceId and is a main category type, return it
    if (current.sourceId && (folderTitle === 'regulation' || folderTitle === 'organization' || folderTitle === 'announcement')) {
      return current.sourceId;
    }
    // Check path to determine if this is the main item
    if (current.path && current.path.length === 3 && current.sourceId) {
      // Path like ['COMPSEQR360', 'Regulation', 'ItemName'] indicates the main regulation item
      return current.sourceId;
    }
    current = current.parent;
  }
  // Fallback to current node's sourceId or id
  return node.sourceId || node.id;
}

/**
 * Extract files from API response
 * @param response - API response
 * @param folderName - Name of the folder
 * @param type - Type: 'regulation', 'organization', 'announcement'
 * @param subType - SubType for regulations: 'regulation', 'tocdues'
 * @param entityId - The ID of the entity (regulation ID, TOC ID, organization ID, announcement ID)
 */
extractFilesFromApiResponse(response: any, folderName: string, type?: string, subType?: string, entityId?: number): any[] {
  const files: any[] = [];
  
  if (!response) return files;

  // Helper to add type, subType, and entityId to file object
  const addFileWithType = (file: any, folder: string) => {
    console.log('Adding file with type:', type, 'subType:', subType, 'entityId:', entityId, 'file:', file.fileName);
    files.push({
      ...file,
      folderName: folder,
      fullName: file.fileName,
      type: type || '',
      subType: subType || '',
      entityId: entityId
    });
  };

  // Handle response with success flag and direct files array
  if (response.success && Array.isArray(response.files)) {
    response.files.forEach((file: any) => {
      addFileWithType(file, folderName);
    });
    return files;
  }

  // Handle direct files array (without success flag)
  if (Array.isArray(response.files)) {
    response.files.forEach((fileFolder: any) => {
      // Check if it's a direct file object or a folder containing files
      if (fileFolder.fileName && !fileFolder.files) {
        // Direct file object
        addFileWithType(fileFolder, folderName);
      } else if (Array.isArray(fileFolder.files)) {
        // Folder containing files
        fileFolder.files.forEach((file: any) => {
          addFileWithType(file, fileFolder.folderName || folderName);
        });
      }
    });
  }

  // Handle array response directly
  if (Array.isArray(response)) {
    response.forEach((item: any) => {
      if (item.files && Array.isArray(item.files)) {
        item.files.forEach((fileFolder: any) => {
          if (Array.isArray(fileFolder.files)) {
            fileFolder.files.forEach((file: any) => {
              addFileWithType(file, fileFolder.folderName || folderName);
            });
          }
        });
      }
      if (item.fileName) {
        addFileWithType(item, folderName);
      }
    });
  }

  // Handle nested data structures (for regulations with compliance/toc)
  if (response.compliance && Array.isArray(response.compliance)) {
    response.compliance.forEach((comp: any) => {
      if (comp.files && Array.isArray(comp.files)) {
        comp.files.forEach((fileFolder: any) => {
          if (Array.isArray(fileFolder.files)) {
            fileFolder.files.forEach((file: any) => {
              addFileWithType(file, fileFolder.folderName || comp.complianceName || folderName);
            });
          }
        });
      }
    });
  }

  if (response.toc && Array.isArray(response.toc)) {
    response.toc.forEach((tocItem: any) => {
      if (tocItem.files && Array.isArray(tocItem.files)) {
        tocItem.files.forEach((fileFolder: any) => {
          if (Array.isArray(fileFolder.files)) {
            fileFolder.files.forEach((file: any) => {
              addFileWithType(file, fileFolder.folderName || tocItem.tocName || folderName);
            });
          }
        });
      }
    });
  }

  // Handle entity list (for organizations)
  if (response.entityList && Array.isArray(response.entityList)) {
    response.entityList.forEach((entity: any) => {
      if (entity.files && Array.isArray(entity.files)) {
        entity.files.forEach((fileFolder: any) => {
          if (Array.isArray(fileFolder.files)) {
            fileFolder.files.forEach((file: any) => {
              addFileWithType(file, fileFolder.folderName || entity.entityName || folderName);
            });
          }
        });
      }
    });
  }

  console.log('Extracted files:', files.length);
  return files;
}

collectAllFiles(node: FolderTreeNode): any[] {
  let files: any[] = [];
  console.log('collectAllFiles for node:', node.label, 'Children:', node.children?.length);
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      console.log('  Child:', child.label, 'isFile:', child.isFile, 'hasFileData:', !!child.fileData);
      if (child.isFile && child.fileData) {
        files.push({
          ...child.fileData,
          folderName: node.label, // Parent folder name
          fullName: child.label
        });
      } else {
        files = [...files, ...this.collectAllFiles(child)];
      }
    }
  }
  console.log('collectAllFiles returning', files.length, 'files');
  return files;
}



  getModuleType(label: any): string {
   if (label.includes("COMPSEQR360") && label.length > 1) {
  return label[1]?.toLowerCase();
} else if (label.includes("COMPSEQR360") && label.length === 1) {
  return label[0]?.toLowerCase();
} else {
  return label[0]?.toLowerCase();
}

  // if (label.includes(lower)) {
  //   return lower;
  // } else {
  //   return 'Dms';
  // }
}

findNodeById(nodes: FolderTreeNode[], id: number, treeType?: 'DMS' | 'COMPSEQR360'): FolderTreeNode | null {
  if (!nodes) return null;
  for (const n of nodes) {
    // ✅ Match both ID and treeType if provided
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

  // For COMPSEQR360 nodes with pre-built paths
  if (node.path && Array.isArray(node.path)) {
    this.breadcrumbPath = node.path.map((label: string, i: number) => ({
      label,
      node: i === node.path.length - 1 ? selectedNode : undefined
    }));
    return;
  }

  // For DMS and other nodes
  const path: FolderTreeNode[] = [];
  let current: FolderTreeNode | undefined = selectedNode;

  // Build path from current node to root
  while (current) {
    path.unshift(current);
    current = current.parent;
  }

  // Determine if this is a ProEDox path
  const isDmsPath = !path.some(n => 
    (n.foldertitle || '').toLowerCase() === 'compseqr360' ||
    n.label.toLowerCase() === 'compseqr360'
  );

  if (isDmsPath) {
    // For ProEDox paths, add ProEDox as root if not already present
    const hasDmsRoot = path.some(n => n.label.toLowerCase() === 'proedox');
    if (!hasDmsRoot) {
      const dmsRoot = this.findDmsRoot();
      if (dmsRoot) {
        this.breadcrumbPath.push({ 
          label: 'ProEDox', 
          node: dmsRoot 
        });
      } else {
        this.breadcrumbPath.push({ label: 'ProEDox' });
      }
    }

    // Add all folders in path except duplicate ProEDox entries
    path.forEach(n => {
      if (n.label.toLowerCase() !== 'proedox' || path.indexOf(n) === 0) {
        this.breadcrumbPath.push({
          label: n.label,
          node: n
        });
      }
    });
  } else {
    // For COMPSEQR360 related paths, add all nodes as is
    path.forEach(n => this.breadcrumbPath.push({
      label: n.label,
      node: n
    }));
  }
}





normalizeNodes(
  items: any[],
  parent: FolderTreeNode | null = null,
  foldertitle?: string
): FolderTreeNode[] {
  console.log('normalizeNodes called with', items?.length, 'items, foldertitle:', foldertitle);
  const out: FolderTreeNode[] = [];

  for (const item of items || []) {
    const id =
      typeof item.id === 'number' && item.id > 0
        ? item.id
        : Math.floor(Math.random() * 1e9);

    // Preserve the original sourceId for API calls
    const sourceId = item.sourceId || item.regulationId || item.organizationId || item.announcementId || item.id;

    const label =
      item.label ||
      item.folderName ||
      item.regulationName ||
      item.organizationName ||
      item.entityName ||
      `Item_${id}`;

    console.log('  Normalizing:', label, 'hasChildren:', !!item.children?.length, 'sourceId:', sourceId, 'isToc:', item.isToc, 'isCompliance:', item.isCompliance);

    const node: FolderTreeNode = {
      id,
      label,
      expanded: !!item.expanded,
      children: [],
      parentId: parent ? parent.id : 0,
      parent: parent || undefined,
      foldertitle: foldertitle || item.foldertitle,
      path: [],
      isFile: item.isFile,
      fileData: item.fileData,
      sourceId: sourceId, // Preserve original ID for API calls
      isToc: item.isToc || false, // Preserve TOC flag
      isCompliance: item.isCompliance || false // Preserve Compliance flag
    };

    // 🟢 Build proper breadcrumb path for both DMS & COMPSEQR360
    const parentPath = parent?.path || [];
    if ((foldertitle || '').toLowerCase() === 'dms') {
      // Ensure path starts with ProEDox
      node.path = parentPath.length > 0 ? [...parentPath, label] : ['ProEDox', label];
    } else if (item.path && Array.isArray(item.path)) {
      // COMPSEQR360 path from API
      node.path = [...item.path];
    } else {
      // Fallback (like DMS children)
      node.path = parentPath.length > 0 ? [...parentPath, label] : [label];
    }

    // Recurse into children
    const children =
      item.children || item.compliance || item.toc || item.entityList || [];
    if (children && children.length > 0) {
      node.children = this.normalizeNodes(children, node, node.foldertitle);
    }

    out.push(node);
  }

  return out;
}




/** ✅ Navigate to breadcrumb click */
navigateToBreadcrumb(breadcrumb: { label: string; node?: FolderTreeNode }): void {
  // If no node (like root ProEDox), reset to initial ProEDox view
  if (!breadcrumb.node) {
    const dmsRoot = this.findDmsRoot();
    if (dmsRoot) {
      this.selectedFolderTreeNodeItem = dmsRoot;
      this.buildBreadcrumbPath(dmsRoot);
      this.getAllFilesbyFolderId(dmsRoot.id, 'Dms');
    }
    return;
  }

  // Find the actual node in our tree structure
  const actualNode = this.findNodeById(this.treeData, breadcrumb.node.id) || breadcrumb.node;
  
  this.selectedFolderTreeNodeItem = actualNode;
  this.buildBreadcrumbPath(actualNode);
  this.getAllFilesbyFolderId(
    actualNode.id,
    this.getModuleType(actualNode.foldertitle || '')
  );
}

// Helper method to find DMS root node
findDmsRoot(): FolderTreeNode | null {
  return this.treeData.find(node => 
    node.label.toLowerCase() === 'dms' || 
    (node.foldertitle || '').toLowerCase() === 'dms'
  ) || null;
}


//start filters

 comfolders: ComFolder[] = [];
 folderId = 1;
 
  buildNestedComFolders(items: any[], parentId: number, foldertitle: any, parentPath: string[] = [], isToc: boolean = false, isCompliance: boolean = false): ComFolder[] {
  const result: ComFolder[] = [];

  items.forEach(item => {
    const currentId = this.folderId++;
    const label = item.complianceName || item.tocName || item.regulationName || item.nameOfToc || `Item_${item.id}`;
    const currentPath = [...parentPath, label];
    
    const folder: ComFolder = {
      label,
      id: currentId,
      parentId,
      expanded: false,
      children: [],
      foldertitle: foldertitle,
      path: currentPath,
      sourceId: item.id || item.complianceId || item.tocId || item.regulationId, // Preserve original ID for API calls
      isToc: isToc || !!item.tocName || !!item.tocId || !!item.nameOfToc, // Mark as TOC if coming from toc array or has toc properties
      isCompliance: isCompliance || !!item.complianceName || !!item.complianceId // Mark as Compliance if coming from compliance array
    };

    // Recursively process deeper levels (compliance/toc for old structure, files for new structure)
    if (Array.isArray(item.compliance) && item.compliance.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.compliance, currentId, foldertitle, currentPath, false, true));
    }

    if (Array.isArray(item.toc) && item.toc.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.toc, currentId, foldertitle, currentPath, true, false));
    }

    // Handle new structure with files array (folders containing files)
    const filesArray = item.files || item.Files;
    if (Array.isArray(filesArray) && filesArray.length > 0) {
      filesArray.forEach((subFolder: any) => {
        const subFolderId = this.folderId++;
        const subFolderNode: ComFolder = {
          label: subFolder.folderName || 'Files',
          id: subFolderId,
          parentId: currentId,
          expanded: false,
          children: [],
          foldertitle: foldertitle,
          path: [...currentPath, subFolder.folderName || 'Files'],
          isToc: folder.isToc, // Inherit from parent
          isCompliance: folder.isCompliance // Inherit from parent
        };

        // Process actual files inside the subfolder
        const subFiles = subFolder.files || subFolder.Files;
        if (Array.isArray(subFiles) && subFiles.length > 0) {
          subFiles.forEach((file: any) => {
            const fileId = this.folderId++;
            const fileNode: ComFolder = {
              label: file.fileName,
              id: fileId,
              parentId: subFolderId,
              expanded: false,
              children: [],
              foldertitle: foldertitle,
              path: [...currentPath, subFolder.folderName || 'Files', file.fileName],
              isFile: true,
              fileData: file,
              isToc: folder.isToc, // Inherit from parent
              isCompliance: folder.isCompliance // Inherit from parent
            };
            subFolderNode.children.push(fileNode);
          });
        }

        folder.children.push(subFolderNode);
      });
    }

    result.push(folder);
  });

  return result;
}

/**
 * Builds the full nested structure as a tree.
 */
  buildComFolderTree(data: any) {
  console.log('buildComFolderTree called with data:', data);
  console.log('Is array?', Array.isArray(data));
  console.log('Length > 0?', Array.isArray(data) && data.length > 0);
  console.log('Has organizationName?', Array.isArray(data) && data.length > 0 && data[0].organizationName);
  
  const rootId = this.folderId++;

  const rootFolder: ComFolder = {
    label: "COMPSEQR360",
    id: rootId,
    parentId: 0,
    expanded: false,
    foldertitle: "COMPSEQR360",
    children: [],
    path: ["COMPSEQR360"]
  };

  // Handle new data structure - array of organizations with files and entities
  const isOrgStructure = Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('organizationName');
  console.log('isOrgStructure:', isOrgStructure, 'data[0]:', data[0]);
  
  if (isOrgStructure) {
    // Organization Root
    const orgId = this.folderId++;
    const orgFolder: ComFolder = {
      label: "Organization",
      id: orgId,
      parentId: rootId,
      expanded: true,  // Set to true to show organizations by default
      children: [],
      foldertitle: "Organization",
      path: ["COMPSEQR360", "Organization"]
    };

    // Add organizations
    data.forEach((org: any) => {
      // Only add organizations marked as isOrganization: true
      if (!org.isOrganization) {
        console.log('Skipping non-organization:', org.organizationName);
        return;
      }

      console.log('Processing organization:', org.organizationName, 'Files:', org.files?.length || 0, 'Entities:', org.entityList?.length || 0);

      const orgFolderId = this.folderId++;
      const orgItem: ComFolder = {
        label: org.organizationName,
        id: orgFolderId,
        parentId: orgId,
        expanded: true,  // Expanded to show files and entities
        children: [],
        foldertitle: "Organization",
        path: ["COMPSEQR360", "Organization", org.organizationName],
        sourceId: org.id || org.organizationId // Preserve original ID for API calls
      };

      // Process organization files
      if (Array.isArray(org.files) && org.files.length > 0) {
        console.log('Organization has files:', org.organizationName, org.files.length);
        org.files.forEach((fileFolder: any) => {
          console.log('  Processing file folder:', fileFolder.folderName, 'with', fileFolder.files?.length || 0, 'files');
          const fileFolderId = this.folderId++;
          const fileFolderNode: ComFolder = {
            label: fileFolder.folderName || 'Organization Files',
            id: fileFolderId,
            parentId: orgFolderId,
            expanded: false,
            children: [],
            foldertitle: "Organization",
            path: ["COMPSEQR360", "Organization", org.organizationName, fileFolder.folderName]
          };

          // Add files inside the folder
          if (Array.isArray(fileFolder.files) && fileFolder.files.length > 0) {
            fileFolder.files.forEach((file: any) => {
              const fileId = this.folderId++;
              const fileNode: ComFolder = {
                label: file.fileName,
                id: fileId,
                parentId: fileFolderId,
                expanded: false,
                children: [],
                foldertitle: "Organization",
                path: ["COMPSEQR360", "Organization", org.organizationName, fileFolder.folderName, file.fileName],
                isFile: true,
                fileData: file
              };
              fileFolderNode.children.push(fileNode);
            });
          }

          orgItem.children.push(fileFolderNode);
        });
      }

      // Process entities
      if (Array.isArray(org.entityList) && org.entityList.length > 0) {
        org.entityList.forEach((entity: any) => {
          const entityId = this.folderId++;
          const entityNode: ComFolder = {
            label: entity.entityName,
            id: entityId,
            parentId: orgFolderId,
            expanded: false,
            children: [],
            foldertitle: "Organization",
            path: ["COMPSEQR360", "Organization", org.organizationName, entity.entityName]
          };

          // Process entity files
          if (Array.isArray(entity.files) && entity.files.length > 0) {
            entity.files.forEach((entityFileFolder: any) => {
              const entityFileFolderId = this.folderId++;
              const entityFileFolderNode: ComFolder = {
                label: entityFileFolder.folderName || 'Entity Files',
                id: entityFileFolderId,
                parentId: entityId,
                expanded: false,
                children: [],
                foldertitle: "Organization",
                path: ["COMPSEQR360", "Organization", org.organizationName, entity.entityName, entityFileFolder.folderName]
              };

              // Add files inside entity folder
              if (Array.isArray(entityFileFolder.files) && entityFileFolder.files.length > 0) {
                entityFileFolder.files.forEach((file: any) => {
                  const fileId = this.folderId++;
                  const fileNode: ComFolder = {
                    label: file.fileName,
                    id: fileId,
                    parentId: entityFileFolderId,
                    expanded: false,
                    children: [],
                    foldertitle: "Organization",
                    path: ["COMPSEQR360", "Organization", org.organizationName, entity.entityName, entityFileFolder.folderName, file.fileName],
                    isFile: true,
                    fileData: file
                  };
                  entityFileFolderNode.children.push(fileNode);
                });
              }

              entityNode.children.push(entityFileFolderNode);
            });
          }

          orgItem.children.push(entityNode);
        });
      }

      orgFolder.children.push(orgItem);
    });

    rootFolder.children.push(orgFolder);
  } else if (Array.isArray(data)) {
    // Handle old compliance data structure (array of compliance items)
    const complianceId = this.folderId++;
    const complianceFolder: ComFolder = {
      label: "Compliance",
      id: complianceId,
      parentId: rootId,
      expanded: false,
      children: [],
      foldertitle: "Compliance",
      path: ["COMPSEQR360", "Compliance"]
    };

    // Add compliance items
    data.forEach((item: any) => {
      const itemId = this.folderId++;
      const itemFolder: ComFolder = {
        label: item.nameOfToc || `Compliance_${item.id}`,
        id: itemId,
        parentId: complianceId,
        expanded: false,
        children: [],
        foldertitle: "Compliance",
        path: ["COMPSEQR360", "Compliance", item.nameOfToc]
      };

      // Process files for this item
      const filesArray = item.files || item.Files;
      if (Array.isArray(filesArray) && filesArray.length > 0) {
        filesArray.forEach((subFolder: any) => {
          const subFolderId = this.folderId++;
          const subFolderNode: ComFolder = {
            label: subFolder.folderName || 'Files',
            id: subFolderId,
            parentId: itemId,
            expanded: false,
            children: [],
            foldertitle: "Compliance",
            path: ["COMPSEQR360", "Compliance", item.nameOfToc, subFolder.folderName || 'Files']
          };

          // Process actual files inside the subfolder
          const subFiles = subFolder.files || subFolder.Files;
          if (Array.isArray(subFiles) && subFiles.length > 0) {
            subFiles.forEach((file: any) => {
              const fileId = this.folderId++;
              const fileNode: ComFolder = {
                label: file.fileName,
                id: fileId,
                parentId: subFolderId,
                expanded: false,
                children: [],
                foldertitle: "Compliance",
                path: ["COMPSEQR360", "Compliance", item.nameOfToc, subFolder.folderName || 'Files', file.fileName],
                isFile: true,
                fileData: file
              };
              subFolderNode.children.push(fileNode);
            });
          }
          itemFolder.children.push(subFolderNode);
        });
      }

      // Only add to tree if it has files (for display purposes)
      if (this.hasFiles(item)) {
        complianceFolder.children.push(itemFolder);
      }
    });

    rootFolder.children.push(complianceFolder);
  } else {
    // Handle old data structure for backward compatibility (object with regulation, organization, announcement)
    // Regulation Root
    const regulationId = this.folderId++;
    const regulationFolder: ComFolder = {
      label: "Regulation",
      id: regulationId,
      parentId: rootId,
      expanded: false,
      children: [],
      foldertitle: "Regulation",
      path: ["COMPSEQR360", "Regulation"]
    };

    // Add regulations
    (data.regulation || []).forEach((reg: any) => {
      const regId = this.folderId++;
      const regFolder: ComFolder = {
        label: reg.regulationName,
        id: regId,
        foldertitle:"Regulation",
        parentId: regulationId,
        expanded: false,
        children: [],
        sourceId: reg.id || reg.regulationId // Preserve original ID for API calls
      };

      if (Array.isArray(reg.compliance) && reg.compliance.length > 0) {
        regFolder.children.push(...this.buildNestedComFolders(reg.compliance, regId,"Regulation"));
      }

      if (Array.isArray(reg.toc) && reg.toc.length > 0) {
        regFolder.children.push(...this.buildNestedComFolders(reg.toc, regId,"Regulation"));
      }

      regulationFolder.children.push(regFolder);
    });

    // Organization Root
    const orgId = this.folderId++;
    const orgFolder: ComFolder = {
      label: "Organization",
      id: orgId,
      parentId: rootId,
      expanded: false,
      children: [],
      foldertitle: "Organization",
      path: ["COMPSEQR360", "Organization"]
    };

    // Add organizations and entities
    (data.organization || []).forEach((org: any) => {
      if (org && org.isOrganization === false) {
        return;
      }

      const orgFolderId = this.folderId++;
      const orgPath = ["COMPSEQR360", "Organization", org.organizationName];
      const orgItem: ComFolder = {
        label: org.organizationName,
        id: orgFolderId,
        parentId: orgId,
        expanded: (org.files && org.files.length) || (org.entityList && org.entityList.length) ? true : false,
        children: [],
        foldertitle: "Organization",
        path: orgPath,
        sourceId: org.id || org.organizationId // Preserve original ID for API calls
      };

      // Organization level files
      if (Array.isArray(org.files) && org.files.length > 0) {
        org.files.forEach((fileFolder: any) => {
          const fileFolderId = this.folderId++;
          const folderLabel = fileFolder.folderName || 'Organization Files';
          const folderPath = [...orgPath, folderLabel];

          const fileFolderNode: ComFolder = {
            label: folderLabel,
            id: fileFolderId,
            parentId: orgFolderId,
            expanded: false,
            children: [],
            foldertitle: "Organization",
            path: folderPath
          };

          if (Array.isArray(fileFolder.files) && fileFolder.files.length > 0) {
            fileFolder.files.forEach((file: any) => {
              const fileId = this.folderId++;
              const filePath = [...folderPath, file.fileName];
              const fileNode: ComFolder = {
                label: file.fileName,
                id: fileId,
                parentId: fileFolderId,
                expanded: false,
                children: [],
                foldertitle: "Organization",
                path: filePath,
                isFile: true,
                fileData: file
              };
              fileFolderNode.children.push(fileNode);
            });
          }

          orgItem.children.push(fileFolderNode);
        });
      }

      // Entity level files
      if (Array.isArray(org.entityList) && org.entityList.length > 0) {
        org.entityList.forEach((ent: any) => {
          const entId = this.folderId++;
          const entityPath = [...orgPath, ent.entityName];
          const entityNode: ComFolder = {
            label: ent.entityName,
            id: entId,
            parentId: orgFolderId,
            expanded: Array.isArray(ent.files) && ent.files.length > 0,
            children: [],
            foldertitle: "Organization",
            path: entityPath
          };

          if (Array.isArray(ent.files) && ent.files.length > 0) {
            ent.files.forEach((entityFolder: any) => {
              const entityFolderId = this.folderId++;
              const entityFolderLabel = entityFolder.folderName || 'Entity Files';
              const entityFolderPath = [...entityPath, entityFolderLabel];

              const entityFolderNode: ComFolder = {
                label: entityFolderLabel,
                id: entityFolderId,
                parentId: entId,
                expanded: false,
                children: [],
                foldertitle: "Organization",
                path: entityFolderPath
              };

              if (Array.isArray(entityFolder.files) && entityFolder.files.length > 0) {
                entityFolder.files.forEach((file: any) => {
                  const fileId = this.folderId++;
                  const entityFilePath = [...entityFolderPath, file.fileName];
                  const fileNode: ComFolder = {
                    label: file.fileName,
                    id: fileId,
                    parentId: entityFolderId,
                    expanded: false,
                    children: [],
                    foldertitle: "Organization",
                    path: entityFilePath,
                    isFile: true,
                    fileData: file
                  };
                  entityFolderNode.children.push(fileNode);
                });
              }

              entityNode.children.push(entityFolderNode);
            });
          }

          orgItem.children.push(entityNode);
        });
      }

      orgFolder.children.push(orgItem);
    });

    // Announcement Root
    const announcementId = this.folderId++;
    const announcementFolder: ComFolder = {
      label: "Announcement",
      id: announcementId,
      parentId: rootId,
      expanded: false,
      children: [],
      foldertitle: "Announcement",
      path: ["COMPSEQR360", "Announcement"]
    };

    // Group announcements by regulation name from data.announcement array
    // Structure: Announcement -> Regulation Name -> Announcement Subjects
    const announcementsByRegulation: { [key: string]: any[] } = {};
    
    console.log('Processing announcements, total count:', (data.announcement || []).length);
    
    // First, group announcements by regulationName
    (data.announcement || []).forEach((ann: any, index: number) => {
      const regName = ann.regulationName || 'Unknown';
      if (!announcementsByRegulation[regName]) {
        announcementsByRegulation[regName] = [];
      }
      
      // Check if this item has nested announcements array
      if (Array.isArray(ann.announcements) && ann.announcements.length > 0) {
        // Nested structure: push all nested announcements
        announcementsByRegulation[regName].push(...ann.announcements);
        console.log(`Announcement ${index}: ${regName} has ${ann.announcements.length} nested announcements`);
      } else if (ann.subject || ann.id) {
        // Flat structure: this item IS the announcement itself
        announcementsByRegulation[regName].push(ann);
        console.log(`Announcement ${index}: ${regName} - ${ann.subject || ann.id}`);
      }
    });

    console.log('Announcements grouped by regulation:', announcementsByRegulation);
    
    // Count total announcements
    let totalAnnouncements = 0;
    Object.keys(announcementsByRegulation).forEach(key => {
      totalAnnouncements += announcementsByRegulation[key].length;
    });
    console.log('Total announcements to display:', totalAnnouncements);

    // Create folder structure for each regulation that has announcements
    Object.keys(announcementsByRegulation).forEach((regName: string) => {
      const announcements = announcementsByRegulation[regName];
      if (announcements.length > 0) {
        const regFolderId = this.folderId++;
        const regFolder: ComFolder = {
          label: regName,
          id: regFolderId,
          parentId: announcementId,
          expanded: false,
          children: [],
          foldertitle: "Announcement",
          path: ["COMPSEQR360", "Announcement", regName]
        };

        // Add announcement subjects under the regulation folder
        announcements.forEach((ann: any) => {
          const annId = this.folderId++;
          const annFolder: ComFolder = {
            label: ann.subject || `Announcement_${ann.id}`,
            id: annId,
            parentId: regFolderId,
            expanded: false,
            children: [],
            foldertitle: "Announcement",
            sourceId: ann.id,
            path: ["COMPSEQR360", "Announcement", regName, ann.subject]
          };
          regFolder.children.push(annFolder);
        });

        announcementFolder.children.push(regFolder);
      }
    });

    console.log('Announcement folder children:', announcementFolder.children.length);

    // Attach main sections to root
    rootFolder.children.push(regulationFolder);
    rootFolder.children.push(orgFolder);
    rootFolder.children.push(announcementFolder);
  }
  
  // Return full tree
  return [rootFolder];
}



  /**
   * Check if an item has files data
   */
  hasFiles(item: any): boolean {
    return (Array.isArray(item.files) && item.files.length > 0) || (Array.isArray(item.Files) && item.Files.length > 0);
  }

  /**
   * Process compliance item with files
   */
  processComplianceItem(item: any, category: string): void {
    const complianceFolder = {
      id: item.id,
      name: item.nameOfToc || item.complianceName || item.tocName,
      category: category,
      folders: item.files.map((folder: any) => ({
        ...folder,
        expanded: false  // Add expansion state
      })),
      totalFiles: this.getTotalFilesCount(item.files),
      expanded: false  // Add expansion state for main folder
    };

    // Check if already exists
    const existingIndex = this.complianceFolders.findIndex(cf => cf.id === item.id && cf.category === category);
    if (existingIndex >= 0) {
      this.complianceFolders[existingIndex] = complianceFolder;
    } else {
      this.complianceFolders.push(complianceFolder);
    }
  }

  /**
   * Get total files count from folders
   */
  getTotalFilesCount(folders: any[]): number {
    if (!Array.isArray(folders)) return 0;
    
    return folders.reduce((total, folder) => {
      if (Array.isArray(folder.files)) {
        return total + folder.files.length;
      }
      return total;
    }, 0);
  }

  /**
   * Select compliance folder and load its files
   */
  selectComplianceFolder(complianceFolder: any): void {
    this.selectedComplianceFolder = complianceFolder;
    this.complianceFiles = [];

    // Extract all files from the compliance folder's subfolders
    if (Array.isArray(complianceFolder.folders)) {
      complianceFolder.folders.forEach((folder: any) => {
        if (Array.isArray(folder.files)) {
          folder.files.forEach((file: any) => {
            this.complianceFiles.push({
              ...file,
              folderName: folder.folderName,
              fullName: `${folder.folderName}/${file.fileName}`
            });
          });
        }
      });
    }

    // Update ag-grid with compliance files
    this.files = this.complianceFiles;
    
    // Clear normal folder selection to avoid breadcrumb conflicts
    this.selectedFolderTreeNodeItem = null;
  }

  /**
   * Clear compliance selection and return to normal folder view
   */
  clearComplianceSelection(): void {
    this.selectedComplianceFolder = null;
    this.complianceFiles = [];
    // Reload normal files if a folder is selected
    if (this.selectedFolderTreeNodeItem) {
      this.getAllFilesbyFolderId(this.selectedFolderTreeNodeItem.id);
    }
  }

  /**
   * Check if current view is showing compliance files
   */
  isComplianceView(): boolean {
    return this.selectedComplianceFolder !== null;
  }

  /**
   * Toggle compliance folder expansion
   */
  toggleComplianceFolder(complianceFolder: any): void {
    complianceFolder.expanded = !complianceFolder.expanded;
    
    // If expanding, collapse other compliance folders
    if (complianceFolder.expanded) {
      this.complianceFolders.forEach(folder => {
        if (folder.id !== complianceFolder.id) {
          folder.expanded = false;
          // Also collapse subfolders
          folder.folders.forEach((subfolder: any) => {
            subfolder.expanded = false;
          });
        }
      });
    }
  }

  /**
   * Toggle subfolder expansion
   */
  toggleSubfolder(subfolder: any): void {
    subfolder.expanded = !subfolder.expanded;
  }

  /**
   * Select a file and show it in the main grid
   */
  selectFile(file: any, subfolder: any, complianceFolder: any): void {
    // Create a single-file array for the grid
    this.files = [{
      ...file,
      folderName: subfolder.folderName,
      fullName: `${complianceFolder.name}/${subfolder.folderName}/${file.fileName}`
    }];
    
    // Update selected state
    this.selectedComplianceFolder = complianceFolder;
    
    // Clear normal folder selection to avoid breadcrumb conflicts
    this.selectedFolderTreeNodeItem = null;
  }

 //end
}
