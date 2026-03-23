module.exports = {
    client: {
      service: {
        name: "hasura-midcodes1",
        url: "http://hasura-midcodes1.herokuapp.com/v1/graphql",
      },
      includes: ['**/routes/**/*.{gql,graphql,js,svelte}'],
    }
  };