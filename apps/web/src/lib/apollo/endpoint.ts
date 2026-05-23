const DEFAULT_GRAPHQL_ENDPOINT = "http://localhost:3001/graphql";

export function getGraphqlEndpoint() {
  if (process.env.NEXT_PUBLIC_GRAPHQL_URL) {
    return process.env.NEXT_PUBLIC_GRAPHQL_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/graphql`;
  }

  return DEFAULT_GRAPHQL_ENDPOINT;
}
