import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { FolderModel,FileModel } from '../Models/folderModel';
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
  getFilesbyFolderId(id: any,type:any='Dms') {
    return this.http.get<Array<FolderModel>>(
        `${this.BASEURL}/FileUpload/getFiles?folderId=${id}&mtype=${type}`,
        this.getAuthHeadersJSON()
    );
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

/**
 * Get data by type and id for regulations, organizations, and announcements
 * @param type - 'regulation', 'organization', or 'announcement'
 * @param id - The ID of the item
 * @param subType - Optional subType for regulations ('regulation' or 'tocdues')
 */
getDataByTypeAndId(type: string, id: number, subType?: string): Observable<any> {
  let url = `${this.BASEURL}/Dms/GetDataByTypeAndId?type=${type}&id=${id}`;
  if (subType) {
    url += `&subType=${subType}`;
  }
  return this.http.get<any>(url, this.getAuthHeadersJSON());
}

/**
 * Get file by ID to view/download
 * @param fileId - The ID of the file
 * @param type - Optional type: 'regulation', 'organization', 'announcement'
 * @param subType - Optional subType for regulations: 'regulation', 'tocdues'
 */
getFileById(fileId: number, type?: string, subType?: string): Observable<any> {
  let url = `${this.BASEURL}/FileUpload/GetFileById?fileId=${fileId}`;
  if (type) {
    url += `&type=${type}`;
  }
  if (subType) {
    url += `&subType=${subType}`;
  }
  return this.http.get<any>(url, this.getAuthHeadersJSON());
}
}
