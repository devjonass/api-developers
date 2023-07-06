import { QueryResult } from "pg";

interface iProjectRequest {
  name: string;
  description: string;
  estimatedTime: string;
  repository: string;
  startDate: Date;
  endDate?: Date | null;
  developerId: number;
}

interface iProjectResultt {
  id: number;
  name: string;
  description: string;
  estimatedTime: string;
  repository: string;
  startDate: string;
  endDate?: string;
}
interface iTechnologiesResult extends iProjectResultt {
  technologyId: number;
  technologyName: string;
}
interface iProjectsTechnology {
  id: number;
  addedIn: Date;
  projectId: number;
  technologyId: number;
}

type ProjectListRequired =
  | "name"
  | "description"
  | "estimatedTime"
  | "repository"
  | "startDate"
  | "developerId";
type iProjectResult = QueryResult<iProjectRequest>;
type iTechnologyAndProjectResult = QueryResult<iTechnologiesResult>;
type iTechnologyResult = QueryResult<iTechnologiesResult>;
type iProjectandTechnology = QueryResult<iProjectsTechnology>;
type TechnologyResult = QueryResult <iTechnologyResult>

export {
  iProjectRequest,
  iProjectResult,
  ProjectListRequired,
  iTechnologyResult,
  TechnologyResult,
  iProjectandTechnology,
  iTechnologyAndProjectResult,
};
