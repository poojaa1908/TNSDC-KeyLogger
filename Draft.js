const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const bodyParser = require('body-parser');

const app = express();
const client = new Client({ node: 'http://localhost:9200' });
const indexName = 'user_checklist';

app.use(bodyParser.json());

// Route to update checklist for a specific field
app.put('/update/:field', async (req, res) => {
  const field = req.params.field;
  const { oldValue, newValue } = req.body;

  try {
    // Query documents where the field matches the old value
    const { body: searchBody } = await client.search({
      index: indexName,
      body: {
        query: {
          match: {
            [field]: oldValue
          }
        }
      }
    });

    // Extract document IDs from search results
    const documentsToUpdate = searchBody.hits.hits.map(hit => hit._id);

    // Bulk update operation
    const body = documentsToUpdate.flatMap(id => [
      { update: { _index: indexName, _id: id } },
      { doc: { [field]: newValue } }
    ]);

    // Execute bulk update
    const { body: bulkResponse } = await client.bulk({ refresh: true, body });

    res.status(200).json({ message: 'Documents updated', bulkResponse });
  } catch (error) {
    res.status(500).json({ message: 'Error updating documents', error });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
