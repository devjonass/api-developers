import { QueryResult } from "pg";

interface iDevelopers {
  id: number;
  name: string;
  email: string;
  developerInfoId: number | null;
}
interface iDeveloperReq extends iDevelopers {
  developerSince: Date;
  preferredOS: string;
}
interface iDeveloperInfosRequest {
  developerSince: Date;
  preferredOS: string;
}
interface iDeveloperInfo extends iDeveloperInfosRequest {
  id: number;
}

interface iDeveloperRequest {
  name: string;
  email: string;
}

type developerInfo = iDevelopers & iDeveloperReq;
type developerInfosResult = QueryResult<developerInfo>;
type developerResult = QueryResult<iDevelopers>;
type developerResultInfos = QueryResult<iDeveloperReq>;
type developerInfos = QueryResult<iDeveloperInfo>

export {
  iDevelopers,
  developerResult,
  iDeveloperReq,
  developerInfosResult,
  iDeveloperInfosRequest,
  iDeveloperRequest,
  developerResultInfos,
  developerInfos 
};
