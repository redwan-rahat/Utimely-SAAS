import { createYoga } from "graphql-yoga";

import { schema } from "@/graphql/schema";

import { createContext } from "@/graphql/context";

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  context: createContext,
});

export const GET = (request: Request) => {
  return handleRequest(request, {});
};

export const POST = (request: Request) => {
  return handleRequest(request, {});
};