// in public/js/sports.js
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/sports')
      .then(response => response.json())
      .then(sports => {
        const sportsList = document.getElementById('sportsList');
        sports.forEach(sport => {
          const listItem = document.createElement('li');
          const link = document.createElement('a');
          link.href = `/sports/${sport.key}`;
          link.textContent = sport.title;
          listItem.appendChild(link);
          sportsList.appendChild(listItem);
        });
      })
      .catch(error => console.error('Error fetching sports:', error));
  });