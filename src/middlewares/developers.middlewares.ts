import { NextFunction, Request, Response } from "express";
import { QueryConfig } from "pg";
import { client } from "../database";

const ensureDevelopersExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const developersId: number = parseInt(req.params.id);

  const queryString: string = `
        SELECT
            COUNT(*)
        FROM
            developers
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
    message: "Developer not found!",
  });
};

export { ensureDevelopersExists };
