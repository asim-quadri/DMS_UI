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
  foldertitle?:string;
  children: ComFolder[];
  
}

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
     { headerName: 'Folder', field: 'folderName', sortable: true, filter: true },
    { headerName: 'File Name', field: 'fullName',cellRenderer: this.fileCellRenderer.bind(this), sortable: true, filter: true },
    { headerName: 'Last modified', field: 'createdOn', sortable: true, filter: true },
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
    this.folderService.getGetFolderTree(selectedEntityId,currentUserId).subscribe((result: any) => {
     if(this.treeData.length>0){
      result.forEach((element: any) => {
        this.treeData.push(element);
      });
     }else{
      this.treeData = result;
     }
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

 

  getcompdata(){
    this.folders = [];
    this.folderService.getcompleteFolderList().subscribe((result: any) => {
      const comFolderTree = this.buildComFolderTree(result);
          this.treeData = comFolderTree;
          
       this.getGetFolderTree(this.selectedEntityId,this.currentUserId);
    });
   
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

  openSm(content: TemplateRef<any>) {
    
    this.modalService.open(content, { centered: true, size: 'sm'  });
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
    
    this.buildBreadcrumbPath(item);
    this.getAllFilesbyFolderId(item.id,this.getModuleType(item.foldertitle||''));
  }

  getModuleType(label: string): string {
  const lower = (label || '').toLowerCase();
  
  if (['regulation', 'organization', 'announcement','compseqr360'].includes(lower)) {
    return lower;
  } else {
    return 'Dms';
  }
}

buildBreadcrumbPath(selectedNode: FolderTreeNode): void {
  if (!selectedNode) {
    this.breadcrumbPath = [{ label: 'DMS' }];
    return;
  }

  const path: FolderTreeNode[] = [];
  let current: FolderTreeNode | undefined = selectedNode;

  // climb up the parent references
  while (current) {
    path.unshift(current);
    current = current.parent;
  }

  // remove duplicates
  const uniquePath = path.filter(
    (node, i, arr) => i === 0 || node.label !== arr[i - 1].label
  );

  // detect if top node is COMPSEQR360
  const top = uniquePath[0];
  const isCompseqrRoot =
    (top.label || '').toLowerCase() === 'compseqr360' ||
    (top.foldertitle || '').toLowerCase() === 'compseqr360';

  if (isCompseqrRoot) {
    this.breadcrumbPath = uniquePath.map((n) => ({
      label: n.label,
      node: n,
    }));
  } else {
    this.breadcrumbPath = [{ label: 'DMS' }].concat(
      uniquePath.map((n) => ({
        label: n.label,
        node: n,
      }))
    );
  }
}


normalizeNodes(
  items: any[],
  parent: FolderTreeNode | null = null,
  foldertitle?: string
): FolderTreeNode[] {
  const out: FolderTreeNode[] = [];

  for (const item of items || []) {
    // Ensure a valid ID for every node
    const id =
      typeof item.id === 'number' && item.id > 0
        ? item.id
        : Math.floor(Math.random() * 1e9);

    // Choose readable label name
    const label =
      item.label ||
      item.folderName ||
      item.regulationName ||
      item.organizationName ||
      item.entityName ||
      `Item_${id}`;

    // ✅ Create node and attach parent reference
    const node: FolderTreeNode = {
      id,
      label,
      expanded: !!item.expanded,
      children: [],
      parentId: parent ? parent.id : 0,
      parent: parent || undefined,  // 👈 This is the key line
      foldertitle: item.foldertitle || foldertitle,
    };

    // Recurse into children (and assign parent reference)
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
  if (!breadcrumb.node) return;

  this.selectedFolderTreeNodeItem = breadcrumb.node;
  this.buildBreadcrumbPath(breadcrumb.node);
  this.getAllFilesbyFolderId(
    breadcrumb.node.id,
    this.getModuleType(breadcrumb.node.foldertitle || '')
  );
}


//start filters

 comfolders: ComFolder[] = [];
 folderId = 1;
 
  buildNestedComFolders(items: any[], parentId: number,foldertitle:any): ComFolder[] {
  const result: ComFolder[] = [];

    items.forEach(item => {
      const currentId = this.folderId++;
      const folder: ComFolder = {
      label: item.complianceName || item.tocName || item.regulationName || item.typeOfComplianceName|| `Item_${item.id}`,
      id: currentId,
      parentId,
      expanded: false,
      children: [],
      foldertitle:foldertitle
    };

    // Recursively process deeper levels (compliance/toc)
    if (Array.isArray(item.compliance) && item.compliance.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.compliance, currentId,foldertitle));
    }

    if (Array.isArray(item.toc) && item.toc.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.toc, currentId,foldertitle));
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
    children: []
  };

  // Regulation Root
  const regulationId = this.folderId++;
  const regulationFolder: ComFolder = {
    label: "Regulation",
    id: regulationId,
    parentId: rootId,
    expanded: false,
    children: [],
    foldertitle: "Regulation" 
  };

  // Add regulations
  data.regulation.forEach((reg: any) => {
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
  data.organization.forEach((org: any) => {
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
  data.announcement.forEach((ann: any) => {
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
  // Return full tree
  return [rootFolder];
}



 //end
}
