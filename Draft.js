const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const bodyParser = require('body-parser');

const app = express();
const client = new Client({ node: 'http://localhost:9200' });
const indexName = 'user_checklist';

app.use(bodyParser.json());

// Route to insert a new document
app.post('/insert', async (req, res) => {
  const document = req.body;

  try {
    const { body } = await client.index({
      index: indexName,
      body: document
    });
    res.status(200).json({ message: 'Document inserted', body });
  } catch (error) {
    res.status(500).json({ message: 'Error inserting document', error });
  }
});

// Route to get checklists by persona field
app.get('/checklists/:field', async (req, res) => {
  const field = req.params.field;

  try {
    const { body } = await client.search({
      index: indexName,
      _source: [field],
      query: {
        match_all: {}
      }
    });
    res.status(200).json({ message: 'Checklists retrieved', checklists: body.hits.hits });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving checklists', error });
  }
});

// Route to update a checklist for a specific persona
app.put('/update/:field', async (req, res) => {
  const field = req.params.field;
  const { documentId, newChecklist } = req.body;

  try {
    const { body } = await client.update({
      index: indexName,
      id: documentId,
      body: {
        doc: {
          [field]: newChecklist
        }
      }
    });
    res.status(200).json({ message: 'Checklist updated', body });
  } catch (error) {
    res.status(500).json({ message: 'Error updating checklist', error });
  }
});

// Route to delete an item from a checklist for a specific persona
app.delete('/delete/:field', async (req, res) => {
  const field = req.params.field;
  const { documentId, itemToDelete } = req.body;

  try {
    // Get the current checklist
    const { body: getBody } = await client.get({
      index: indexName,
      id: documentId
    });

    let checklist = getBody._source[field];
    if (!checklist) {
      return res.status(404).json({ message: 'Field not found' });
    }

    // Remove the item from the checklist
    checklist = checklist.filter(item => item !== itemToDelete);

    // Update the document with the new checklist
    const { body } = await client.update({
      index: indexName,
      id: documentId,
      body: {
        doc: {
          [field]: checklist
        }
      }
    });
    res.status(200).json({ message: 'Item deleted from checklist', body });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item from checklist', error });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
