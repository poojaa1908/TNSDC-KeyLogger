 const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const port = 3000;

const client = new Client({ node: 'http://localhost:9200' });

// Middleware
app.use(bodyParser.json());

// Define the user schema
const userSchema = {
  index: 'users',
  body: {
    mappings: {
      properties: {
        user_id: { type: 'keyword' },
        lob: { type: 'text' },
        tech_stack: { type: 'keyword' },
        last_login_date: { type: 'date' }
      }
    }
  }
};

// Create the index with the schema
async function createIndex() {
  try {
    const exists = await client.indices.exists({ index: 'users' });
    if (!exists) {
      await client.indices.create(userSchema);
      console.log('Index created successfully');
    } else {
      console.log('Index already exists');
    }
  } catch (error) {
    console.error('Error creating index:', error);
  }
}

// Endpoint to add a new user
app.post('/addUser', async (req, res) => {
  const user = req.body;
  try {
    await client.index({
      index: 'users',
      body: user
    });
    res.status(201).send('User added successfully');
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send('Error adding user');
  }
});

// Initialize the index and start the server
createIndex().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
