import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { FolderModel,FileModel, FileDetail } from '../Models/folderModel';
import { forkJoin, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  //    formData.append('file', file);
  // Inserting every file to formData
  // for (const file of files) {
  //     // Use the name as file
  //     // as mock backend configured
  //     // to get file as input in the name of file
  //     formData.append('file', file);
  // }
  // return this.http.post<any>(
  //   `${this.BASEURL}/FileUpload/FileUpload?folderId=${fileModel.folderId}&userId=${fileModel.userId}`,formData,
  //   );
  //}



  private BASEURL: any = '';
  public error: any;


  friends: Array<any> = [];
  public headers: Array<any> = [];

  constructor(public http: HttpClient, private config: AppConfig) {

    this.BASEURL = this.config.ServiceUrl;
    this.http = http;
    this.headers = [];
    this.headers.push('Content-Type', 'application/json');
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);

    if (currentUser && currentUser.access_token) {
      this.headers.push('Authorization', 'Bearer ' + currentUser.token);
    }
  }

  getAuthHeaders() {
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);
    if (currentUser && currentUser.access_token) {
      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token } };

    }
    return { headers: { 'Authorization': 'Bearer ' } };
  }


  getAuthHeadersJSON() {
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);
    if (currentUser && currentUser.access_token) {

      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token, 'Content-Type': 'application/json' } };

    }
    return { headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' } };
  }
  getImageAuthHeadersJSON() {
    return { headers: undefined };
  }

  getHeadersJSON() {
    return { headers: { 'Content-Type': 'application/json' } }
  }


  getAllFolders() {
    return this.http.get<Array<FolderModel>>(this.BASEURL + '/FolderManagement/FoldersByEntity', this.getAuthHeadersJSON());
  }
  getcompleteFolderList() {
    return this.http.get(this.BASEURL + '/FileUpload/GetComseq', this.getAuthHeadersJSON());
  }
  getGetFolderTree(selectedEntityId: number, currentUserId: any) {
    return this.http.get<Array<FolderModel>>(
      `${this.BASEURL}/FolderManagement/tree?intityId=${selectedEntityId}&userId=${currentUserId}`,
      this.getAuthHeadersJSON()
  );
  }
  getFilesbyFolderId(id: any, type: any = 'Dms', filters?: {
    regulationId?: number;
    auditType?: string;
    financialYear?: string;
  }, userId?: number, userType: 'User' | 'DmsUser' = 'User') {
    let url = `${this.BASEURL}/FileUpload/getFiles?folderId=${id}&mtype=${type}`;
    if (filters?.regulationId != null) url += `&regulationId=${filters.regulationId}`;
    if (filters?.auditType)            url += `&auditType=${encodeURIComponent(filters.auditType)}`;
    if (filters?.financialYear)        url += `&financialYear=${encodeURIComponent(filters.financialYear)}`;
    if (userId != null)                url += `&userId=${userId}&userType=${userType}`;
    return this.http.get<Array<FolderModel>>(url, this.getAuthHeadersJSON());
  }

  /**
   * GET /api/FileUpload/getFile?fileId={id}&userId={id}&userType={optional} —
   * a single DMS/ProEDox file by id (scoped to module_type = 'proedox'
   * folders only; a Compliance Tracker/Opinion/Audit document id 404s here).
   * 404s for both "doesn't exist" and "exists but no access", so callers
   * should treat any error the same way rather than distinguishing them.
   */
  getFileById(fileId: number, userId: number, userType: 'User' | 'DmsUser' = 'User') {
    return this.http.get<FileDetail>(`${this.BASEURL}/FileUpload/getFile?fileId=${fileId}&userId=${userId}&userType=${userType}`, this.getAuthHeadersJSON());
  }

  getOpinionAuditDocument(apiType: 'Opinions' | 'Audits', recordId: number, documentId: number) {
    const url = `${this.BASEURL}/${apiType}/${recordId}/documents/${documentId}/view`;
    const auth = this.getAuthHeaders();
    return this.http.get(url, { headers: auth.headers as any, responseType: 'blob' });
  }

  getFileByPathUrl(filePath: string, downloadFileName?: string): string {
    const params = new URLSearchParams({ filePath });
    if (downloadFileName) params.set('downloadFileName', downloadFileName);
    return `${this.BASEURL}/FileUpload/GetFileByPath?${params}`;
  }

  getFileByPath(filePath: string, downloadFileName?: string) {
    const auth = this.getAuthHeaders();
    return this.http.get(this.getFileByPathUrl(filePath, downloadFileName), { headers: auth.headers as any, responseType: 'blob' });
  }

  deleteFile(fileId: number, userId: number, userType: 'User' | 'DmsUser' = 'User') {
    return this.http.delete<any>(`${this.BASEURL}/FileUpload/deleteFile?fileId=${fileId}&userId=${userId}&userType=${userType}`, this.getAuthHeadersJSON());
  }

  renameFile(fileId: number, newFileName: string, userId: number, userType: 'User' | 'DmsUser' = 'User') {
    return this.http.put<any>(`${this.BASEURL}/FileUpload/RenameFile?fileId=${fileId}&newFileName=${encodeURIComponent(newFileName)}&userId=${userId}&userType=${userType}`, null, this.getAuthHeadersJSON());
  }

  renameFolder(folderId: number, newName: string, userId: number, userType: 'User' | 'DmsUser' = 'User') {
    return this.http.put<any>(`${this.BASEURL}/FolderManagement/RenameFolder?folderId=${folderId}&newName=${encodeURIComponent(newName)}&userId=${userId}&userType=${userType}`, null, this.getAuthHeadersJSON());
  }

  deleteFolder(folderId: number, userId: number, force = false, userType: 'User' | 'DmsUser' = 'User') {
    return this.http.delete<any>(`${this.BASEURL}/FolderManagement/DeleteFolder?folderId=${folderId}&userId=${userId}&userType=${userType}&force=${force}`, this.getAuthHeadersJSON());
  }

createFolder(folderModel: FolderModel) {
  return this.http.post<boolean>(this.BASEURL + '/FolderManagement/create-folder', folderModel,this.getAuthHeadersJSON());

}
//uploadFile(fileModel: FileModel,file: File){
  // Formdata to store files to send it
        // as a multipart/form-data post request
  //      const formData = new FormData();
    //    formData.append('file', file);

        // Inserting every file to formData
        // for (const file of files) {

        //     // Use the name as file
        //     // as mock backend configured
        //     // to get file as input in the name of file
        //     formData.append('file', file);
        // }
  // return this.http.post<any>(
  //   `${this.BASEURL}/FileUpload/FileUpload?folderId=${fileModel.folderId}&userId=${fileModel.userId}`,formData,
  //   );

//}
uploadFile( fileModel: FileModel,file: File): Observable<any> {
  const formData: FormData = new FormData();
  formData.append('file', file, file.name);
  //formData.append('folderId', fileModel.folderId.toString());
  //formData.append('userId', fileModel.userId.toString());

  const headers = new HttpHeaders();
  headers.append('Accept', 'application/json');

  return this.http.post<any>(`${this.BASEURL}/FileUpload/FileUpload?folderId=${fileModel.folderId}&userId=${fileModel.userId}`, formData, { headers });
}
}
