import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import axios from "axios";

const ado = axios.create({
  baseURL: "https://vfuk-digital.visualstudio.com/Digital/_apis/git",
});
const region = "eu-west-1";

let _auth;
const auth = async () => {
  if (!_auth) {
    const { GIT_PASSWORD, GIT_USERNAME } = await secrets();
    _auth = { username: GIT_USERNAME, password: GIT_PASSWORD };
  }
  return _auth;
};

let _secrets;
const secrets = async () => {
  if (!_secrets) {
    const client = new STSClient({ region });
    const credentials = (
      await client.send(
        new AssumeRoleCommand({
          RoleArn: "arn:aws:iam::000000000000:role/alexa-voda-coda-skill",
          RoleSessionName: "AlexaVodaCodeSkill",
        })
      )
    ).Credentials;
    const secretsManager = new SecretsManagerClient({
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
      },
      region,
    });
    const secretString = (
      await secretsManager.send(
        new GetSecretValueCommand({
          SecretId: "alexa-voda-code-skill",
        })
      )
    ).SecretString;
    _secrets = JSON.parse(secretString);
  }
  return _secrets;
};

export const commits = async (repositoryId, count) => {
  const response = await ado.get(
    `/repositories/${repositoryId}/commits?$top=${count}`,
    {
      auth: await auth(),
    }
  );
  return response.data;
};

export const pullRequests = async (repositoryId, status) => {
  const response = await ado.get(
    `/repositories/${repositoryId}/pullrequests?searchCriteria.status=${status}`,
    {
      auth: await auth(),
    }
  );
  return response.data;
};

const normalizeRepository = (repository) =>
  repository.replace(/[\W_]/g, "").toLowerCase();

export const repositories = async (repositoryName) => {
  const response = await ado.get(`/repositories`, {
    auth: await auth(),
  });
  if (repositoryName) {
    const repositories = response.data.value.filter((repository) =>
      normalizeRepository(repository.name).startsWith(
        normalizeRepository(repositoryName)
      )
    );
    for (const repository of repositories) {
      if (
        normalizeRepository(repository.name) ===
        normalizeRepository(repositoryName)
      ) {
        return { value: [repository], count: 1 };
      }
    }
    return { value: repositories, count: repositories.length };
  }
  return response.data;
};

export default {
  commits,
  pullRequests,
  repositories,
};
