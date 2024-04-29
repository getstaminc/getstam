// return `<li>${awayTeam} - ${awayScore} </br>
//                       ${homeTeam} - ${homeScore}</li>`;

const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;
const apiKey = '489331b7e9ff5b17f6f37e664ba10c08';

app.use(express.static('public'));

app.get('/api/sports', async (req, res) => {
  try {
    const apiUrl = `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`;
    const response = await axios.get(apiUrl);

    // Check if the response is an array
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response format from the API');
    }

    const sports = response.data;
    res.json(sports);
  } catch (error) {
    console.error('Error fetching sports:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/sports/:sportKey', async (req, res) => {
  const sportKey = req.params.sportKey;
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

  const style = `
      <style>
        header {
          background-color: #f8f9fa;
          padding: 10px 20px;
          text-align: center;
        }
        nav a {
          text-decoration: none;
          color: #007bff;
          font-size: 16px;
        }
      </style>
    `;
  // Header to be included in every rendered page
  const headerHtml = `
      <header>
        <nav>
          <a href="/">Home</a>
        </nav>
        <h1>${sportKey} Scores and Odds</h1>
      </header>
    `;
  try {
    const apiUrlScores = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=1&dateFormat=iso`;
    const apiUrlOdds = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&bookmakers=bovada&markets=h2h,spreads,totals&oddsFormat=american`;

    const [scoresResponse, oddsResponse] = await Promise.all([
      axios.get(apiUrlScores),
      axios.get(apiUrlOdds)
    ]);

    // Log API responses for debugging
    console.log(`Scores API Response:`, scoresResponse.data);
    console.log(`Odds API Response:`, oddsResponse.data);

    // Filter scores for only today's games
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999); // Set to end of today

    const scores = scoresResponse.data.filter(score => {
      const matchTime = new Date(score.commence_time);
      return matchTime >= today && matchTime <= endOfToday;
    });
    const odds = oddsResponse.data;

    const datePickerScript = `
      <script>
        function updateGames() {
          const selectedDate = document.getElementById('datepicker').value;
          fetch('/api/sports/${sportKey}?date=' + selectedDate)
            .then(response => response.json())
            .then(data => {
              // Update games display based on the response data
              // For example:
              // document.getElementById('gamesList').innerHTML = ...;
            })
            .catch(error => console.error('Error fetching games:', error));
        }
      </script>
    `;
    const datePickerHtml = `
    <label for="datepicker">Select Date:</label>
    <input type="date" id="datepicker" value="${currentDate}" onchange="updateGames()">
  `;
     

    res.send(`
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sportKey} - Sports App</title>
        ${style}
        ${datePickerScript} 
        <script>
          function updateGames() {
            const selectedDate = document.getElementById('datepicker').value;
            fetch('/api/sports/${sportKey}?date=' + selectedDate)
              .then(response => response.json())
              .then(data => {
                // Update games display based on the response data
                // For example:
                // document.getElementById('gamesList').innerHTML = ...;
              })
              .catch(error => console.error('Error fetching games:', error));
              }
        </script> 
      </head>
      <body>
        ${headerHtml}
        ${datePickerHtml}
      <ul>
        ${scores.map(match => {
          const homeTeam = match.home_team || 'N/A';
          const awayTeam = match.away_team || 'N/A';
          const homeScore = match.scores ? (match.scores[0] && match.scores[0].score) || 'N/A' : 'N/A';
          const awayScore = match.scores ? (match.scores[1] && match.scores[1].score) || 'N/A' : 'N/A';

          // Find odds for the current match using match ID
          const matchOdds = odds.find(oddsMatch => oddsMatch.id === match.id);
          const oddsText = matchOdds
            ? `(${matchOdds.bookmakers.flatMap(bookmaker =>
                bookmaker.markets.flatMap(market =>
                  market.outcomes.map(outcome => `${market.key}: ${outcome.name} - ${outcome.price}`)
                )
              ).join(', ')})`
            : 'N/A';

          return `<li>${awayTeam} vs ${homeTeam} - ${awayScore} : ${homeScore} ${oddsText}</li>`;
        }).join('')}
      </ul>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(`Error fetching data for ${sportKey}:`, error.message);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
