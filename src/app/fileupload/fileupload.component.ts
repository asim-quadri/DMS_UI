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
import { ClientComplianceTrackerService } from '../Services/client-compliance-tracker.service';
import { UserAssignedEntity, PendingComplianceTracker, LocationMaster, ComplianceTrackerDocument, RegulationWithTOC, TypeOfCompliance } from '../Models/compliancetracker';
import { forkJoin } from 'rxjs';

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
  nodeType?: string;
  complianceData?: any;
  locationData?: any;
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
  
  // Client Compliance Tracker properties
  userAssignedEntities: UserAssignedEntity[] = [];
  selectedEntity: UserAssignedEntity | null = null;
  pendingComplianceData: PendingComplianceTracker[] = [];
  locationMasterData: LocationMaster[] = [];
  
  // Regulations and Type of Compliance (TOC) properties
  regulationsData: RegulationWithTOC[] = [];
  selectedRegulation: RegulationWithTOC | null = null;
  typeOfComplianceList: TypeOfCompliance[] = [];
  selectedTOC: TypeOfCompliance | null = null;
  isLoadingRegulations: boolean = false;
  isLoadingTOC: boolean = false;

  constructor(
    private folderService: FolderService,
    private notifier: NotifierService,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private persistenceService: PersistenceService,
    private route: Router,
    private clientComplianceService: ClientComplianceTrackerService
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
    //this.getAllFolders();
    this.loadClientComplianceTracker();
  }

  /**
   * Load Client Compliance Tracker data from API
   */
  loadClientComplianceTracker() {
    const userId = this.persistenceService.getUserId() || 16; // Default to 16 for testing
    
    // First get user assigned entities
    this.clientComplianceService.getUserAssignedEntities(userId).subscribe({
      next: (entities) => {
        this.userAssignedEntities = entities;
        console.log('User Assigned Entities:', entities);
        
        if (entities.length > 0) {
          // Select first entity by default
          this.selectedEntity = entities[0];
          this.loadComplianceDataForEntity(this.selectedEntity.id, userId);
        } else {
          // No entities, just load DMS
          this.loadDmsTree();
        }
      },
      error: (err) => {
        console.error('Error loading user entities:', err);
        this.loadDmsTree();
      }
    });
  }

  /**
   * Load compliance data for selected entity
   */
  loadComplianceDataForEntity(entityId: number, userId: number) {
    // Load both compliance tracker and location data in parallel
    forkJoin({
      complianceData: this.clientComplianceService.getPendingComplianceTrackerByEntity(entityId, userId),
      locationData: this.clientComplianceService.getLocationMasterByEntity(entityId)
    }).subscribe({
      next: ({ complianceData, locationData }) => {
        this.pendingComplianceData = complianceData;
        this.locationMasterData = locationData;
        console.log('Compliance Data:', complianceData);
        console.log('Location Data:', locationData);
        
        // First load regulations, then build the tree
        this.loadRegulationsForEntity(entityId, () => {
          // Build the tree structure AFTER regulations are loaded
          this.buildComplianceTrackerTreeUI();
        });
      },
      error: (err) => {
        console.error('Error loading compliance data:', err);
        this.loadDmsTree();
      }
    });
  }

  /**
   * Load regulations list with type of compliance (TOC) for entity
   * API: /Questionnaires/GetRegulationListByEntityId?entityId={entityId}
   */
  loadRegulationsForEntity(entityId: number, callback?: () => void) {
    this.isLoadingRegulations = true;
    this.regulationsData = [];
    this.selectedRegulation = null;
    this.typeOfComplianceList = [];
    
    this.clientComplianceService.getRegulationListByEntityId(entityId).subscribe({
      next: (regulations: RegulationWithTOC[]) => {
        this.regulationsData = regulations;
        this.isLoadingRegulations = false;
        console.log('Regulations Data:', regulations);
        
        // If regulations exist, log TOC count for each
        regulations.forEach(reg => {
          console.log(`Regulation: ${reg.regulationName}, TOC count: ${reg.toc?.length || 0}`);
        });
        
        // Call callback if provided (to build tree after regulations are loaded)
        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error('Error loading regulations:', err);
        this.isLoadingRegulations = false;
        this.notifier.notify('error', 'Failed to load regulations');
        // Still call callback to build tree even if regulations fail
        if (callback) {
          callback();
        }
      }
    });
  }

  /**
   * Handle regulation selection - displays TOC list for selected regulation
   */
  onRegulationSelect(regulation: RegulationWithTOC) {
    this.selectedRegulation = regulation;
    this.typeOfComplianceList = regulation.toc || [];
    this.selectedTOC = null;
    
    console.log('Selected Regulation:', regulation.regulationName);
    console.log('Type of Compliance List:', this.typeOfComplianceList);
    
    // Display TOC data in files grid
    if (this.typeOfComplianceList.length > 0) {
      this.files = this.typeOfComplianceList.map((toc, index) => ({
        id: toc.id,
        fileName: toc.typeOfComplianceName,
        fullName: toc.typeOfComplianceName,
        folderName: regulation.regulationName,
        ruleType: toc.ruleType,
        frequency: toc.frequency,
        typeOfComplianceUID: toc.typeOfComplianceUID,
        dueDate: toc.dueDate,
        forTheMonth: toc.forTheMonth,
        parentRegulationName: toc.parentRegulationName,
        parentComplianceName: toc.parentComplianceName,
        createdOn: toc.lastModified,
        fileType: 'compliance'
      }));
    } else {
      this.files = [];
      this.notifier.notify('info', 'No type of compliance found for this regulation');
    }
  }

  /**
   * Handle TOC (Type of Compliance) selection
   */
  onTOCSelect(toc: TypeOfCompliance) {
    this.selectedTOC = toc;
    console.log('Selected TOC:', toc.typeOfComplianceName, 'Rule Type:', toc.ruleType);
    
    // Display single TOC details
    this.files = [{
      id: toc.id,
      fileName: toc.typeOfComplianceName,
      fullName: toc.typeOfComplianceName,
      folderName: this.selectedRegulation?.regulationName || 'Regulation',
      ruleType: toc.ruleType,
      frequency: toc.frequency,
      typeOfComplianceUID: toc.typeOfComplianceUID,
      dueDate: toc.dueDate,
      forTheMonth: toc.forTheMonth,
      parentRegulationName: toc.parentRegulationName,
      parentComplianceName: toc.parentComplianceName,
      createdOn: toc.lastModified,
      fileType: 'compliance',
      parameters: toc.parameters
    }];
  }

  /**
   * Get all TOC items from all regulations (flattened)
   */
  getAllTOCItems(): TypeOfCompliance[] {
    const allTOC: TypeOfCompliance[] = [];
    this.regulationsData.forEach(reg => {
      if (reg.toc && reg.toc.length > 0) {
        allTOC.push(...reg.toc);
      }
    });
    return allTOC;
  }

  /**
   * Filter TOC by rule type (Payments, Filing, Activity)
   */
  filterTOCByRuleType(ruleType: string): TypeOfCompliance[] {
    return this.typeOfComplianceList.filter(toc => toc.ruleType === ruleType);
  }

  /**
   * Clear regulation selection
   */
  clearRegulationSelection() {
    this.selectedRegulation = null;
    this.typeOfComplianceList = [];
    this.selectedTOC = null;
    this.files = [];
  }

  /**
   * Add TOC nodes to the tree under their respective Regulation nodes
   * This updates the sidebar to show TOC items as children of Regulations
   * Structure: Entity → Compliance Tracker → Financial Year → Regulation → TOC items
   */
  addTOCNodesToTree(regulations: RegulationWithTOC[]) {
    if (!regulations || regulations.length === 0) {
      console.log('No regulations to add to tree');
      return;
    }

    console.log('Adding TOC items to existing regulation nodes:', regulations.length);
    console.log('Regulation names from API:', regulations.map(r => r.regulationName));

    // Find all Regulation nodes in the tree and add TOC items to matching ones
    const addTOCToRegulationNodes = (nodes: FolderTreeNode[]) => {
      for (const node of nodes) {
        // Check if this is a Regulation node (inside Financial Year)
        if (node.foldertitle === 'Regulation') {
          console.log('Found Regulation node in tree:', node.label);
          
          // Find matching regulation from API data
          const matchingReg = regulations.find(r => r.regulationName === node.label);
          
          console.log('Matching regulation found:', matchingReg ? matchingReg.regulationName : 'NONE');
          
          if (matchingReg && matchingReg.toc && matchingReg.toc.length > 0) {
            // Store regulation data on the node
            node.fileData = matchingReg;
            
            // Add TOC items as children of this regulation node
            // First, check if TOC items already exist to avoid duplicates
            const existingTOCLabels = node.children?.filter(c => c.foldertitle === 'TOC').map(c => c.label) || [];
            
            matchingReg.toc.forEach(toc => {
              // Skip if TOC already exists
              if (existingTOCLabels.includes(toc.typeOfComplianceName)) {
                return;
              }
              
              const tocNodeId = this.folderId++;
              const tocNode: FolderTreeNode = {
                id: tocNodeId,
                label: toc.typeOfComplianceName,
                parentId: node.id,
                parent: node,
                expanded: false,
                foldertitle: 'TOC',
                children: [],
                treeType: 'COMPSEQR360',
                path: [...(node.path || []), toc.typeOfComplianceName],
                isFile: false,
                fileData: toc
              };
              
              // Find compliance data for this TOC to add Location → Documents
              const tocComplianceData = this.pendingComplianceData.filter(
                item => item.tocId === toc.id && item.regulationName === matchingReg.regulationName
              );
              
              if (tocComplianceData.length > 0) {
                // Group by location
                const byLocation = this.groupByKey(tocComplianceData, 'locationId');
                
                Object.keys(byLocation).forEach(locIdStr => {
                  const locId = parseInt(locIdStr);
                  const location = this.locationMasterData.find(l => l.Id === locId);
                  const locationLabel = location 
                    ? `${location.Id}-${location.LocationName}` 
                    : `Location ${locId}`;

                  const locationNodeId = this.folderId++;
                  const locationNode: FolderTreeNode = {
                    id: locationNodeId,
                    label: locationLabel,
                    parentId: tocNodeId,
                    parent: tocNode,
                    expanded: false,
                    foldertitle: 'Location',
                    children: [],
                    treeType: 'COMPSEQR360',
                    path: [...(tocNode.path || []), locationLabel]
                  };

                  // Add documents under location
                  const locData = byLocation[locIdStr];
                  locData.forEach((item: PendingComplianceTracker) => {
                    const docLabel = `${item.cmpId} - ${item.forTheMonth}`;
                    const docId = this.folderId++;
                    
                    const docNode: FolderTreeNode = {
                      id: docId,
                      label: docLabel,
                      parentId: locationNodeId,
                      parent: locationNode,
                      expanded: false,
                      foldertitle: 'Document',
                      children: [],
                      treeType: 'COMPSEQR360',
                      path: [...(locationNode.path || []), docLabel],
                      isFile: item.documentCount > 0,
                      fileData: item
                    };

                    locationNode.children?.push(docNode);
                  });

                  tocNode.children?.push(locationNode);
                });
              }
              
              // Add at the beginning of children (before TypeOfCompliance nodes)
              if (!node.children) {
                node.children = [];
              }
              node.children.unshift(tocNode);
            });
            
            console.log(`Added ${matchingReg.toc.length} TOC items to regulation: ${node.label}`);
          }
        }
        
        // Recursively process children
        if (node.children && node.children.length > 0) {
          addTOCToRegulationNodes(node.children);
        }
      }
    };

    addTOCToRegulationNodes(this.treeData);

    // Re-attach parent references
    this.attachParentReferences(this.treeData);
    
    // Trigger Angular change detection by reassigning treeData
    this.treeData = [...this.treeData];
    
    console.log('Tree updated with TOC nodes under regulation nodes');
  }

  /**
   * Build the Compliance Tracker folder tree UI
   */
  buildComplianceTrackerTreeUI() {
    const complianceTrackerRoot = this.buildClientComplianceTree();
    
    // Now load DMS data and merge
    this.folderService.getGetFolderTree(this.selectedEntityId, this.currentUserId)
      .subscribe({
        next: (dmsResult: any) => {
          this.mergeDmsNodesWithComplianceTracker(complianceTrackerRoot, dmsResult);
        },
        error: (err: any) => {
          console.error('Error fetching DMS data', err);
          this.mergeDmsNodesWithComplianceTracker(complianceTrackerRoot, []);
        }
      });
  }


  /**
   * Build client compliance tree based on flow:
   * Entity → Compliance Tracker → Financial Year → Regulations → Type of Compliances → Location → Documents
   */
  buildClientComplianceTree(): FolderTreeNode[] {
    const rootId = this.folderId++;
    
    // Create entity-level root nodes
    const entityRoots: FolderTreeNode[] = [];
    
    this.userAssignedEntities.forEach(entity => {
      const entityId = this.folderId++;
      const entityNode: FolderTreeNode = {
        id: entityId,
        label: entity.entityName,
        parentId: 0,
        expanded: entity.id === this.selectedEntity?.id,
        foldertitle: 'Entity',
        children: [],
        treeType: 'COMPSEQR360',
        path: [entity.entityName]
      };

      // Only add children for selected entity
      if (entity.id === this.selectedEntity?.id) {
        // Compliance Tracker folder
        const complianceTrackerId = this.folderId++;
        const complianceTrackerNode: FolderTreeNode = {
          id: complianceTrackerId,
          label: 'Compliance Tracker',
          parentId: entityId,
          expanded: true,
          foldertitle: 'ComplianceTracker',
          children: [],
          treeType: 'COMPSEQR360',
          path: [entity.entityName, 'Compliance Tracker']
        };

        // Group compliance data by financial year
        const byFinancialYear = this.groupByKey(this.pendingComplianceData, 'financialYear');
        const sortedYears = Object.keys(byFinancialYear).sort().reverse();

        sortedYears.forEach(year => {
          const yearId = this.folderId++;
          const yearNode: FolderTreeNode = {
            id: yearId,
            label: year,
            parentId: complianceTrackerId,
            expanded: false,
            foldertitle: 'FinancialYear',
            children: [],
            treeType: 'COMPSEQR360',
            path: [entity.entityName, 'Compliance Tracker', year]
          };

          const yearData = byFinancialYear[year];
          
          // Group by regulation
          const byRegulation = this.groupByKey(yearData, 'regulationName');
          
          Object.keys(byRegulation).forEach(regName => {
            const regId = this.folderId++;
            const regNode: FolderTreeNode = {
              id: regId,
              label: regName,
              parentId: yearId,
              expanded: false,
              foldertitle: 'Regulation',
              children: [], // TOC nodes will be added by addTOCNodesToTree
              treeType: 'COMPSEQR360',
              path: [entity.entityName, 'Compliance Tracker', year, regName]
            };

            // Note: TypeOfCompliance (Quarterly Compliance) folder removed
            // TOC → Location → Documents structure is added by addTOCNodesToTree method

            yearNode.children?.push(regNode);
          });

          complianceTrackerNode.children?.push(yearNode);
        });

        entityNode.children?.push(complianceTrackerNode);

        // Entity wise folder (for additional folders if needed)
        const entityWiseFolderId = this.folderId++;
        const entityWiseFolderNode: FolderTreeNode = {
          id: entityWiseFolderId,
          label: 'Entity wise Folder',
          parentId: entityId,
          expanded: false,
          foldertitle: 'EntityWiseFolder',
          children: [],
          treeType: 'COMPSEQR360',
          path: [entity.entityName, 'Entity wise Folder']
        };
        entityNode.children?.push(entityWiseFolderNode);
      }

      entityRoots.push(entityNode);
    });

    return entityRoots;
  }

  /**
   * Merge DMS nodes with Compliance Tracker tree
   */
  mergeDmsNodesWithComplianceTracker(complianceTrackerNodes: FolderTreeNode[], dmsResult: any) {
    // Filter out any old COMPSEQR360 data from DMS
    const filteredDmsResult = Array.isArray(dmsResult) ? dmsResult.filter((item: any) => 
      (item.label || item.folderName) !== 'COMPSEQR360' &&
      (item.label || item.folderName) !== 'Compliance Tracker'
    ) : [];

    const normalizedDmsNodes = this.normalizeNodes(filteredDmsResult, null, 'DMS');

    const dmsRoot: FolderTreeNode = {
      id: Math.floor(Math.random() * 1e9),
      label: 'ProEDox',
      expanded: true,
      children: normalizedDmsNodes,
      parentId: 0,
      foldertitle: 'ProEDox',
      treeType: 'DMS'
    };

    this.markTreeType([dmsRoot], 'DMS');
    this.markTreeType(complianceTrackerNodes, 'COMPSEQR360');

    this.attachParentReferences(complianceTrackerNodes);
    this.attachParentReferences([dmsRoot]);

    // Combine compliance tracker entities and DMS
    this.treeData = [...complianceTrackerNodes, dmsRoot];
    
    if (this.treeData.length > 0) {
      console.log('Final Tree Data:', this.treeData);
    }
    
    // NOW add TOC nodes to the tree (after tree is built)
    if (this.regulationsData && this.regulationsData.length > 0) {
      console.log('Adding TOC nodes after tree is built...');
      this.addTOCNodesToTree(this.regulationsData);
    }
  }

  /**
   * Helper to group array by key
   */
  groupByKey(array: any[], key: string): { [key: string]: any[] } {
    return array.reduce((result, item) => {
      const keyValue = String(item[key] || 'Unknown');
      (result[keyValue] = result[keyValue] || []).push(item);
      return result;
    }, {} as { [key: string]: any[] });
  }

  /**
   * Load only DMS tree (fallback)
   */
  loadDmsTree() {
    this.folderService.getGetFolderTree(this.selectedEntityId, this.currentUserId)
      .subscribe({
        next: (dmsResult: any) => {
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
            treeType: 'DMS'
          };

          this.markTreeType([dmsRoot], 'DMS');
          this.attachParentReferences([dmsRoot]);

          this.treeData = [dmsRoot];
        },
        error: (err: any) => {
          console.error('Error fetching DMS data', err);
          this.treeData = [];
        }
      });
  }

  /**
   * Handle entity selection change
   */
  onEntityChange(entity: UserAssignedEntity) {
    this.selectedEntity = entity;
    const userId = this.persistenceService.getUserId() || 16;
    this.loadComplianceDataForEntity(entity.id, userId);
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
    // Check if file content exists (for compliance documents) or filePath exists (for DMS)
    const hasFileContent = params.data.fileContent;
    const hasFilePath = params.data.filePath;
    const canViewDownload = hasFileContent || hasFilePath;
    
    console.log('optionsRenderer - Row data:', params.data.fileName, 'hasFileContent:', !!hasFileContent, 'hasFilePath:', !!hasFilePath, 'canViewDownload:', canViewDownload);
    
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
    console.log('onViewClick called');
    console.log('onViewClick - params:', params);
    console.log('onViewClick - params.data:', params.data);
    console.log('onViewClick - params.data keys:', Object.keys(params.data || {}));
    console.log('onViewClick - fileContent exists:', !!params.data?.fileContent);
    console.log('onViewClick - fileContent type:', typeof params.data?.fileContent);
    console.log('onViewClick - fileContent length:', params.data?.fileContent?.length);
    console.log('onViewClick - fileName:', params.data?.fileName);
    
    // Also check this.files to see what's in the grid data
    console.log('onViewClick - this.files:', this.files);
    console.log('onViewClick - this.files[0]?.fileContent exists:', !!this.files[0]?.fileContent);
    
    // Check if this is a compliance document with base64 content
    if (params.data?.fileContent) {
      console.log('Using params.data.fileContent');
      this.viewBase64File(params.data.fileContent, params.data.fileName);
    } else if (this.files[0]?.fileContent) {
      // Fallback: use the fileContent from this.files array directly
      console.log('Fallback: Using this.files[0].fileContent');
      this.viewBase64File(this.files[0].fileContent, this.files[0].fileName);
    } else if (params.data?.filePath) {
      // Regular file with filePath
      console.log('Using filePath navigation');
      const imagePath = params.data.filePath;
      this.route.navigate(['/fileview'], { queryParams: { fileurl: imagePath } });
    } else {
      console.error('No fileContent or filePath available');
      this.notifier.notify('error', 'No file content available to view');
    }
  }

  onDownloadClick(params: any): void {
    // Check if this is a compliance document with base64 content
    if (params.data.fileContent) {
      this.downloadBase64File(params.data.fileContent, params.data.fileName);
    } else {
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
      });
    }
  }

  /**
   * View base64 encoded file content
   */
  viewBase64File(base64Content: string, fileName: string): void {
    try {
      console.log('viewBase64File called - fileName:', fileName);
      console.log('viewBase64File - base64Content length:', base64Content?.length);
      console.log('viewBase64File - base64Content first 100 chars:', base64Content?.substring(0, 100));
      
      const mimeType = this.getMimeType(fileName);
      console.log('viewBase64File - mimeType:', mimeType);
      
      const byteCharacters = atob(base64Content);
      console.log('viewBase64File - decoded length:', byteCharacters.length);
      
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      console.log('viewBase64File - blob size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      console.log('viewBase64File - blob URL:', url);
      
      // Open in new tab for viewing
      const newWindow = window.open(url, '_blank');
      console.log('viewBase64File - window.open result:', newWindow);
      
      if (!newWindow) {
        // Popup was blocked - try alternative approach
        console.warn('Popup blocked! Trying alternative approach...');
        this.notifier.notify('warning', 'Popup blocked. Please allow popups or use download instead.');
        
        // Alternative: Create a link and click it
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.click();
      }
      
      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
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
    } catch (error) {
      console.error('Error downloading file:', error);
      this.notifier.notify('error', 'Failed to download file');
    }
  }

  /**
   * Get MIME type based on file extension
   */
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

  console.log('selectItem called for:', realNode.label, 'treeType:', realNode.treeType, 'foldertitle:', realNode.foldertitle, 'path:', realNode.path);

  this.selectedFolderTreeNodeItem = realNode;
  this.buildBreadcrumbPath(realNode);

  if (realNode.isFile && realNode.fileData) {
    console.log('Selected a file:', realNode.label);
    // For compliance tracker document nodes with fileData
    if (realNode.foldertitle === 'Document' && realNode.fileData) {
      this.files = [{
        ...realNode.fileData,
        fileName: realNode.label,
        fullName: realNode.label,
        folderName: realNode.path?.[realNode.path.length - 2] || 'Documents'
      }];
    } else {
      this.files = [{
        ...realNode.fileData,
        fullName: realNode.label
      }];
    }
  } else if (realNode.treeType === 'COMPSEQR360') {
    // Handle Compliance Tracker nodes
    console.log('Handling Compliance Tracker node:', realNode.foldertitle);
    this.handleComplianceTrackerSelection(realNode);
  } else {
    console.log('Fetching files from API for DMS node');
    this.getAllFilesbyFolderId(realNode.id, this.getModuleType(realNode.path || ''));
  }
}

/**
 * Handle selection of Compliance Tracker nodes
 */
handleComplianceTrackerSelection(node: FolderTreeNode): void {
  const foldertitle = node.foldertitle;
  
  switch (foldertitle) {
    case 'Document':
      // Fetch documents from API when Document node is clicked
      if (node.fileData) {
        const compData = node.fileData as PendingComplianceTracker;
        this.loadComplianceDocuments(compData.cmpId, node);
      }
      break;
    
    case 'Regulation':
      // When a Regulation node is selected, load and display its TOC items
      this.handleRegulationNodeSelection(node);
      break;
    
    case 'RegulationItem':
      // When a Regulation item from Regulations folder is selected
      this.handleRegulationItemSelection(node);
      break;
    
    case 'TOC':
      // When a TOC node is selected, display its details
      this.handleTOCNodeSelection(node);
      break;
    
    case 'RegulationsFolder':
      // When Regulations folder is selected, show all regulations
      this.displayAllRegulations();
      break;
    
    case 'Location':
    case 'TypeOfCompliance':
    case 'FinancialYear':
    case 'ComplianceTracker':
    case 'Entity':
      // Collect all document data from children
      this.files = this.collectComplianceTrackerFiles(node);
      break;
    
    default:
      this.files = this.collectAllFiles(node);
  }
}

/**
 * Handle Regulation node selection - load TOC data from API
 */
handleRegulationNodeSelection(node: FolderTreeNode): void {
  console.log('Regulation node selected:', node.label);
  
  // Find the selected entity to get entityId
  const entityId = this.selectedEntity?.id;
  if (!entityId) {
    console.error('No entity selected');
    this.files = this.collectComplianceTrackerFiles(node);
    return;
  }
  
  // Find matching regulation from loaded data or load fresh
  const existingReg = this.regulationsData.find(r => r.regulationName === node.label);
  
  if (existingReg && existingReg.toc && existingReg.toc.length > 0) {
    // Use existing regulation data
    this.onRegulationSelect(existingReg);
  } else {
    // Load regulations from API to get TOC
    this.isLoadingTOC = true;
    this.clientComplianceService.getRegulationListByEntityId(entityId).subscribe({
      next: (regulations: RegulationWithTOC[]) => {
        this.regulationsData = regulations;
        const matchingReg = regulations.find(r => r.regulationName === node.label);
        
        if (matchingReg) {
          this.onRegulationSelect(matchingReg);
        } else {
          // Fallback to collecting files from children
          this.files = this.collectComplianceTrackerFiles(node);
        }
        this.isLoadingTOC = false;
      },
      error: (err) => {
        console.error('Error loading regulations:', err);
        this.isLoadingTOC = false;
        this.files = this.collectComplianceTrackerFiles(node);
      }
    });
  }
}

/**
 * Handle TOC node selection - load and display documents for the TOC
 * API: /ComplianceTracker/GetComplianceTrackerDocuments?CompId={typeOfComplianceUID}
 */
handleTOCNodeSelection(node: FolderTreeNode): void {
  console.log('TOC node selected:', node.label);
  
  // Get TOC data from node's fileData
  const tocData = node.fileData as TypeOfCompliance;
  
  if (tocData) {
    // Also set the selected TOC for other operations
    this.selectedTOC = tocData;
    
    // Find parent regulation name from path
    const regulationName = node.path && node.path.length >= 2 
      ? node.path[node.path.length - 2] 
      : 'Regulation';
    
    // Find and set the parent regulation
    const parentReg = this.regulationsData.find(r => r.regulationName === regulationName);
    if (parentReg) {
      this.selectedRegulation = parentReg;
      this.typeOfComplianceList = parentReg.toc || [];
    }
    
    // Get the CompId from typeOfComplianceUID
    const compId = tocData.typeOfComplianceUID;
    
    if (compId) {
      // Load documents from API
      console.log('Loading documents for TOC CompId:', compId);
      this.loadTOCDocuments(compId, node, tocData, regulationName);
    } else {
      // No CompId, just display TOC info
      console.warn('No typeOfComplianceUID found for TOC:', node.label);
      this.displayTOCInfo(tocData, regulationName);
    }
  } else {
    console.warn('No TOC data found for node:', node.label);
    this.files = [];
  }
}

/**
 * Load documents for a TOC item from API
 * API: /ComplianceTracker/GetComplianceTrackerDocuments?CompId={compId}
 */
loadTOCDocuments(compId: string, node: FolderTreeNode, tocData: TypeOfCompliance, regulationName: string): void {
  console.log('Loading TOC documents for compId:', compId);
  
  this.clientComplianceService.getComplianceTrackerDocuments(compId).subscribe({
    next: (documents: ComplianceTrackerDocument[]) => {
      console.log('TOC Documents received - raw response:', documents);
      console.log('TOC Documents received - is array:', Array.isArray(documents));
      console.log('TOC Documents received - length:', documents?.length);
      
      if (documents && documents.length > 0) {
        console.log('First document - fileName:', documents[0].fileName);
        console.log('First document - fileContent exists:', !!documents[0].fileContent);
        console.log('First document - fileContent length:', documents[0].fileContent?.length);
        
        // Display documents in the grid
        this.files = documents.map((doc, index) => ({
          id: index + 1,
          fileName: doc.fileName,
          fullName: doc.fileName,
          folderName: tocData.typeOfComplianceName,
          compId: doc.compId,
          fileContent: doc.fileContent, // Base64 content for view/download
          createdBy: doc.createdBy,
          isDelete: doc.isDelete,
          createdOn: doc.createdDate,
          // Additional TOC info
          regulationName: regulationName,
          typeOfComplianceName: tocData.typeOfComplianceName,
          ruleType: tocData.ruleType,
          frequency: tocData.frequency,
          // File type based on extension for icon display
          fileType: this.getMimeType(doc.fileName)
        }));
        
        console.log('Files array set:', this.files);
        console.log('First file in grid - fileContent exists:', !!this.files[0]?.fileContent);
      } else {
        // No documents found, display TOC info instead
        console.log('No documents found for TOC, displaying TOC info');
        this.displayTOCInfo(tocData, regulationName);
      }
    },
    error: (err) => {
      console.error('Error loading TOC documents:', err);
      this.notifier.notify('error', 'Failed to load documents');
      // Fallback to displaying TOC info
      this.displayTOCInfo(tocData, regulationName);
    }
  });
}

/**
 * Display TOC information in grid (when no documents available)
 */
displayTOCInfo(tocData: TypeOfCompliance, regulationName: string): void {
  this.files = [{
    id: tocData.id,
    fileName: tocData.typeOfComplianceName,
    fullName: tocData.typeOfComplianceName,
    folderName: regulationName,
    ruleType: tocData.ruleType,
    frequency: tocData.frequency,
    typeOfComplianceUID: tocData.typeOfComplianceUID,
    dueDate: tocData.dueDate,
    forTheMonth: tocData.forTheMonth,
    parentRegulationName: tocData.parentRegulationName,
    parentComplianceName: tocData.parentComplianceName,
    createdOn: tocData.lastModified,
    fileType: 'compliance',
    parameters: tocData.parameters
  }];
}

/**
 * Handle RegulationItem node selection (from Regulations folder)
 */
handleRegulationItemSelection(node: FolderTreeNode): void {
  console.log('RegulationItem node selected:', node.label);
  
  const regData = node.fileData as RegulationWithTOC;
  
  if (regData) {
    this.onRegulationSelect(regData);
  } else {
    // Try to find from loaded regulations
    const matchingReg = this.regulationsData.find(r => r.regulationName === node.label);
    if (matchingReg) {
      this.onRegulationSelect(matchingReg);
    } else {
      this.files = [];
      console.warn('No regulation data found for node:', node.label);
    }
  }
}

/**
 * Display all regulations in the grid
 */
displayAllRegulations(): void {
  console.log('Displaying all regulations');
  
  if (this.regulationsData && this.regulationsData.length > 0) {
    this.files = this.regulationsData.map(reg => ({
      id: reg.id,
      fileName: reg.regulationName,
      fullName: reg.regulationName,
      folderName: 'Regulations',
      ruleType: reg.ruleType,
      tocCount: reg.toc?.length || 0,
      regulationSetupUID: reg.regulationSetupUID,
      createdOn: null,
      fileType: 'regulation'
    }));
  } else {
    this.files = [];
  }
}

/**
 * Load compliance tracker documents from API
 */
loadComplianceDocuments(compId: string, node: FolderTreeNode): void {
  console.log('Loading compliance documents for compId:', compId);
  
  this.clientComplianceService.getComplianceTrackerDocuments(compId).subscribe({
    next: (documents: ComplianceTrackerDocument[]) => {
      console.log('Compliance Documents received:', documents);
      
      if (documents && documents.length > 0) {
        this.files = documents.map((doc, index) => ({
          id: index + 1,
          fileName: doc.fileName,
          fullName: doc.fileName,
          folderName: node.path?.[node.path.length - 2] || 'Documents',
          compId: doc.compId,
          fileContent: doc.fileContent,
          createdBy: doc.createdBy,
          isDelete: doc.isDelete,
          createdOn: doc.createdDate,
          // Add file type based on extension
          fileType: this.getFileExtension(doc.fileName)
        }));
      } else {
        // No documents found, show compliance info instead
        if (node.fileData) {
          const compData = node.fileData as PendingComplianceTracker;
          this.files = [{
            id: compData.id,
            fileName: `${compData.cmpId} - ${compData.forTheMonth}`,
            fullName: node.label,
            folderName: node.path?.[node.path.length - 2] || 'Location',
            regulationName: compData.regulationName,
            frequency: compData.frequency,
            dueDate: compData.dueDate,
            dueAmount: compData.dueAmount,
            amountPaid: compData.amountPaid,
            status: compData.approvalStatus,
            documentCount: compData.documentCount,
            financialYear: compData.financialYear,
            createdOn: compData.createdOn
          }];
        }
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
 * Get file extension from filename
 */
getFileExtension(fileName: string): string {
  if (!fileName) return '';
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Collect all compliance tracker files from node and children
 */
collectComplianceTrackerFiles(node: FolderTreeNode): any[] {
  let files: any[] = [];
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (child.foldertitle === 'Document' && child.fileData) {
        const compData = child.fileData as PendingComplianceTracker;
        files.push({
          id: compData.id,
          fileName: `${compData.cmpId} - ${compData.forTheMonth}`,
          fullName: child.label,
          folderName: child.path?.[child.path.length - 2] || 'Location',
          regulationName: compData.regulationName,
          frequency: compData.frequency,
          dueDate: compData.dueDate,
          dueAmount: compData.dueAmount,
          amountPaid: compData.amountPaid,
          status: compData.approvalStatus,
          documentCount: compData.documentCount,
          financialYear: compData.financialYear,
          createdOn: compData.createdOn
        });
      } else {
        files = [...files, ...this.collectComplianceTrackerFiles(child)];
      }
    }
  }
  
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

    const label =
      item.label ||
      item.folderName ||
      item.regulationName ||
      item.organizationName ||
      item.entityName ||
      `Item_${id}`;

    console.log('  Normalizing:', label, 'hasChildren:', !!item.children?.length);

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
        path: ["COMPSEQR360", "Organization", org.organizationName]
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
        path: orgPath
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

  /**
   * Compare entities for dropdown selection
   */
  compareEntities(entity1: UserAssignedEntity, entity2: UserAssignedEntity): boolean {
    return entity1 && entity2 ? entity1.id === entity2.id : entity1 === entity2;
  }

 //end
}
