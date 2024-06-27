const { Client } = require('@elastic/elasticsearch');
const express = require('express');
const bodyParser = require('body-parser');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();

app.use(bodyParser.json());

const INDEX_NAME = 'incidents_v2';

app.get('/top_apps', async (req, res) => {
  const { startDate, endDate, size = 5 } = req.query;

  const queryObj = {
    bool: {
      must: [],
      filter: []
    }
  };

  if (startDate || endDate) {
    const dateRange = {};
    if (startDate) dateRange.gte = startDate;
    if (endDate) dateRange.lte = endDate;
    queryObj.bool.filter.push({ range: { issue_start_date: dateRange } });
  }

  try {
    const body = {
      size: 0,  // We're only interested in the aggregations
      query: queryObj,
      aggs: {
        by_app_name: {
          terms: {
            field: 'app_name.keyword',  // Ensure the field is keyword for terms aggregation
            size: 10000  // Adjust if needed
          },
          aggs: {
            mean_time_to_resolve: {
              avg: {
                script: {
                  source: "if (doc['issue_end_date'].size() > 0 && doc['issue_start_date'].size() > 0) { return doc['issue_end_date'].value.toInstant().toEpochMilli() - doc['issue_start_date'].value.toInstant().toEpochMilli(); } else { return 0; }"
                }
              }
            },
            sorted_bucket: {
              bucket_sort: {
                sort: [
                  { "mean_time_to_resolve": { order: "desc" } }
                ],
                size: parseInt(size)
              }
            },
            top_incidents: {
              top_hits: {
                _source: {
                  includes: ['app_name', 'issue_start_date', 'issue_end_date', 'severity', 'channel_name']  // Add any other fields you want to return
                },
                size: 5  // Adjust the number of incidents to return per app
              }
            }
          }
        }
      }
    };

    const startTime = Date.now();
    const response = await client.search({ index: INDEX_NAME, body });
    const endTime = Date.now();
    const timeTaken = response.body.took;

    console.log(`Query executed in ${timeTaken}ms (Server Time: ${endTime - startTime}ms)`);

    res.json(response.aggregations.by_app_name.buckets);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).send('Error performing search');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
