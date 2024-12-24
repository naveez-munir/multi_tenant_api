export interface ITenant {
  _id?: string;
  name: string;
  databaseName: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
