import ApolloClient from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { WebSocketLink } from "apollo-link-ws";
import { split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { getMainDefinition } from "apollo-utilities";
import fetch from "isomorphic-fetch"

const headers = { 'content-type': 'application/json' , 'x-hasura-admin-secret':'1234' };
const getHeaders = () => {
  return headers;
};

const cache = new InMemoryCache();

const wsLink = process.browser ? new WebSocketLink({
  uri: "wss://hasura-gate.herokuapp.com/v1/graphql",
  options: {
    reconnect: true,
    lazy: true,
    connectionParams: () => {
      return { headers: getHeaders() };
    },
  },
}) : null;


const httpLink = new HttpLink({
  uri: "https://hasura-gate.herokuapp.com/v1/graphql",
  fetch,
  headers: getHeaders()
});


const link = process.browser ? split( //only create the split in the browser
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
) : httpLink;

export const client = new ApolloClient({
  link,
  cache
});

