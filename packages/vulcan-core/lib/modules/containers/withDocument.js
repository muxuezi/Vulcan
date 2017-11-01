import React, { PropTypes, Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { getFragment, getFragmentName } from 'meteor/vulcan:core';

export default function withDocument (options) {
  
  const { collection, pollInterval = 20000 } = options,
        queryName = options.queryName || `${collection.options.collectionName}SingleQuery`,
        singleResolverName = collection.options.resolvers.single && collection.options.resolvers.single.name;

  let fragment;

  if (options.fragment) {
    fragment = options.fragment;
  } else if (options.fragmentName) {
    fragment = getFragment(options.fragmentName);
  } else {
    fragment = getFragment(`${collection.options.collectionName}DefaultFragment`);
  }

  const fragmentName = getFragmentName(fragment);

  return graphql(gql`
    query ${queryName}($documentId: String, $slug: String) {
      ${singleResolverName}(documentId: $documentId, slug: $slug) {
        __typename
        ...${fragmentName}
      }
    }
    ${fragment}
  `, {
    alias: 'withDocument',
    
    options(ownProps) {
      const graphQLOptions = {
        variables: { documentId: ownProps.documentId, slug: ownProps.slug },
        pollInterval, // note: pollInterval can be set to 0 to disable polling (20s by default)
      };

      if (options.fetchPolicy) {
        graphQLOptions.fetchPolicy = options.fetchPolicy;
      }

      return graphQLOptions;
    },
    props: returnedProps => {
      const { ownProps, data } = returnedProps;
      const propertyName = options.propertyName || 'document';
      return {
        loading: data.loading,
        // document: Utils.convertDates(collection, data[singleResolverName]),
        [ propertyName ]: data[singleResolverName],
        fragmentName,
        fragment,
      };
    },
  });
}
