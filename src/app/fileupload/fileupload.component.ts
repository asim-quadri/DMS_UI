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

      // Find DMS root
      const dmsRoot = this.treeData.find(n => n.treeType === 'DMS' && n.label === 'DMS');
      
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

    return `<img src="${iconSrc}" style="margin-right: 8px;" alt="file">${fileName}`;
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
        return '../assets/images/icons/pdf.png';
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        return '../assets/images/icons/google.png';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return '../assets/images/icons/excel.png';
      default:
        return '../assets/images/icons/file.png';
    }
  }

  onClickFolder(folderId: number) {
      this.selectedFolderId= folderId;
  }

  onViewClick(params: any): void {
    // const imagePath = params.data.filePath;
    // const fileName = params.data.fileName || 'downloaded-image.jpg';
    // const link = document.createElement('a');
    // link.href = imagePath;
    // link.download = fileName;

    // document.body.appendChild(link);

    // link.click();

    // document.body.removeChild(link);
    const imagePath = params.data.filePath;
    this.route.navigate(['/fileview'], { queryParams: { fileurl: imagePath } });
  }

  onDownloadClick(params: any): void {
    const imagePath = params.data.filePath;
    
    const fileName = params.data.fileName || 'downloaded-image.jpg';

  this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob: Blob | MediaSource) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url); // Clean up
  }, (error: any) => {
    console.error('Error downloading the image:', error);
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
        
        this.getAllFilesbyFolderId(this.selectedFolderId);
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
    const normalizedCompNodes = this.normalizeNodes(compseqrTree as any, null, 'COMPSEQR360');
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


  
  getAllFilesbyFolderId(folderId: number,type:any='Dms'){
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

  this.selectedFolderTreeNodeItem = realNode;
  this.buildBreadcrumbPath(realNode);

  if (realNode.isFile && realNode.fileData) {
    this.files = [{
      ...realNode.fileData,
      fullName: realNode.label
    }];
  } else if (realNode.treeType === 'COMPSEQR360' || (realNode.path && realNode.path[0] === 'COMPSEQR360')) {
    // ✅ Recursively collect all files for COMPSEQR360 folders
    this.files = this.collectAllFiles(realNode);
  } else {
    this.getAllFilesbyFolderId(realNode.id, this.getModuleType(realNode.path || ''));
  }
}

collectAllFiles(node: FolderTreeNode): any[] {
  let files: any[] = [];
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
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
  // Don't show breadcrumbs for compliance view (COMPSEQR360 tree)
  if (selectedNode && (selectedNode.treeType === 'COMPSEQR360' || (selectedNode.path && selectedNode.path[0] === 'COMPSEQR360'))) {
    this.breadcrumbPath = [];
    return;
  }

  if (!selectedNode) {
    this.breadcrumbPath = [{ label: 'DMS' }];
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

  // Determine if this is a DMS path
  const isDmsPath = !path.some(n => 
    (n.foldertitle || '').toLowerCase() === 'compseqr360' ||
    n.label.toLowerCase() === 'compseqr360'
  );

  if (isDmsPath) {
    // For DMS paths, add DMS as root if not already present
    const hasDmsRoot = path.some(n => n.label.toLowerCase() === 'dms');
    if (!hasDmsRoot) {
      const dmsRoot = this.findDmsRoot();
      if (dmsRoot) {
        this.breadcrumbPath.push({ 
          label: 'DMS', 
          node: dmsRoot 
        });
      } else {
        this.breadcrumbPath.push({ label: 'DMS' });
      }
    }

    // Add all folders in path except duplicate DMS entries
    path.forEach(n => {
      if (n.label.toLowerCase() !== 'dms' || path.indexOf(n) === 0) {
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
  const out: FolderTreeNode[] = [];

  for (const item of items || []) {
    const id =
      typeof item.id === 'number' && item.id > 0
        ? item.id
        : Math.floor(Math.random() * 1e9);

    const label =
      item.label ||
      item.folderName ||
      item.regulationName ||
      item.organizationName ||
      item.entityName ||
      `Item_${id}`;

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
      fileData: item.fileData
    };

    // 🟢 Build proper breadcrumb path for both DMS & COMPSEQR360
    const parentPath = parent?.path || [];
    if ((foldertitle || '').toLowerCase() === 'dms') {
      // Ensure path starts with DMS
      node.path = parentPath.length > 0 ? [...parentPath, label] : ['DMS', label];
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
  // If no node (like root DMS), reset to initial DMS view
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
 
  buildNestedComFolders(items: any[], parentId: number, foldertitle: any, parentPath: string[] = []): ComFolder[] {
  const result: ComFolder[] = [];

  items.forEach(item => {
    const currentId = this.folderId++;
    const label = item.complianceName || item.tocName || item.regulationName || item.typeOfComplianceName || `Item_${item.id}`;
    const currentPath = [...parentPath, label];
    
    const folder: ComFolder = {
      label,
      id: currentId,
      parentId,
      expanded: false,
      children: [],
      foldertitle: foldertitle,
      path: currentPath
    };

    // Recursively process deeper levels (compliance/toc for old structure, files for new structure)
    if (Array.isArray(item.compliance) && item.compliance.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.compliance, currentId, foldertitle, currentPath));
    }

    if (Array.isArray(item.toc) && item.toc.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.toc, currentId, foldertitle, currentPath));
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
          path: [...currentPath, subFolder.folderName || 'Files']
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
              fileData: file
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

  // Handle new data structure - array of compliance items
  if (Array.isArray(data)) {
    // Compliance Root
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
        label: item.typeOfComplianceName || `Compliance_${item.id}`,
        id: itemId,
        parentId: complianceId,
        expanded: false,
        children: [],
        foldertitle: "Compliance",
        path: ["COMPSEQR360", "Compliance", item.typeOfComplianceName]
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
            path: ["COMPSEQR360", "Compliance", item.typeOfComplianceName, subFolder.folderName || 'Files']
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
                path: ["COMPSEQR360", "Compliance", item.typeOfComplianceName, subFolder.folderName || 'Files', file.fileName],
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
    // Handle old data structure for backward compatibility
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
        children: []
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
      foldertitle: "Organization"
    };

    // Add organizations and entities
    (data.organization || []).forEach((org: any) => {
      const orgFolderId = this.folderId++;
      const orgItem: ComFolder = {
        label: org.organizationName,
        id: orgFolderId,
        parentId: orgId,
        expanded: false,
        children: [],
        foldertitle: "Organization"
      };

      org.entityList.forEach((ent: any) => {
        const entId = this.folderId++;
        orgItem.children.push({
          label: ent.entityName,
          id: entId,
          parentId: orgFolderId,
          expanded: false,
          children: [],
          foldertitle: "Organization"
        });
      });

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
      foldertitle: "Announcement"
    };

    // Add announcements
    (data.announcement || []).forEach((ann: any) => {
      const annId = this.folderId++;
      const annFolder: ComFolder = {
        label: ann.regulationName,
        id: annId,
        parentId: announcementId,
        expanded: false,
        children: [],
        foldertitle: "Announcement"
      };

      if (Array.isArray(ann.compliance) && ann.compliance.length > 0) {
        annFolder.children.push(...this.buildNestedComFolders(ann.compliance, annId,"Announcement"));
      }

      if (Array.isArray(ann.toc) && ann.toc.length > 0) {
        annFolder.children.push(...this.buildNestedComFolders(ann.toc, annId,"Announcement"));
      }
      announcementFolder.children.push(annFolder);
    });

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
      name: item.typeOfComplianceName || item.complianceName || item.tocName,
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
