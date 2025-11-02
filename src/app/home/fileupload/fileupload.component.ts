import { Component, ElementRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderService } from '../../Services/folder.service';
import { FileModel, FolderModel } from '../../models/folderModel';
import { file } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getDate } from 'date-fns';
import { FolderTreeNode } from '../../models/filetreeNode';
import { HttpClient } from '@angular/common/http';

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

  constructor(private folderService: FolderService,private notifier:NotifierService,private formBuilder: FormBuilder,private http: HttpClient) {
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
    const imagePath = params.data.filePath;
    const fileName = params.data.fileName || 'downloaded-image.jpg';
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
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
    console.log("selected item ==",this.selectedFolderTreeNodeItem);
    this.buildBreadcrumbPath(item);
    this.getAllFilesbyFolderId(item.id);
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
