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
import { forkJoin, Observable } from 'rxjs';

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

  currentUserId: number= 1;
  selectedFolderTreeNodeItem: FolderTreeNode | null = null;
  breadcrumbPath: { label: string, node?: FolderTreeNode }[] = [];
  sidebarCollapsed: boolean = false; 
  complianceFolders: any[] = []; 
  selectedComplianceFolder: any = null; 
  complianceFiles: any[] = []; 
  
  
  userAssignedEntities: UserAssignedEntity[] = [];
  selectedEntity: UserAssignedEntity | null = null;
  pendingComplianceData: PendingComplianceTracker[] = [];
  locationMasterData: LocationMaster[] = [];
  
  
  regulationsData: RegulationWithTOC[] = [];
  selectedRegulation: RegulationWithTOC | null = null;
  typeOfComplianceList: TypeOfCompliance[] = [];
  selectedTOC: TypeOfCompliance | null = null;
  isLoadingRegulations: boolean = false;
  isLoadingTOC: boolean = false;
  
  
  noticesData: RegulationWithTOC[] = [];
  isLoadingNotices: boolean = false;
  noticesListByRegulation: Map<number, any[]> = new Map(); 

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
    
    this.loadClientComplianceTracker();
  }

  /**
   * Load Client Compliance Tracker data from API
   */
  loadClientComplianceTracker() {
    const userId = this.persistenceService.getUserId() || 16; 
    
    
    this.clientComplianceService.getUserAssignedEntities(userId).subscribe({
      next: (entities) => {
        this.userAssignedEntities = entities;
        
        if (entities.length > 0) {
          
          this.selectedEntity = entities[0];
          this.loadComplianceDataForEntity(this.selectedEntity.id, userId);
        } else {
          
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
    
    forkJoin({
      complianceData: this.clientComplianceService.getPendingComplianceTrackerByEntity(entityId, userId),
      locationData: this.clientComplianceService.getLocationMasterByEntity(entityId)
    }).subscribe({
      next: ({ complianceData, locationData }) => {
        this.pendingComplianceData = complianceData;
        this.locationMasterData = locationData;
        
        
        this.loadRegulationsForEntity(entityId, () => {
          
          this.loadNoticesForEntity(entityId, () => {
            
            this.buildComplianceTrackerTreeUI();
          });
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
        
        
        regulations.forEach(reg => {
        });
        
        
        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error('Error loading regulations:', err);
        this.isLoadingRegulations = false;
        this.notifier.notify('error', 'Failed to load regulations');
        
        if (callback) {
          callback();
        }
      }
    });
  }

  /**
   * Load notices regulations list with type of compliance (TOC) for entity
   * API: /Questionnaires/GetRegulationListByEntityId?entityId={entityId}&accessType=Notices
   * Also preloads notices list for each regulation using GetListOfNoticesByIds API
   */
  loadNoticesForEntity(entityId: number, callback?: () => void) {
    this.isLoadingNotices = true;
    this.noticesData = [];
    this.noticesListByRegulation.clear();
    
    this.clientComplianceService.getNoticesRegulationListByEntityId(entityId).subscribe({
      next: (notices: RegulationWithTOC[]) => {
        this.noticesData = notices;
        
        
        if (notices && notices.length > 0) {
          const noticesApiCalls: Observable<any>[] = [];
          const regulationIds: number[] = [];
          
          notices.forEach(notice => {
            if (notice.id) {
              regulationIds.push(notice.id);
              noticesApiCalls.push(
                this.clientComplianceService.getListOfNoticesByIds(entityId, notice.id)
              );
            }
          });
          
          
          if (noticesApiCalls.length > 0) {
            forkJoin(noticesApiCalls).subscribe({
              next: (responses: any[]) => {
                responses.forEach((response, index) => {
                  const regulationId = regulationIds[index];
                  const noticesList = response?.data || response?.notices || response || [];
                  const noticesArray = Array.isArray(noticesList) ? noticesList : [noticesList];
                  
                  
                  this.noticesListByRegulation.set(regulationId, noticesArray);
                });
                
                this.isLoadingNotices = false;
                
                
                if (callback) {
                  callback();
                }
              },
              error: (err) => {
                console.error('Error preloading notices list:', err);
                this.isLoadingNotices = false;
                
                if (callback) {
                  callback();
                }
              }
            });
          } else {
            this.isLoadingNotices = false;
            if (callback) {
              callback();
            }
          }
        } else {
          this.isLoadingNotices = false;
          
          if (callback) {
            callback();
          }
        }
      },
      error: (err) => {
        console.error('Error loading notices:', err);
        this.isLoadingNotices = false;
        
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
      return;
    }


    
    const addTOCToRegulationNodes = (nodes: FolderTreeNode[]) => {
      for (const node of nodes) {
        
        if (node.foldertitle === 'Regulation') {
          
          
          const matchingReg = regulations.find(r => r.regulationName === node.label);
          
          
          if (matchingReg && matchingReg.toc && matchingReg.toc.length > 0) {
            
            node.fileData = matchingReg;
            
            
            
            const existingTOCLabels = node.children?.filter(c => c.foldertitle === 'TOC').map(c => c.label) || [];
            
            matchingReg.toc.forEach(toc => {
              
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
              
              
              const tocComplianceData = this.pendingComplianceData.filter(
                item => item.tocId === toc.id && item.regulationName === matchingReg.regulationName
              );
              
              if (tocComplianceData.length > 0) {
                
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
              
              
              if (!node.children) {
                node.children = [];
              }
              node.children.unshift(tocNode);
            });
            
          }
        }
        
        
        if (node.children && node.children.length > 0) {
          addTOCToRegulationNodes(node.children);
        }
      }
    };

    addTOCToRegulationNodes(this.treeData);

    
    this.attachParentReferences(this.treeData);
    
    
    this.treeData = [...this.treeData];
    
  }

  /**
   * Build the Compliance Tracker folder tree UI
   */
  buildComplianceTrackerTreeUI() {
    const complianceTrackerRoot = this.buildClientComplianceTree();
    
    
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

      
      if (entity.id === this.selectedEntity?.id) {
        
        const regulatoryComplianceId = this.folderId++;
        const regulatoryComplianceNode: FolderTreeNode = {
          id: regulatoryComplianceId,
          label: 'Regulatory Compliance',
          parentId: entityId,
          expanded: true,
          foldertitle: 'RegulatoryCompliance',
          children: [],
          treeType: 'COMPSEQR360',
          path: [entity.entityName, 'Regulatory Compliance']
        };

        
        const complianceTrackerId = this.folderId++;
        const complianceTrackerNode: FolderTreeNode = {
          id: complianceTrackerId,
          label: 'Compliance Tracker',
          parentId: regulatoryComplianceId,
          expanded: true,
          foldertitle: 'ComplianceTracker',
          children: [],
          treeType: 'COMPSEQR360',
          path: [entity.entityName, 'Regulatory Compliance', 'Compliance Tracker']
        };

        
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
            path: [entity.entityName, 'Regulatory Compliance', 'Compliance Tracker', year]
          };

          const yearData = byFinancialYear[year];
          
          
          const byRegulation = this.groupByKey(yearData, 'regulationName');
          
          Object.keys(byRegulation).forEach(regName => {
            const regId = this.folderId++;
            const regNode: FolderTreeNode = {
              id: regId,
              label: regName,
              parentId: yearId,
              expanded: false,
              foldertitle: 'Regulation',
              children: [], 
              treeType: 'COMPSEQR360',
              path: [entity.entityName, 'Regulatory Compliance', 'Compliance Tracker', year, regName]
            };

            
            

            yearNode.children?.push(regNode);
          });

          complianceTrackerNode.children?.push(yearNode);
        });

        
        regulatoryComplianceNode.children?.push(complianceTrackerNode);
        
        
        const noticesId = this.folderId++;
        const noticesNode: FolderTreeNode = {
          id: noticesId,
          label: 'Notices',
          parentId: regulatoryComplianceId,
          expanded: false,
          foldertitle: 'Notices',
          children: [],
          treeType: 'COMPSEQR360',
          path: [entity.entityName, 'Regulatory Compliance', 'Notices']
        };
        
        
        if (this.noticesData && this.noticesData.length > 0) {
          this.noticesData.forEach(noticeReg => {
            const noticeRegId = this.folderId++;
            const noticeRegNode: FolderTreeNode = {
              id: noticeRegId,
              label: noticeReg.regulationName,
              parentId: noticesId,
              expanded: false,
              foldertitle: 'NoticeRegulation',
              children: [],
              treeType: 'COMPSEQR360',
              path: [entity.entityName, 'Regulatory Compliance', 'Notices', noticeReg.regulationName],
              fileData: noticeReg
            };
            
            
            const preloadedNotices = this.noticesListByRegulation.get(noticeReg.id);
            if (preloadedNotices && preloadedNotices.length > 0) {
              
              
              
              preloadedNotices.forEach((notice: any, index: number) => {
                const noticeItemId = this.folderId++;
                const noticeName = notice.subject || notice.complianceIds || notice.fileName || `Notice ${index + 1}`;
                
                
                const hasFile = notice.fileContent || notice.filecontent || notice.FileContent || 
                               notice.file || notice.attachment || notice.document;
                
                const noticeItemNode: FolderTreeNode = {
                  id: noticeItemId,
                  label: noticeName,
                  parentId: noticeRegId,
                  expanded: false,
                  foldertitle: 'NoticeItem',
                  children: [],
                  treeType: 'COMPSEQR360',
                  path: [entity.entityName, 'Regulatory Compliance', 'Notices', noticeReg.regulationName, noticeName],
                  isFile: false,
                  fileData: notice
                };
                
                noticeRegNode.children?.push(noticeItemNode);
              });
              
            }
            
            
            noticesNode.children?.push(noticeRegNode);
          });
          console.log(noticesNode)
        }
        
        
        regulatoryComplianceNode.children?.push(noticesNode);
        
        
        entityNode.children?.push(regulatoryComplianceNode);

        
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

    
    this.treeData = [...complianceTrackerNodes, dmsRoot];
    
    if (this.treeData.length > 0) {
    }
    
    
    if (this.regulationsData && this.regulationsData.length > 0) {
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
      
      const filteredResult = Array.isArray(result) ? result.filter((item: any) => 
        (item.label || item.folderName) !== 'COMPSEQR360'
      ) : [];

      
      const dmsRoot = this.treeData.find(n => n.treeType === 'DMS' && n.label === 'ProEDox');
      
      if (dmsRoot) {
        
        const normalizedDmsNodes = this.normalizeNodes(filteredResult, dmsRoot, 'DMS');
        dmsRoot.children = normalizedDmsNodes;
        this.markTreeType([dmsRoot], 'DMS');
        this.attachParentReferences([dmsRoot]);
      } else {
        
        
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

  onClickFolder(folderId: number) {
      this.selectedFolderId= folderId;
  }

  /**
   * View file content - handles base64 content, file path, and activity data
   */
  onViewClick(params: any): void {
    const data = params.data;
    
    // Check for fileContent in the row data
    if (data?.fileContent) {
      const fileName = data.fileName || data.fullName || 'document';
      this.viewBase64File(data.fileContent, fileName);
      return;
    }
    
    // Check for fileContent in activityData (for noticeActivity)
    if (data?.activityData?.fileContent) {
      const fileName = data.activityData.fileName || data.fileName || 'document';
      this.viewBase64File(data.activityData.fileContent, fileName);
      return;
    }
    
    // Check for fileContent in noticeData
    if (data?.noticeData?.fileContent) {
      const fileName = data.noticeData.fileName || data.fileName || 'document';
      this.viewBase64File(data.noticeData.fileContent, fileName);
      return;
    }
    
    // Check for fileContent in fileData
    if (data?.fileData?.fileContent) {
      const fileName = data.fileData.fileName || data.fileName || 'document';
      this.viewBase64File(data.fileData.fileContent, fileName);
      return;
    }
    
    // Fallback to first file in the list
    if (this.files[0]?.fileContent) {
      this.viewBase64File(this.files[0].fileContent, this.files[0].fileName);
      return;
    }
    
    // Try to open via file path in new tab
    if (data?.filePath) {
      window.open(data.filePath, '_blank');
      return;
    }
    
    // Try activityData filePath in new tab
    if (data?.activityData?.filePath) {
      window.open(data.activityData.filePath, '_blank');
      return;
    }
    
    // No viewable content found
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

  /**
   * View base64 encoded file content
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
      
      
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        
        console.warn('Popup blocked! Trying alternative approach...');
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


  
  searchFilter = 'Owned by me';
  private modalService = inject(NgbModal);

  folders: any[] = [];
  files: any[] = [];
  
  treeData: FolderTreeNode[] = [];

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  


  viewAllFiles() {
    
  }

  onSearchInputChange(searchQuery: string) {
    
    
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
    
    this.folders = [];
    this.folderService.getAllFolders().subscribe((result: any) => {
      this.getAllFilesbyFolderId(result[0]?.id);
      

      this.folders = result;
    });
  }

 

  
  
  
  
  
          
  
  
   
  

getcompdata() {
  this.folderService.getcompleteFolderList().subscribe((result: any) => {
    
    
    this.complianceFolders = [];
    
    
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

    this.attachParentReferences(normalizedCompNodes);
    this.attachParentReferences([dmsRoot]);

    this.treeData = [...normalizedCompNodes, dmsRoot];
    if (this.treeData.length > 0) {
      
      
      
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
      
    });
  }
  createSubFolder() {
    if (this.formgroupCreateFolder.valid && this.selectedFolderTreeNodeItem) {
      this.folderModel.folderName = this.formgroupCreateFolder.controls['folderName'].value;
      this.folderModel.isParent = false;
      this.folderModel.entityId =this.selectedEntityId;
      
      this.folderModel.parentId =this.selectedFolderTreeNodeItem.id;
      this.folderService.createFolder(this.folderModel).subscribe(
        (result: any) => {
          this.notifier.notify('success', 'Folder Created Successfully');
          
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

  
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  


  
  changeSearchFilter(filter: string) {
    this.searchFilter = filter;
    
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
  
  const realNode = this.findNodeById(this.treeData, item.id, item.treeType) || item;


  this.selectedFolderTreeNodeItem = realNode;
  this.buildBreadcrumbPath(realNode);

  if (realNode.isFile && realNode.fileData) {
    
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
  
  switch (foldertitle) {
    case 'Document':
      
      if (node.fileData) {
        const compData = node.fileData as PendingComplianceTracker;
        this.loadComplianceDocuments(compData.cmpId, node);
      }
      break;
    
    case 'Regulation':
      
      this.handleRegulationNodeSelection(node);
      break;
    
    case 'RegulationItem':
      
      this.handleRegulationItemSelection(node);
      break;
    
    case 'TOC':
      
      this.handleTOCNodeSelection(node);
      break;
    
    case 'NoticeRegulation':
      
      this.handleNoticeRegulationSelection(node);
      break;
    
    case 'NoticeItem':
      
      this.handleNoticeItemSelection(node);
      break;
    
    case 'NoticeTOC':
      
      this.handleNoticeTOCSelection(node);
      break;
    
    case 'RegulationsFolder':
      
      this.displayAllRegulations();
      break;
    
    case 'Location':
    case 'TypeOfCompliance':
    case 'FinancialYear':
    case 'ComplianceTracker':
    case 'RegulatoryCompliance':
    case 'Notices':
    case 'Entity':
      
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
  
  
  const entityId = this.selectedEntity?.id;
  if (!entityId) {
    console.error('No entity selected');
    this.files = this.collectComplianceTrackerFiles(node);
    return;
  }
  
  
  const existingReg = this.regulationsData.find(r => r.regulationName === node.label);
  
  if (existingReg && existingReg.toc && existingReg.toc.length > 0) {
    
    this.onRegulationSelect(existingReg);
  } else {
    
    this.isLoadingTOC = true;
    this.clientComplianceService.getRegulationListByEntityId(entityId).subscribe({
      next: (regulations: RegulationWithTOC[]) => {
        this.regulationsData = regulations;
        const matchingReg = regulations.find(r => r.regulationName === node.label);
        
        if (matchingReg) {
          this.onRegulationSelect(matchingReg);
        } else {
          
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
 * Handle Notice Regulation node selection - show preloaded notices data as sub-folders
 * Uses preloaded data from noticesListByRegulation (loaded at page init)
 */
handleNoticeRegulationSelection(node: FolderTreeNode): void {
  
  const regData = node.fileData as RegulationWithTOC;
  const entityId = this.selectedEntity?.id;
  
  if (regData && regData.id && entityId) {
    
    if (node.children && node.children.length > 0 && node.children[0].foldertitle === 'NoticeItem') {
      node.expanded = !node.expanded;
      this.files = [];
      return;
    }
    
    
    const preloadedNotices = this.noticesListByRegulation.get(regData.id);
    
    if (preloadedNotices && preloadedNotices.length > 0) {
      this.addNoticesToTreeNode(node, preloadedNotices);
    } else {
      
      
      this.clientComplianceService.getListOfNoticesByIds(entityId, regData.id).subscribe({
        next: (response: any) => {
          
          
          const noticesData = response?.data || response?.notices || response || [];
          const notices = Array.isArray(noticesData) ? noticesData : [noticesData];
          
          if (notices && notices.length > 0 && notices[0]) {
            
            this.noticesListByRegulation.set(regData.id, notices);
            this.addNoticesToTreeNode(node, notices);
          } else {
            this.files = [];
            this.notifier.notify('info', 'No notices found for this regulation');
          }
        },
        error: (err) => {
          console.error('Error loading notices:', err);
          this.notifier.notify('error', 'Failed to load notices');
          this.files = [];
        }
      });
    }
  } else {
    
    console.warn('Missing entityId or regulationId for notices');
    this.files = [];
    this.notifier.notify('info', 'Unable to load notices - missing entity or regulation information');
  }
}

/**
 * Helper method to add notices as sub-folders to a tree node
 */
addNoticesToTreeNode(node: FolderTreeNode, notices: any[]): void {
  
  node.children = [];
  
  
  if (notices.length > 0) {
  }
  
  notices.forEach((notice: any, index: number) => {
    const noticeId = this.folderId++;
    const noticeName = notice.subject || notice.complianceName || notice.fileName || `Notice ${index + 1}`;
    
    const noticeNode: FolderTreeNode = {
      id: noticeId,
      label: noticeName,
      parentId: node.id,
      expanded: false,
      foldertitle: 'NoticeItem',
      children: [],
      treeType: 'COMPSEQR360',
      path: [...(node.path || []), noticeName],
      isFile: false,
      fileData: notice 
    };
    
    node.children?.push(noticeNode);
  });
  
  
  node.expanded = true;
  this.files = []; 
  
  
  if (notices.length === 0) {
    this.notifier.notify('info', 'No notices found for this regulation');
  }
  
}

/**
 * Handle Notice Item (sub-folder) selection - display noticeActivity data in table
 */
handleNoticeItemSelection(node: FolderTreeNode): void {
  
  const noticeData = node.fileData;
  
  if (noticeData) {
    
    const regulationName = node.path && node.path.length >= 2 
      ? node.path[node.path.length - 2] 
      : 'Notice Regulation';
    
    // Check for noticeActivity data first
    const noticeActivityData = noticeData.noticeActivity || noticeData.noticeActivities || 
                               noticeData.activities || noticeData.NoticeActivity || [];
    const activities = Array.isArray(noticeActivityData) ? noticeActivityData : 
                       (noticeActivityData ? [noticeActivityData] : []);
    
    if (activities.length > 0) {
      // Display noticeActivity data in the table
      this.files = activities.map((activity: any, index: number) => ({
        id: activity.id || index + 1,
        fileName: activity.fileName || activity.documentName || activity.activityName || `Activity ${index + 1}`,
        fullName: activity.fileName || activity.documentName || activity.activityName || `Activity ${index + 1}`,
        folderName: node.label,
        complianceId: noticeData.complianceId || noticeData.id,
        subject: activity.subject || noticeData.subject,
        description: activity.description,
        activityDate: activity.activityDate,
        dueDate: activity.dueDate,
        status: activity.status,
        fileContent: activity.fileContent || null,
        filePath: activity.filePath || null,
        createdOn: activity.createdDate || activity.createdOn,
        createdBy: activity.createdBy,
        createdByName: activity.createdByName || noticeData.createdByName || '',
        fileType: activity.fileContent ? this.getMimeType(activity.fileName || '') : 'notice-activity',
        activityData: activity
      }));
    } else {
      // Fallback: check for files/documents/attachments
      const filesData = noticeData.files || noticeData.documents || noticeData.attachments || [];
      const files = Array.isArray(filesData) ? filesData : [];
      
      if (files.length > 0) {
        this.files = files.map((file: any, index: number) => ({
          id: file.id || index + 1,
          fileName: file.fileName || file.name || `File ${index + 1}`,
          fullName: file.fileName || file.name || `File ${index + 1}`,
          folderName: node.label,
          fileContent: file.fileContent || null,
          filePath: file.filePath || null,
          createdOn: file.createdDate || file.createdOn,
          createdBy: file.createdBy,
          createdByName: file.createdByName || noticeData.createdByName || '',
          fileType: file.fileContent ? this.getMimeType(file.fileName || '') : 'notice-file',
          fileData: file
        }));
      } else {
        // Show the notice itself as a row
        this.files = [{
          id: noticeData.id || 1,
          fileName: noticeData.fileName || noticeData.subject || node.label,
          fullName: noticeData.fileName || noticeData.subject || node.label,
          folderName: regulationName,
          complianceId: noticeData.complianceId || noticeData.id,
          subject: noticeData.subject,
          description: noticeData.description,
          noticeDate: noticeData.noticeDate,
          dueDate: noticeData.dueDate,
          status: noticeData.status,
          fileContent: noticeData.fileContent || null,
          filePath: noticeData.filePath || null,
          createdOn: noticeData.createdDate || noticeData.createdOn,
          createdBy: noticeData.createdBy,
          createdByName: noticeData.createdByName || '',
          fileType: noticeData.fileContent ? this.getMimeType(noticeData.fileName || '') : 'notice',
          noticeData: noticeData
        }];
      }
    }
    
  } else {
    this.files = [];
    this.notifier.notify('info', 'No data found for this notice');
  }
}

/**
 * Handle Notice TOC node selection - load and display documents for the Notice TOC
 * API: /ComplianceTracker/GetComplianceTrackerDocuments?CompId={typeOfComplianceUID}
 */
handleNoticeTOCSelection(node: FolderTreeNode): void {
  
  
  const tocData = node.fileData as TypeOfCompliance;
  
  if (tocData) {
    
    const regulationName = node.path && node.path.length >= 2 
      ? node.path[node.path.length - 2] 
      : 'Notice Regulation';
    
    
    const compId = tocData.typeOfComplianceUID;
    
    if (compId) {
      
      this.loadNoticeTOCDocuments(compId, node, tocData, regulationName);
    } else {
      
      console.warn('No typeOfComplianceUID found for Notice TOC:', node.label);
      this.displayNoticeTOCInfo(tocData, regulationName);
    }
  } else {
    console.warn('No TOC data found for Notice node:', node.label);
    this.files = [];
  }
}

/**
 * Load documents for a Notice TOC item from API
 * API: /ComplianceTracker/GetComplianceTrackerDocuments?CompId={compId}
 */
loadNoticeTOCDocuments(compId: string, node: FolderTreeNode, tocData: TypeOfCompliance, regulationName: string): void {
  
  this.clientComplianceService.getComplianceTrackerDocuments(compId).subscribe({
    next: (documents: ComplianceTrackerDocument[]) => {
      
      if (documents && documents.length > 0) {
        
        this.files = documents.map((doc, index) => ({
          id: index + 1,
          fileName: doc.fileName,
          fullName: doc.fileName,
          folderName: tocData.typeOfComplianceName,
          compId: doc.compId,
          fileContent: doc.fileContent,
          createdBy: doc.createdBy,
          isDelete: doc.isDelete,
          createdOn: doc.createdDate,
          regulationName: regulationName,
          typeOfComplianceName: tocData.typeOfComplianceName,
          ruleType: tocData.ruleType,
          frequency: tocData.frequency,
          fileType: this.getMimeType(doc.fileName)
        }));
      } else {
        
        this.displayNoticeTOCInfo(tocData, regulationName);
      }
    },
    error: (err) => {
      console.error('Error loading Notice TOC documents:', err);
      this.notifier.notify('error', 'Failed to load notice documents');
      
      this.displayNoticeTOCInfo(tocData, regulationName);
    }
  });
}

/**
 * Display Notice TOC information in grid (when no documents available)
 */
displayNoticeTOCInfo(tocData: TypeOfCompliance, regulationName: string): void {
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
    fileType: 'notice-toc',
    parameters: tocData.parameters
  }];
}

/**
 * Handle TOC node selection - load and display documents for the TOC
 * API: /ComplianceTracker/GetComplianceTrackerDocuments?CompId={typeOfComplianceUID}
 */
handleTOCNodeSelection(node: FolderTreeNode): void {
  
  
  const tocData = node.fileData as TypeOfCompliance;
  
  if (tocData) {
    
    this.selectedTOC = tocData;
    
    
    const regulationName = node.path && node.path.length >= 2 
      ? node.path[node.path.length - 2] 
      : 'Regulation';
    
    
    const parentReg = this.regulationsData.find(r => r.regulationName === regulationName);
    if (parentReg) {
      this.selectedRegulation = parentReg;
      this.typeOfComplianceList = parentReg.toc || [];
    }
    
    
    const compId = tocData.typeOfComplianceUID;
    
    if (compId) {
      
      this.loadTOCDocuments(compId, node, tocData, regulationName);
    } else {
      
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
  
  this.clientComplianceService.getComplianceTrackerDocuments(compId).subscribe({
    next: (documents: ComplianceTrackerDocument[]) => {
      
      if (documents && documents.length > 0) {
        
        
        this.files = documents.map((doc, index) => ({
          id: index + 1,
          fileName: doc.fileName,
          fullName: doc.fileName,
          folderName: tocData.typeOfComplianceName,
          compId: doc.compId,
          fileContent: doc.fileContent, 
          createdBy: doc.createdBy,
          isDelete: doc.isDelete,
          createdOn: doc.createdDate,
          
          regulationName: regulationName,
          typeOfComplianceName: tocData.typeOfComplianceName,
          ruleType: tocData.ruleType,
          frequency: tocData.frequency,
          
          fileType: this.getMimeType(doc.fileName)
        }));
        
      } else {
        
        this.displayTOCInfo(tocData, regulationName);
      }
    },
    error: (err) => {
      console.error('Error loading TOC documents:', err);
      this.notifier.notify('error', 'Failed to load documents');
      
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
  
  const regData = node.fileData as RegulationWithTOC;
  
  if (regData) {
    this.onRegulationSelect(regData);
  } else {
    
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
  
  this.clientComplianceService.getComplianceTrackerDocuments(compId).subscribe({
    next: (documents: ComplianceTrackerDocument[]) => {
      
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
          
          fileType: this.getFileExtension(doc.fileName)
        }));
      } else {
        
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



  getModuleType(label: any): string {
   if (label.includes("COMPSEQR360") && label.length > 1) {
  return label[1]?.toLowerCase();
} else if (label.includes("COMPSEQR360") && label.length === 1) {
  return label[0]?.toLowerCase();
} else {
  return label[0]?.toLowerCase();
}

  
  
  
  
  
}

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

  
  const isDmsPath = !path.some(n => 
    (n.foldertitle || '').toLowerCase() === 'compseqr360' ||
    n.label.toLowerCase() === 'compseqr360'
  );

  if (isDmsPath) {
    
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

    
    path.forEach(n => {
      if (n.label.toLowerCase() !== 'proedox' || path.indexOf(n) === 0) {
        this.breadcrumbPath.push({
          label: n.label,
          node: n
        });
      }
    });
  } else {
    
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

    
    const parentPath = parent?.path || [];
    if ((foldertitle || '').toLowerCase() === 'dms') {
      
      node.path = parentPath.length > 0 ? [...parentPath, label] : ['ProEDox', label];
    } else if (item.path && Array.isArray(item.path)) {
      
      node.path = [...item.path];
    } else {
      
      node.path = parentPath.length > 0 ? [...parentPath, label] : [label];
    }

    
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
    node.label.toLowerCase() === 'dms' || 
    (node.foldertitle || '').toLowerCase() === 'dms'
  ) || null;
}




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

    
    if (Array.isArray(item.compliance) && item.compliance.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.compliance, currentId, foldertitle, currentPath));
    }

    if (Array.isArray(item.toc) && item.toc.length > 0) {
      folder.children.push(...this.buildNestedComFolders(item.toc, currentId, foldertitle, currentPath));
    }

    
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

  
  const isOrgStructure = Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('organizationName');
  
  if (isOrgStructure) {
    
    const orgId = this.folderId++;
    const orgFolder: ComFolder = {
      label: "Organization",
      id: orgId,
      parentId: rootId,
      expanded: true,  
      children: [],
      foldertitle: "Organization",
      path: ["COMPSEQR360", "Organization"]
    };

    
    data.forEach((org: any) => {
      
      if (!org.isOrganization) {
        return;
      }


      const orgFolderId = this.folderId++;
      const orgItem: ComFolder = {
        label: org.organizationName,
        id: orgFolderId,
        parentId: orgId,
        expanded: true,  
        children: [],
        foldertitle: "Organization",
        path: ["COMPSEQR360", "Organization", org.organizationName]
      };

      
      if (Array.isArray(org.files) && org.files.length > 0) {
        org.files.forEach((fileFolder: any) => {
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

      
      if (this.hasFiles(item)) {
        complianceFolder.children.push(itemFolder);
      }
    });

    rootFolder.children.push(complianceFolder);
  } else {
    
    
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

    
    const announcementId = this.folderId++;
    const announcementFolder: ComFolder = {
      label: "Announcement",
      id: announcementId,
      parentId: rootId,
      expanded: false,
      children: [],
      foldertitle: "Announcement"
    };

    
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

    
    rootFolder.children.push(regulationFolder);
    rootFolder.children.push(orgFolder);
    rootFolder.children.push(announcementFolder);
  }
  
  
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
        expanded: false  
      })),
      totalFiles: this.getTotalFilesCount(item.files),
      expanded: false  
    };

    
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

    
    this.files = this.complianceFiles;
    
    
    this.selectedFolderTreeNodeItem = null;
  }

  /**
   * Clear compliance selection and return to normal folder view
   */
  clearComplianceSelection(): void {
    this.selectedComplianceFolder = null;
    this.complianceFiles = [];
    
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
    
    
    if (complianceFolder.expanded) {
      this.complianceFolders.forEach(folder => {
        if (folder.id !== complianceFolder.id) {
          folder.expanded = false;
          
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
    
    this.files = [{
      ...file,
      folderName: subfolder.folderName,
      fullName: `${complianceFolder.name}/${subfolder.folderName}/${file.fileName}`
    }];
    
    
    this.selectedComplianceFolder = complianceFolder;
    
    
    this.selectedFolderTreeNodeItem = null;
  }

  /**
   * Compare entities for dropdown selection
   */
  compareEntities(entity1: UserAssignedEntity, entity2: UserAssignedEntity): boolean {
    return entity1 && entity2 ? entity1.id === entity2.id : entity1 === entity2;
  }

 
}
