app.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { lob, techStack } = req.body;

  try {
    // Fetch the existing user data
    const { body } = await client.get({
      index: 'users',
      id: userId
    });

    const existingUser = body._source;

    // Update only the fields provided
    const updatedUser = {
      ...existingUser,
      ...(lob !== undefined && { lob }), // Update lob if provided
      ...(techStack !== undefined && { tech_stack: techStack }) // Update tech_stack if provided
    };

    await client.update({
      index: 'users',
      id: userId,
      body: {
        doc: updatedUser
      }
    });

    res.send({ message: 'User profile updated' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to update user profile' });
  }
}); 
