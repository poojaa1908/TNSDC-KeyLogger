    const { body: initialResponse } = await client.search({
      index: 'your-index', // Replace with your index name
      body: body
    });

    console.log('Elasticsearch Initial Response:', JSON.stringify(initialResponse, null, 2)); // Log the initial response

    // Process aggregation buckets
    const buckets = initialResponse.aggregations && initialResponse.aggregations[column] ? initialResponse.aggregations[column].buckets : [];

    // Prepare results with aggregated data
    const results = buckets.map(bucket => ({
      key: bucket.key,
      doc_count: bucket.doc_count,
      // Add any other fields or data from aggregation buckets as needed
    }));

    return results;
