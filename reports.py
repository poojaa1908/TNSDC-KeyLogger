const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' }); // Replace with your Elasticsearch server URL

const searchDataWithAggregations = async (filterMeanTime) => {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const sortOrder = filterMeanTime === 'high' ? 'desc' : 'asc';

  const searchQuery = {
    index: 'your-index', // Replace with your index name
    body: {
      _source: ['issue_id', 'category', 'your_date_field'], // Specify the fields you want to include
      query: {
        range: {
          your_date_field: { // Replace with your date field name
            gte: oneWeekAgo.toISOString(),
            lte: now.toISOString(),
            format: "strict_date_optional_time"
          }
        }
      },
      sort: [
        {
          "issue_end_date": {
            "order": sortOrder
          }
        },
        {
          "issue_start_date": {
            "order": sortOrder
          }
        }
      ],
      aggs: {
        issues_by_category: {
          terms: {
            field: 'category.keyword' // Replace with your category field
          }
        }
      }
    }
  };

  try {
    console.log('Elasticsearch Query:', JSON.stringify(searchQuery, null, 2)); // Log the query

    const { body: initialResponse } = await client.search(searchQuery);

    console.log('Elasticsearch Initial Response:', JSON.stringify(initialResponse, null, 2)); // Log the initial response

    const buckets = initialResponse.aggregations.issues_by_category.buckets;

    const results = await Promise.all(buckets.map(async (bucket) => {
      const { body: bucketDocsResponse } = await client.search({
        index: 'your-index', // Replace with your index name
        body: {
          _source: ['issue_id', 'category', 'your_date_field'], // Specify the fields you want to include
          query: {
            bool: {
              must: [
                { match: { "category.keyword": bucket.key } },
                {
                  range: {
                    your_date_field: { // Replace with your date field name
                      gte: oneWeekAgo.toISOString(),
                      lte: now.toISOString(),
                      format: "strict_date_optional_time"
                    }
                  }
                }
              ]
            }
          },
          sort: [
            {
              "issue_end_date": {
                "order": sortOrder
              }
            },
            {
              "issue_start_date": {
                "order": sortOrder
              }
            }
          ]
        }
      });

      return {
        key: bucket.key,
        doc_count: bucket.doc_count,
        incidents: bucketDocsResponse.hits.hits
      };
    }));

    return results;
  } catch (error) {
    console.error('Elasticsearch Error:', error); // Log any errors
    throw new Error(error.message);
  }
};

module.exports = { searchDataWithAggregations };
