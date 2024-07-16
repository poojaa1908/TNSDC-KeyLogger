app.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await client.delete({
      index: 'users',
      id: userId
    });
    res.send({ message: 'User deleted', result: response.result });
  } catch (error) {
    console.error(error);
    if (error.meta && error.meta.body && error.meta.body.found === false) {
      res.status(404).send({ error: 'User not found' });
    } else {
      res.status(500).send({ error: 'Failed to delete user' });
    }
  }
});

app.get('/users/:userId/exists', async (req, res) => {
  const { userId } = req.params;

  try {
    const { body } = await client.exists({
      index: 'users',
      id: userId
    });
    res.send({ exists: body });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to check user existence' });
  }
});
