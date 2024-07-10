const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const bodyParser = require('body-parser');

const app = express();
const client = new Client({ node: 'http://localhost:9200' });
const indexName = 'user_checklist';

app.use(bodyParser.json());

// Route to "delete" documents based on a field value
app.delete('/delete/:field', async (req, res) => {
  const field = req.params.field;
  const { valueToDelete } = req.body;

  try {
    // Use update_by_query to "delete" documents
    const { body: updateResponse } = await client.updateByQuery({
      index: indexName,
      body: {
        script: {
          lang: 'painless',
          source: `ctx._source.remove('${field}')`
        },
        query: {
          match: {
            [field]: valueToDelete
          }
        }
      }
    });

    res.status(200).json({ message: 'Documents "deleted"', updateResponse });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting documents', error });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});q
