import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { 
  UserAssignedEntity, 
  PendingComplianceTracker, 
  LocationMaster,
  LocationMasterResponse,
  ComplianceTrackerDocument,
  RegulationWithTOC,
  TypeOfCompliance
} from '../Models/compliancetracker';
import { AppConfig } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class ClientComplianceTrackerService {
  // Client API base URL
  private readonly CLIENT_API_URL = this.config.ServiceUrl;

  constructor(private http: HttpClient,private config: AppConfig) {}

  private getAuthHeaders() {
    const currentU: any = localStorage.getItem('currentUser');
    const currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return {
        headers: {
          'Authorization': 'Bearer ' + currentUser.access_token,
          'Content-Type': 'application/json'
        }
      };
    }
    return {
      headers: {
        'Authorization': 'Bearer ',
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Get user assigned entities
   * API: /UserEntity/GetUserAssignedEntities/{userId}
   */
  getUserAssignedEntities(userId: number): Observable<UserAssignedEntity[]> {
    return this.http.get<UserAssignedEntity[]>(
      `${this.CLIENT_API_URL}/UserEntity/GetUserAssignedEntities/${userId}`,
      this.getAuthHeaders()
    );
  }

  /**
   * Get pending compliance tracker list by entity
   * API: /ComplianceTracker/GetPendingComplianceTrackerListByEntityId?entityId={entityId}&userId={userId}
   */
  getPendingComplianceTrackerByEntity(entityId: number, userId: number): Observable<PendingComplianceTracker[]> {
    return this.http.get<PendingComplianceTracker[]>(
      `${this.CLIENT_API_URL}/ComplianceTracker/GetPendingComplianceTrackerListByEntityId?entityId=${entityId}&userId=${userId}`,
      this.getAuthHeaders()
    );
  }

  /**
   * Get location master data by entity
   * API: /LocationMaster/GetLocationMasterDataByEntityId/{entityId}
   */
  getLocationMasterByEntity(entityId: number): Observable<LocationMaster[]> {
    return this.http.get<LocationMasterResponse>(
      `${this.CLIENT_API_URL}/LocationMaster/GetLocationMasterDataByEntityId/${entityId}`,
      this.getAuthHeaders()
    ).pipe(
      map((response: LocationMasterResponse) => {
        if (response.success && response.data) {
          return JSON.parse(response.data) as LocationMaster[];
        }
        return [];
      })
    );
  }

  /**
   * Get compliance tracker documents by CompId
   * API: /ComplianceTracker/GetComplianceTrackerDocuments?CompId={compId}
   * Note: API may return a single object or an array, so we normalize to array
   */
  getComplianceTrackerDocuments(compId: string): Observable<ComplianceTrackerDocument[]> {
    return this.http.get<ComplianceTrackerDocument | ComplianceTrackerDocument[]>(
      `${this.CLIENT_API_URL}/ComplianceTracker/GetComplianceTrackerDocuments?CompId=${compId}`,
      this.getAuthHeaders()
    ).pipe(
      map((response: ComplianceTrackerDocument | ComplianceTrackerDocument[]) => {
        // Normalize response to always be an array
        if (!response) {
          return [];
        }
        if (Array.isArray(response)) {
          return response;
        }
        // Single object - wrap in array
        return [response];
      })
    );
  }

  /**
   * Get regulations list with type of compliance (TOC) by entity ID
   * API: /Questionnaires/GetRegulationListByEntityId?entityId={entityId}
   */
  getRegulationListByEntityId(entityId: number): Observable<RegulationWithTOC[]> {
    return this.http.get<RegulationWithTOC[]>(
      `${this.CLIENT_API_URL}/Questionnaires/GetRegulationListByEntityId?entityId=${entityId}`,
      this.getAuthHeaders()
    );
  }

  /**
   * Build compliance tracker tree structure based on the flow:
   * Entity → Compliance Tracker → Financial Year → Regulations → Type of Compliances → Location → Documents
   */
  buildComplianceTrackerTree(
    entities: UserAssignedEntity[],
    complianceData: PendingComplianceTracker[],
    locations: LocationMaster[]
  ): any[] {
    const tree: any[] = [];

    // Create location map for quick lookup
    const locationMap = new Map<number, LocationMaster>();
    locations.forEach(loc => locationMap.set(loc.Id, loc));

    // Group compliance data by financial year
    const byFinancialYear = this.groupBy(complianceData, 'financialYear');

    // For each financial year
    Object.keys(byFinancialYear).sort().reverse().forEach(year => {
      const yearData = byFinancialYear[year];
      
      const yearNode: any = {
        label: year,
        id: this.generateId(),
        expanded: false,
        children: [],
        nodeType: 'financialYear',
        path: ['Compliance Tracker', year]
      };

      // Group by regulation
      const byRegulation = this.groupBy(yearData, 'regulationName');

      Object.keys(byRegulation).forEach(regName => {
        const regData = byRegulation[regName];
        
        const regulationNode: any = {
          label: regName,
          id: this.generateId(),
          expanded: false,
          children: [],
          nodeType: 'regulation',
          path: ['Compliance Tracker', year, regName]
        };

        // Group by type of compliance (tocId or use frequency/type)
        const byCompliance = this.groupBy(regData, 'tocId');

        Object.keys(byCompliance).forEach(tocId => {
          const compData = byCompliance[tocId];
          const firstItem = compData[0];
          const complianceLabel = firstItem.complianceName || `${firstItem.frequency} Compliance`;
          
          const complianceNode: any = {
            label: complianceLabel,
            id: this.generateId(),
            expanded: false,
            children: [],
            nodeType: 'compliance',
            path: ['Compliance Tracker', year, regName, complianceLabel]
          };

          // Group by location
          const byLocation = this.groupBy(compData, 'locationId');

          Object.keys(byLocation).forEach(locId => {
            const locData = byLocation[locId];
            const location = locationMap.get(parseInt(locId));
            const locationLabel = location 
              ? `${location.Id}-${location.LocationName}` 
              : `Location ${locId}`;

            const locationNode: any = {
              label: locationLabel,
              id: this.generateId(),
              expanded: false,
              children: [],
              nodeType: 'location',
              locationData: location,
              path: ['Compliance Tracker', year, regName, complianceLabel, locationLabel]
            };

            // Add documents (compliance tracker items with month)
            locData.forEach((item: PendingComplianceTracker) => {
              const docLabel = `${item.cmpId} - ${item.forTheMonth}`;
              
              const documentNode: any = {
                label: docLabel,
                id: this.generateId(),
                expanded: false,
                children: [],
                nodeType: 'document',
                isFile: false, // This is a folder containing documents
                complianceData: item,
                path: ['Compliance Tracker', year, regName, complianceLabel, locationLabel, docLabel]
              };

              locationNode.children.push(documentNode);
            });

            complianceNode.children.push(locationNode);
          });

          regulationNode.children.push(complianceNode);
        });

        yearNode.children.push(regulationNode);
      });

      tree.push(yearNode);
    });

    return tree;
  }

  private groupBy(array: any[], key: string): { [key: string]: any[] } {
    return array.reduce((result, item) => {
      const keyValue = item[key] || 'Unknown';
      (result[keyValue] = result[keyValue] || []).push(item);
      return result;
    }, {} as { [key: string]: any[] });
  }

  private generateId(): number {
    return Math.floor(Math.random() * 1e9);
  }
}
