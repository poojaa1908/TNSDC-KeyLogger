const { Client } = require('@elastic/elasticsearch');
const express = require('express');
const bodyParser = require('body-parser');

const client = new Client({ node: 'http://localhost:9200' });
const app = express();

app.use(bodyParser.json());

const INDEX_NAME = 'incidents_v2';

// Function to get unique key names
const getUniqueKeyNames = async (field) => {
  try {
    const body = {
      size: 0, // We're only interested in the aggregations
      aggs: {
        unique_keys: {
          terms: {
            field: field,
            size: 10000 // Adjust size if needed
          }
        }
      }
    };

    const response = await client.search({ index: INDEX_NAME, body });
    return response.aggregations.unique_keys.buckets.map(bucket => bucket.key);
  } catch (error) {
    console.error(`Error fetching unique ${field}:`, error);
    throw error;
  }
};

// Endpoint to get unique app names
app.get('/unique_app_names', async (req, res) => {
  try {
    const uniqueAppNames = await getUniqueKeyNames('app_name');
    res.json(uniqueAppNames);
  } catch (error) {
    res.status(500).send('Error fetching unique app names');
  }
});

// Endpoint to get unique channel names
app.get('/unique_channel_names', async (req, res) => {
  try {
    const uniqueChannelNames = await getUniqueKeyNames('channel_name');
    res.json(uniqueChannelNames);
  } catch (error) {
    res.status(500).send('Error fetching unique channel names');
  }
});

// Endpoint to get unique categories
app.get('/unique_categories', async (req, res) => {
  try {
    const uniqueCategories = await getUniqueKeyNames('category');
    res.json(uniqueCategories);
  } catch (error) {
    res.status(500).send('Error fetching unique categories');
  }
});

// Endpoint to get unique severities
app.get('/unique_severities', async (req, res) => {
  try {
    const uniqueSeverities = await getUniqueKeyNames('severity');
    res.json(uniqueSeverities);
  } catch (error) {
    res.status(500).send('Error fetching unique severities');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
