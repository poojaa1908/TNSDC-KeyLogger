const { Client } = require('@elastic/elasticsearch');
const express = require('express');
const bodyParser = require('body-parser');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();

app.use(bodyParser.json());

const INDEX_NAME = 'incidents_v2';

app.get('/heatmap_channel_severity', async (req, res) => {
  try {
    // Refresh the index to ensure we have the latest data
    await client.indices.refresh({ index: INDEX_NAME });

    const body = {
      size: 0, // We are only interested in the aggregations
      aggs: {
        by_channel_name: {
          terms: {
            field: 'channel_name',
            size: 10000 // Adjust the size as needed
          },
          aggs: {
            by_severity: {
              terms: {
                field: 'severity',
                size: 100 // Adjust the size as needed
              }
            }
          }
        }
      }
    };

    const response = await client.search({ index: INDEX_NAME, body });

    // Format the response to create a heatmap data structure
    const buckets = response.aggregations.by_channel_name.buckets;
    const heatmapData = {};

    buckets.forEach(channelBucket => {
      const channelName = channelBucket.key;
      heatmapData[channelName] = {};
      channelBucket.by_severity.buckets.forEach(severityBucket => {
        heatmapData[channelName][severityBucket.key] = severityBucket.doc_count;
      });
    });

    res.json(heatmapData);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).send('Error performing search');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
