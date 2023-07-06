import { Request, Response } from "express";
import format from "pg-format";
import {
  developerInfos,
  developerInfosResult,
  developerResult,
  developerResultInfos,
  iDeveloperInfosRequest,
  iDeveloperReq,
  iDeveloperRequest,
  iDevelopers,
} from "../interfaces/developers.interfaces";
import { client } from "../database";
import { QueryConfig } from "pg";

const createDeveloper = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, email }: iDevelopers = req.body;
  const developerData = { name, email };

  if (!name || !email) {
    return res.status(400).json({
      message: `Missing required keys: name and email!`,
    });
  }

  const queryString: string = format(
    `
              INSERT INTO
                      developers (%I)
              VALUES (%L)
              RETURNING *;
          
          `,
    Object.keys(developerData),
    Object.values(developerData)
  );
  const queryResult: developerResult = await client.query(queryString);

  return res.status(201).json(queryResult.rows[0]);
};

const createDeveloperInfos = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const developerId: number = parseInt(req.params.id);
    const developerSince = new Date(req.body.developerSince);
    const { preferredOS }: iDeveloperInfosRequest = req.body;
    const developerInfos = { developerSince, preferredOS };

    if (!developerSince || !preferredOS) {
      return res.status(400).json({
        message: "Required keys are: developerSince and preferredOS.",
      });
    }
    const required: string[] = ["Windows", "Linux", "MacOS"];
    if (!required.includes(preferredOS)) {
      const error: string = `The only values are: ${required.join(", ")}!`;
      return res.status(400).json({
        message: "Invalid OS option.",
        options: ["Windows", "Linux", "MacOS"],
      });
    }

    let queryString: string = "SELECT * FROM developers WHERE id = $1;";

    let queryConfig: QueryConfig = {
      text: queryString,
      values: [developerId],
    };
    let queryResult: developerResult = await client.query(queryConfig);

    if (queryResult.rows[0].developerInfoId) {
      return res.status(400).json({
        message: "Developer infos already exists.",
      });
    }

    let queryTemplate: string = format(
      `
          INSERT INTO
              developer_infos (%I)
          VALUES (%L)
          RETURNING *;
         
         `,
      Object.keys(developerInfos),
      Object.values(developerInfos)
    );

    let queryResultTwo: developerInfos = await client.query(queryTemplate);

    queryString = `
    UPDATE
        developers
    SET
        "developerInfoId" = $1
    WHERE
        id = $2
    RETURNING *;
  `;

    queryConfig = {
      text: queryString,
      values: [queryResultTwo.rows[0].id, developerId],
    };

    await client.query(queryConfig);

    return res.status(201).json(queryResultTwo.rows[0]);
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const listDevelopers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const queryString: string = `
    SELECT 
        de."id" "developerID",
        de."name" "developerName",
        de."email" "developerEmail",
        de."developerInfoId",
        di."developerSince" "developerInfoDeveloperSince",
        di."preferredOS" "developerInfoPreferredOS"
    FROM 
        developers de
    LEFT JOIN 
        developer_infos di ON de."developerInfoId" = di.id;
       
    `;

  const queryResult: developerInfosResult = await client.query(queryString);

  return res.json(queryResult.rows);
};

const listDevelopersInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);

  const queryString: string = `
      SELECT 
          de."id" "developerID",
          de."name" "developerName",
          de."email" "developerEmail",
          de."developerInfoId",
          di."developerSince" "developerInfoDeveloperSince",
          di."preferredOS" "developerInfoPreferredOS"
      FROM 
          developers de
     LEFT JOIN 
          developer_infos di ON de."developerInfoId" = di.id
      WHERE
         de.id = $1;
         
      `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [developerId],
  };
  const queryResult: developerInfosResult = await client.query(queryConfig);
  return res.json(queryResult.rows);
};

const listDeveloperIdAndProject = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);
  const queryString: string = `
    SELECT
       de."id" "developerID",
       de."name" "developerName",
       de."email" "developerEmail",
       di."id" "developerInfoId",
       di."developerSince" "developerInfoDeveloperSince",
       di."preferredOS" "developerInfoPreferredOS",
       po."id" "projectID",
       po."name" "projectName",
       po."description" "projectDescription",
       po."estimatedTime" "projectEstimatedTime",
       po."repository" "projectRepository",
       po."startDate" "projectStartDate",
       po."endDate" "projectEndDate",
       tc."id" "technologyId",
       tc."name" "technologyName"
    FROM
      developers de
   LEFT JOIN developer_infos di ON de."developerInfoId" = di.id
   LEFT JOIN projects po ON po."developerId" = de.id
   LEFT JOIN projects_technologies pt ON po.id = pt."projectId"
   LEFT JOIN technologies tc ON tc.id = pt."technologyId"
    WHERE
      de.id = $1;
`;
  const queryConfig: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  const queryResult = await client.query(queryConfig);

  return res.json(queryResult.rows);
};

const updateDeveloperInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);
  const { name, email }: iDeveloperRequest = req.body;

  let developerData = {};

  if (name !== undefined) {
    developerData = { name, ...developerData };
  }
  if (email !== undefined) {
    developerData = { email, ...developerData };
  }

  if (!name && !email) {
    return res.status(400).json({
      message: "At least one of those keys must be send.",
      keys: ["name", "email"],
    });
  }
  const formatString: string = format(
    `
          UPDATE 
              developers
          SET(%I) = ROW(%L)
          WHERE
              id = $1
          RETURNING *;
        
        `,
    Object.keys(developerData),
    Object.values(developerData)
  );

  const queryConfig: QueryConfig = {
    text: formatString,
    values: [developerId],
  };
  const queryResult: developerResult = await client.query(queryConfig);

  return res.json(queryResult.rows[0]);
};

const updateDevelopersInfosId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const developerId: number = parseInt(req.params.id);
    const developerSince = new Date(req.body.developerSince);
    const { preferredOS }: iDeveloperReq = req.body;
    let developerInfosData = {};

    if (req.body.developerSince !== undefined) {
      developerInfosData = { developerSince, ...developerInfosData };
    }
    if (preferredOS !== undefined) {
      developerInfosData = { preferredOS, ...developerInfosData };
    }

    if (!req.body.developerSince && !preferredOS) {
      return res.status(400).json({
        message: "At least one of those keys must be send.",
        keys: ["developerSince", "preferredOS"],
      });
    }
    const required: string[] = ["Windows", "Linux", "MacOS"];
    if (preferredOS && !required.includes(preferredOS)) {
      return res.status(400).json({
        message: "Invalid OS option.",
        options: ["Windows", "Linux", "MacOS"],
      });
    }

    const queryString = `
    SELECT 
        *
    FROM
        developers
    WHERE
        id = $1;
  `;
    let queryConfig: QueryConfig = {
      text: queryString,
      values: [developerId],
    };
    const queryResultDeveloper = await client.query(queryConfig);

    if (queryResultDeveloper.rowCount === 0) {
      return res.status(404).json({
        message: "developer not found",
      });
    }
    const formatString: string = format(
      `
      UPDATE 
          developer_infos
      SET(%I) = ROW(%L)
      WHERE
          id = $1
      RETURNING *;
          
    `,
      Object.keys(developerInfosData),
      Object.values(developerInfosData)
    );
    queryConfig = {
      text: formatString,
      values: [queryResultDeveloper.rows[0].developerInfoId],
    };
    const queryResult: developerResultInfos = await client.query(queryConfig);

    return res.json(queryResult.rows[0]);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({
      message: "internal troll",
    });
  }
};

const deleteDeveloper = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);
  let queryString: string = `
  SELECT 
      *
  FROM
      developers
  WHERE
      id = $1;
`;
  let queryConfig: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  let queryResult: developerResult = await client.query(queryConfig);

  if (queryResult.rows[0].developerInfoId) {
    queryString = "DELETE FROM developer_infos WHERE id = $1;";
    queryConfig = {
      text: queryString,
      values: [queryResult.rows[0].developerInfoId],
    };
    await client.query(queryConfig);
  } else {
    queryString = "DELETE FROM developers WHERE id = $1;";
    queryConfig = {
      text: queryString,
      values: [developerId],
    };
    await client.query(queryConfig);
  }

  return res.status(204).send();
};
export {
  createDeveloper,
  createDeveloperInfos,
  listDevelopers,
  listDevelopersInfo,
  updateDeveloperInfo,
  updateDevelopersInfosId,
  deleteDeveloper,
  listDeveloperIdAndProject,
};
