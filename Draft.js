const { Client } = require('@elastic/elasticsearch');
const express = require('express');
const bodyParser = require('body-parser');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();

app.use(bodyParser.json());

const INDEX_NAME = 'incidents_v2';

app.get('/incidents_per_month', async (req, res) => {
  try {
    // Refresh the index to ensure we have the latest data
    await client.indices.refresh({ index: INDEX_NAME });

    const body = {
      size: 0, // We are only interested in the aggregations
      aggs: {
        incidents_by_year: {
          date_histogram: {
            field: 'issue_start_date',
            calendar_interval: 'month',
            format: 'yyyy-MM' // Format date as year-month
          },
          aggs: {
            incidents_count: {
              value_count: {
                field: 'issue_start_date'
              }
            }
          }
        }
      }
    };

    const response = await client.search({ index: INDEX_NAME, body });
    
    // Format the response to have a structure suitable for line graph plotting
    const buckets = response.aggregations.incidents_by_year.buckets;
    const result = {};

    buckets.forEach(bucket => {
      const [year, month] = bucket.key_as_string.split('-');
      if (!result[year]) {
        result[year] = Array(12).fill(0); // Initialize an array for each month
      }
      result[year][parseInt(month) - 1] = bucket.incidents_count.value; // Assign count to respective month
    });

    // Create a final structured response
    const formattedResponse = Object.keys(result).map(year => ({
      year,
      counts: result[year]
    }));

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).send('Error performing search');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
