export interface HeaderMenuItem{
    id: number;
    title: string;
    icon: string;
    route: string;
    hasAccess: boolean;
    parentId?: number | null;
    sortOrder?: number | null;
}