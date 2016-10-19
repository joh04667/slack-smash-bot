## overview:

Smash Bot will be in a channel and track winners of previous tournaments.

A command will tell Smash Bot to start a tourney. It will post a link that will send an API GET request with the user's username. Once all users are in the tourney, a second Smash Bot command will close the tourney, post a tournament tree, and begin.


#### sample message object
{ type: 'message',
  channel: 'C2RDK6ZCJ',
  user: 'U1KSH9URL',
  text: 'test message',
  ts: '1476891140.000009',
  team: 'T1KSTTBBL' }
