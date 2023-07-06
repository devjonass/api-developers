import { NextFunction, Request, Response } from "express";
import { QueryConfig } from "pg";
import { client } from "../database";
import { developerResult } from "../interfaces/developers.interfaces";

const ensureProjectsExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const developersId: number = parseInt(req.params.id);

  const queryString: string = `
        SELECT
            COUNT(*)
        FROM
            projects
        WHERE 
            id = $1;
    `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [developersId],
  };

  const queryResult = await client.query(queryConfig);

  if (Number(queryResult.rows[0].count) > 0) {
    return next();
  }

  return res.status(404).json({
    message: "Projects not found!",
  });
};

const ensureEmailAlreadyExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const { email } = req.body;

  if (email) {
    const queryString = `
      SELECT 
          *
      FROM
          developers
      WHERE 
          email = $1;
    
    `;
    const queryConfig: QueryConfig = {
      text: queryString,
      values: [email],
    };
    const queryResultEmail: developerResult = await client.query(queryConfig);
    const result = queryResultEmail.rows;
    if (result.length !== 0) {
      return res.status(409).json({
        message: "Email already exists.",
      });
    }
  }
  return next();
};
export { ensureProjectsExists, ensureEmailAlreadyExists };
