import express, { Application } from "express";
import { startDataBase } from "./database";
import {
  createDeveloper,
  createDeveloperInfos,
  deleteDeveloper,
  listDeveloperIdAndProject,
  listDevelopers,
  listDevelopersInfo,
  updateDeveloperInfo,
  updateDevelopersInfosId,
} from "./logics/developers.logics";
import { ensureDevelopersExists } from "./middlewares/developers.middlewares";
import {
  ensureEmailAlreadyExists,
  ensureProjectsExists,
} from "./middlewares/projects.middlewares";
import {
  createProjects,
  createTechnologiesandIdProject,
  deleteProject,
  deleteProjectIdAndName,
  listProjects,
  listProjectsId,
  updateProjectId,
} from "./logics/projects.logics";

const app: Application = express();

app.use(express.json());

app.post("/developers", ensureEmailAlreadyExists, createDeveloper);
app.get("/developers", listDevelopers);
app.get("/developers/:id", ensureDevelopersExists, listDevelopersInfo);
app.get(
  "/developers/:id/projects",
  ensureDevelopersExists,
  listDeveloperIdAndProject
);
app.patch(
  "/developers/:id",
  ensureDevelopersExists,
  ensureEmailAlreadyExists,
  updateDeveloperInfo
);
app.delete("/developers/:id", ensureDevelopersExists, deleteDeveloper);
app.post("/developers/:id/infos", ensureDevelopersExists, createDeveloperInfos);
app.patch(
  "/developers/:id/infos",
  ensureDevelopersExists,
  updateDevelopersInfosId
);

app.post("/projects", createProjects);
app.post(
  "/projects/:id/technologies",
  ensureProjectsExists,
  createTechnologiesandIdProject
);
app.get("/projects", listProjects);
app.get("/projects/:id", listProjectsId);
app.patch("/projects/:id", ensureProjectsExists, updateProjectId); 
app.delete("/projects/:id/technologies/:name", ensureProjectsExists, deleteProjectIdAndName); 
app.delete("/projects/:id", ensureProjectsExists, deleteProject);

app.listen(3000, async () => {
  console.log("server is running!");
  await startDataBase();
});
