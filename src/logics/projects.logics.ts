import { Request, Response } from "express";
import format from "pg-format";
import { client } from "../database";
import { QueryConfig } from "pg";
import {
  iProjectandTechnology,
  iProjectRequest,
  iProjectResult,
  iTechnologyAndProjectResult,
  iTechnologyResult,
  TechnologyResult,
} from "../interfaces/projects.interfaces";
import { developerResult } from "../interfaces/developers.interfaces";

const createProjects = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      name,
      description,
      estimatedTime,
      repository,
      startDate,
      endDate,
      developerId,
    }: iProjectRequest = req.body;

    let projectData: iProjectRequest = {
      name,
      description,
      estimatedTime,
      repository,
      startDate,
      developerId,
    };

    if (!name || !description || !estimatedTime || !repository || !startDate) {
      return res.status(400).json({
        message:
          "Missing required keys: description, estimatedTime, repository, startDate",
      });
    }

    if (endDate) {
      projectData = { endDate, ...projectData };
    }

    const queryTemplate: string = `
        SELECT 
            *
        FROM  
            developers de
        WHERE
           de.id = $1;     
      `;
    const queryConfig: QueryConfig = {
      text: queryTemplate,
      values: [developerId],
    };

    let queryResult: developerResult = await client.query(queryConfig);

    if (queryResult.rowCount <= 0) {
      return res.status(404).json({
        message: "Developer not found!",
      });
    }
    const queryString: string = format(
      `
            INSERT INTO
                projects (%I)
            VALUES (%L)
            RETURNING *;          
        `,

      Object.keys(projectData),
      Object.values(projectData)
    );

    let queryResultTwo: iProjectResult = await client.query(queryString);

    return res.status(201).json(queryResultTwo.rows[0]);
  } catch (error: any) {
    console.log(error.message);
    if (error.message.includes("date/time field value out of range")) {
      return res.status(409).json({
        message: "incorrect date pattern, expected: years-month-days",
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const createTechnologiesandIdProject = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const projectsData: iProjectRequest = req.body;
  const date = new Date();
  let queryString: string = `
  SELECT
      *
  FROM
      technologies
  WHERE
      name = $1;
`;
  let queryConfig: QueryConfig = {
    text: queryString,
    values: [projectsData.name],
  };

  const queryResult: iTechnologyResult = await client.query(queryConfig);

  if (queryResult.rowCount === 0) {
    return res.status(400).json({
      message: "Technology not supported.",
      options: [
        "JavaScript",
        "Python",
        "React",
        "Express.js",
        "HTML",
        "CSS",
        "Django",
        "PostgreSQL",
        "MongoDB",
      ],
    });
  }
  queryString = `
    INSERT INTO
        projects_technologies ("addedIn", "projectId", "technologyId")
    VALUES
        ($1,$2,$3)
    RETURNING *;
  `;

  queryConfig = {
    text: queryString,
    values: [date, projectId, queryResult.rows[0].id],
  };
  const queryResultTechnologies: iProjectandTechnology = await client.query(
    queryConfig
  );

  queryString = `
    SELECT 
       tc."id" "technologyId",
       tc.name "technologyName",
       po."id" "projectId",
       po."name" "projectName",
       po."description" "projectDescription",
       po."estimatedTime" "projectEstimatedTime",
       po."repository" "projectRepository",
       po."startDate" "projectStartDate",
       po."endDate" "projectEndDate"
    FROM
        projects_technologies pt
    JOIN technologies tc ON pt."technologyId" = tc.id
    JOIN projects po ON pt."projectId" = po.id
    
    WHERE 
        pt."id" = $1;
        
  `;
  queryConfig = {
    text: queryString,
    values: [queryResultTechnologies.rows[0].id],
  };

  let queryResultAll: iTechnologyAndProjectResult = await client.query(
    queryConfig
  );

  return res.status(201).json(queryResultAll.rows[0]);
};

const listProjects = async (req: Request, res: Response): Promise<Response> => {
  const queryString: string = `
  SELECT 
      po."id" "projectID",
      po."name" "projectName",
      po."description" "projectDescription",
      po."estimatedTime" "projectEstimatedTime",
      po."repository" "projectRepository",
      po."startDate" "projectStartDate",
      po."endDate" "projectEndDate",
      po."developerId" "projectDeveloperID",
      tc."id" "technologyId",
      tc."name" "technologyName"
  FROM 
      projects po
  LEFT JOIN 
      projects_technologies pt ON po.id = pt."projectId"
  LEFT JOIN 
      technologies tc ON tc.id = pt."technologyId";
  
  `;

  const queryResult: iProjectResult = await client.query(queryString);

  return res.json(queryResult.rows);
};

const listProjectsId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const queryString: string = `
  SELECT 
      po."id" "projectID",
      po."name" "projectName",
      po."description" "projectDescription",
      po."estimatedTime" "projectEstimatedTime",
      po."repository" "projectRepository",
      po."startDate" "projectStartDate",
      po."endDate" "projectEndDate",
      po."developerId" "projectDeveloperID",
      tc."id" "technologyId",
      tc."name" "technologyName"
  FROM 
      projects po
  LEFT JOIN 
      projects_technologies pt ON po.id = pt."projectId"
  LEFT JOIN 
      technologies tc ON tc.id = pt."technologyId"
  WHERE
      po.id = $1;

  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId],
  };
  const queryResult: iProjectResult = await client.query(queryConfig);

  if (!queryResult.rowCount) {
    return res.status(404).json({
      message: "Project not found.",
    });
  }
  return res.json(queryResult.rows[0]);
};

const updateProjectId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const projectId: number = parseInt(req.params.id);

    const {
      name,
      description,
      estimatedTime,
      repository,
      startDate,
      endDate,
      developerId,
    }: iProjectRequest = req.body;

    const projectData = {
      name,
      description,
      estimatedTime,
      repository,
      startDate,
      endDate,
      developerId,
    };
    const containesAllRequired: boolean = Object.values(projectData).every(
      (key) => !key
    );

    let validate = {};

    !name ? null : (validate = { name, ...validate });
    !description ? null : (validate = { description, ...validate });
    !estimatedTime ? null : (validate = { estimatedTime, ...validate });
    !repository ? null : (validate = { repository, ...validate });
    !startDate ? null : (validate = { startDate, ...validate });
    !endDate ? null : (validate = { endDate, ...validate });
    !developerId ? null : (validate = { developerId, ...validate });

    if (containesAllRequired) {
      return res.status(400).json({
        message: "At least one of those keys must be send.",
        keys: [
          "name",
          "description",
          "estimatedTime",
          "repository",
          "startDate",
          "endDate",
          "developerId",
        ],
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
    const queryConfig: QueryConfig = {
      text: queryString,
      values: [developerId],
    };

    const queryResultDeveloper: developerResult = await client.query(
      queryConfig
    );
    console.log(queryResultDeveloper.rowCount);
    if (developerId && queryResultDeveloper.rowCount === 0) {
      return res.status(404).json({
        message: "Developer not found!",
      });
    }

    const formatString: string = format(
      `
      UPDATE 
          projects
      SET(%I) = ROW(%L)
      WHERE
          id = $1
      RETURNING *;
    `,
      Object.keys(validate),
      Object.values(validate)
    );
    const queryTemplate: QueryConfig = {
      text: formatString,
      values: [projectId],
    };
    const queryResult: iProjectResult = await client.query(queryTemplate);

    return res.json(queryResult.rows[0]);
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

const deleteProject = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);

  let queryString = `
  DELETE 
 
  FROM
      projects
  
  WHERE
      id = $1;
  
  `;
  let queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId],
  };

  await client.query(queryConfig);

  return res.status(204).send();
};

const deleteProjectIdAndName = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, id } = req.params;

  const queryString: string = `
      SELECT 
          *
      FROM
          technologies
      WHERE
          "name" = $1;  
  `;
  let queryConfig: QueryConfig = {
    text: queryString,
    values: [name],
  };
  const queryResultTechnology = await client.query(queryConfig);

  if (queryResultTechnology.rowCount === 0) {
    return res.status(404).json({
      message: "Technology not supported",
      options: [
        "JavaScript",
        "Python",
        "React",
        "Express.js",
        "HTML",
        "CSS",
        "Django",
        "PostgreSQL",
        "MongoDB",
      ],
    });
  }

  const queryTemplate = `
      SELECT
          *
      FROM
          projects_technologies 
      WHERE
          "projectId" = $1 AND "technologyId" = $2; 
   `;
  queryConfig = {
    text: queryTemplate,
    values: [queryResultTechnology.rows[0].id, id],
  };

  const queryResultProjectTechnology = await client.query(queryConfig);

  if (queryResultProjectTechnology.rowCount === 0) {
    return res.status(404).json({
      message: `Technology ${name} not found on this Project.`,
    });
  }
  const queryTemplateDelete: string =
   `
      DELETE  

          FROM

          projects_technologies
          
      WHERE
          id = $1;
   `;
  queryConfig = {
    text: queryTemplateDelete,
    values: [queryResultProjectTechnology.rows[0].id],
  };

  await client.query(queryConfig);
  
  return res.status(204).send();
};

export {
  createProjects,
  listProjects,
  listProjectsId,
  updateProjectId,
  deleteProject,
  createTechnologiesandIdProject,
  deleteProjectIdAndName,
};
